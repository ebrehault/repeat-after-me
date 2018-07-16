chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ record: false });
    chrome.storage.local.set({ replay: false });
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(sender.tab);
    if (request.request) {
        recordRequest(request.request);
    };
    sendResponse({success: true});
});

var count = 0;
var requests = {};

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
    localStorage.setItem('repeat-after-CONTEXT', JSON.stringify(requests));
}

function startPlay() {
    chrome.browserAction.setIcon({ path: 'play.png' });
    chrome.storage.local.set({ play: true });
}

function stopPlay() {
    chrome.browserAction.setIcon({ path: 'icon.png' });
    chrome.storage.local.set({ play: false });
}

function recordRequest(request) {
    requests[count] = request;
    count ++;
}

