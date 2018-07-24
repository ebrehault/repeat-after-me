var context;

var recordBtn = document.getElementById('record-btn');
var recordStopBtn = document.getElementById('stop-record-btn');
var playBtn = document.getElementById('play-btn');
var stopBtn = document.getElementById('stop-play-btn');
var contextInput = document.getElementById('context-input');
var contextSelect = document.getElementById('context-select');

var record = function() {
    chrome.extension.getBackgroundPage().startRecord();
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
    chrome.extension.getBackgroundPage().startPlay();
};
var stopPlay = function() {
    chrome.extension.getBackgroundPage().stopPlay();
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