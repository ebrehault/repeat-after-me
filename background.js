chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ record: false });
    chrome.storage.local.set({ replay: false });
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.request) {
        recordRequest(request.request);
    };
    sendResponse({success: true});
});

var count = 0;
var debuggee;
var requests = {};
var exactMatch = {};
var nearMatch = {};
var origin;
var context = 'CONTEXT';

function startRecord() {
    console.log('Start recording');
    chrome.browserAction.setIcon({ path: 'record.png' });
    chrome.storage.local.set({ record: true });
    chrome.tabs.executeScript({
        file: 'content.js'
    });
}

function stopRecord() {
    chrome.browserAction.setIcon({ path: 'icon.png' });
    chrome.storage.local.set({ record: false });
    localStorage.setItem('repeat-after-' + context, JSON.stringify(requests));
}

function startPlay() {
    chrome.browserAction.setIcon({ path: 'play.png' });
    chrome.storage.local.set({ play: true });
    loadRequests();
    startProxy();
}

function stopPlay() {
    chrome.browserAction.setIcon({ path: 'icon.png' });
    chrome.storage.local.set({ play: false });
    chrome.debugger.attach(debuggee, '1.2', () => {
        chrome.debugger.sendCommand(debuggee, 'Network.setRequestInterceptionEnabled', { enabled: false });
    });
    chrome.debugger.onEvent.removeListener(rewriteResponse);
}

function recordRequest(request) {
    requests[count] = request;
    count ++;
}

function loadRequests() {
    requests = JSON.parse(localStorage.getItem('repeat-after-' + context) || '{}');
    Object.keys(requests).forEach(id => {
        var request = requests[id];
        exactMatch[getExactKey(request)] = id;
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

function getNearKey(request) {
    var key = {
        path: request.url.split('?')[0],
        method: request.method,
    };
    return JSON.stringify(key);
}

function startProxy() {
    console.log('START');
    chrome.debugger.getTargets((targets) => {
        let target = targets.find(t => t.type === 'page' && t.attached);
        debuggee = { targetId: target.id };
        origin = target.url.split('/').slice(0,3).join('/');
    
        chrome.debugger.attach(debuggee, '1.2', () => {
            chrome.debugger.sendCommand(debuggee, 'Network.setRequestInterception', {patterns: [{ urlPattern: '*' }]});
        });
    
        chrome.debugger.onEvent.addListener(rewriteResponse);
    });
}

function rewriteResponse(source, method, params) {
    if(source.targetId === debuggee.targetId && method === 'Network.requestIntercepted') {
        console.log('YOP', params.request);
        var request = params.request;
        var continueParams = {
            interceptionId: params.interceptionId,
        };
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
        console.log('yep', continueParams);
        chrome.debugger.sendCommand(debuggee, 'Network.continueInterceptedRequest', continueParams);
    }
}

function getBestResponse(request) {
    var reqId;
    reqId = exactMatch[getExactKey(request)];
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
