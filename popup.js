var context;

var recordBtn = document.getElementById('record-btn');
var recordStopBtn = document.getElementById('stop-record-btn');
var playBtn = document.getElementById('play-btn');
var stopBtn = document.getElementById('stop-play-btn');
var contextInput = document.getElementById('context-input');
var contextSelect = document.getElementById('context-select');

var record = function() {
    chrome.extension.getBackgroundPage().startRecord(context);
    recordStopBtn.disabled = true;
    recordStopBtn.disabled = false;
    playBtn.disabled = true;
    stopBtn.disabled = true;
};
var stopRecord = function() {
    chrome.extension.getBackgroundPage().stopRecord();
    recordStopBtn.disabled = false;
    recordStopBtn.disabled = true;
    playBtn.disabled = true;
    stopBtn.disabled = true;
};
var play = function() {
    chrome.extension.getBackgroundPage().startPlay(context);
    playBtn.disabled = true;
    stopBtn.disabled = false;
};
var stopPlay = function() {
    chrome.extension.getBackgroundPage().stopPlay();
    playBtn.disabled = false;
    stopBtn.disabled = true;
};

recordBtn.addEventListener('click', record);
recordStopBtn.addEventListener('click', stopRecord);
playBtn.addEventListener('click', play);
stopBtn.addEventListener('click', stopPlay);
contextInput.addEventListener('keyup', function(e) {
    if (e.target.value) {
        context = e.target.value;
        recordBtn.disabled = false;
    }
});
contextSelect.addEventListener('change', function(e) {
    context = e.target.selectedOptions[0].value;
    if (context) {
        playBtn.disabled = false;
    }
});

var status = chrome.extension.getBackgroundPage().getStatus();
if (status === 'recording') {
    recordStopBtn.disabled = true;
    recordStopBtn.disabled = false;
}
if (status === 'playing') {
    playBtn.disabled = true;
    stopBtn.disabled = false;
}
context = chrome.extension.getBackgroundPage().getContext();
if (context) {
    contextInput.value = context;
    if (status === 'idle') {
        recordBtn.disabled = false;
    }
}
var options = chrome.extension.getBackgroundPage().getContexts().map(contextName => {
    return `<option value="${contextName}">${contextName}</option>`;
});
contextSelect.innerHTML = '<option value="">Select a context</option>' + options.join('');
