// chrome.runtime.onInstalled.addListener(function() {
//     chrome.storage.local.set({ record: false });
//     chrome.storage.local.set({ replay: false });
// });
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.request) {
        recordRequest(request.request);
    };
    sendResponse({success: true});
});

var count = 0;
var debuggee;
var requests = {};
var hostnames = {};
var exactMatch = {};
var nearMatch = {};
var origin;
var context;
var status = 'idle';

function getStatus() {
    return status;
}

function getContext() {
    return context;
}

function getContexts() {
    return JSON.parse(localStorage.getItem('contexts') || '[]');
}

function startRecord(contextName) {
    console.log('Start recording ' + contextName);
    status = 'recording';
    context = contextName;
    chrome.browserAction.setIcon({ path: 'record.png' });
    chrome.tabs.executeScript({
        file: 'content.js'
    });
}

function stopRecord() {
    chrome.browserAction.setIcon({ path: 'icon.png' });
    status = 'idle';
    localStorage.setItem('requests-' + context, JSON.stringify(requests));
    localStorage.setItem('hostnames-' + context, JSON.stringify(hostnames));
    var contexts = JSON.parse(localStorage.getItem('contexts') || '[]');
    if (contexts.indexOf(context) === -1) {
        contexts.push(context);
        localStorage.setItem('contexts', JSON.stringify(contexts));
    }
}

function startPlay(contextName) {
    chrome.browserAction.setIcon({ path: 'play.png' });
    status = 'playing';
    context = contextName;
    loadRequests();
    startProxy();
}

function stopPlay() {
    chrome.browserAction.setIcon({ path: 'icon.png' });
    status = 'idle';
    chrome.debugger.attach(debuggee, '1.2', () => {
        chrome.debugger.sendCommand(debuggee, 'Network.setRequestInterceptionEnabled', { enabled: false });
    });
    chrome.debugger.onEvent.removeListener(rewriteResponse);
    chrome.debugger.detach(debuggee);
}

function recordRequest(request) {
    requests[count] = request;
    count ++;
    hostnames[getHost(request.url)] = true;
}

function loadRequests() {
    requests = JSON.parse(localStorage.getItem('requests-' + context) || '{}');
    hostnames = JSON.parse(localStorage.getItem('hostnames-' + context) || '{}');
    Object.keys(requests).forEach(id => {
        var request = requests[id];
        exactMatch[getExactKey(request)] = id;
        nearMatch[getSimpleKey(request)] = id;
        nearMatch[getNearKey(request)] = id;
    });
}

function getExactKey(request) {
    var key = {
        url: request.url,
        method: request.method,
        body: request.requestBody,
    };
    return JSON.stringify(key);
}

function getSimpleKey(request) {
    var key = {
        path: request.url.split('?')[0],
        method: request.method,
    };
    return JSON.stringify(key);
}

function getNearKey(request) {
    var key = {
        path: getHost(request.url) + '/' + request.url.split('?')[0].split('/').splice(-1),
        method: request.method,
    };
    return JSON.stringify(key);
}

function startProxy() {
    console.log('Start playing ' + context);
    chrome.debugger.getTargets((targets) => {
        let target = targets.find(t => t.type === 'page' && t.attached);
        debuggee = { targetId: target.id };
        origin = getHost(target.url);
    
        chrome.debugger.attach(debuggee, '1.2', () => {
            chrome.debugger.sendCommand(debuggee, 'Network.setRequestInterception', {patterns: [{ urlPattern: '*' }]});
        });
    
        chrome.debugger.onEvent.addListener(rewriteResponse);
    });
}

function rewriteResponse(source, method, params) {
    if(source.targetId === debuggee.targetId && method === 'Network.requestIntercepted') {
        var request = params.request;
        var continueParams = {
            interceptionId: params.interceptionId,
        };
        if (isCachedHost(request.url)) {
            var responseLines = [];
            if (request.method !== 'OPTIONS') {
                response = getBestResponse(request);
                responseLines.push(`HTTP/1.1 ${response.status}`);
                responseLines.push(`Access-Control-Allow-Origin: ${origin}`);
                responseLines.push('Access-Control-Allow-Credentials: true');
                responseLines.push('Content-Type: application/json');
                responseLines.push(`Content-Length: ${response.size}`);
                responseLines.push(`Repeat-After-Me-Context: ${context}`);
                responseLines.push('');
                responseLines.push('');
                responseLines.push(response.body);
            } else {
                responseLines.push('HTTP/1.1 200 OK');
                responseLines.push(`Access-Control-Allow-Origin: ${origin}`);
                responseLines.push('Access-Control-Allow-Credentials: true');
                responseLines.push('Content-Length: 0');
                responseLines.push(`Repeat-After-Me-Context: ${context}`);
                responseLines.push('Access-Control-Allow-Headers: Accept, Authorization, Content-Type, X-Custom-Header, DNT, X-CustomHeader, Keep-Alive, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control');
                responseLines.push('');
                responseLines.push('');
            }
            continueParams.rawResponse = btoa(responseLines.join('\r\n'));
        }
        chrome.debugger.sendCommand(debuggee, 'Network.continueInterceptedRequest', continueParams);
    }
}

function getBestResponse(request) {
    var reqId;
    reqId = exactMatch[getExactKey(request)];
    if (!reqId) {
        reqId = nearMatch[getSimpleKey(request)];
    }
    if (!reqId) {
        reqId = nearMatch[getNearKey(request)];
    }
    if (reqId) {
        return {
            body: requests[reqId].responseBody,
            status: `${requests[reqId].status} ${requests[reqId].statusText}`,
            size: requests[reqId].responseBody.length,
        };
    } else {
        return {
            body: '{}',
            status: '200 OK',
            size: 2,
        };
    }
}

function getHost(url) {
    return url.split('/').slice(0,3).join('/');
}

function isCachedHost(url) {
    return hostnames[getHost(url)];
}
