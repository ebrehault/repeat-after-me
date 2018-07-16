var record = function() {
    chrome.extension.getBackgroundPage().startRecord();
};
var stopRecord = function() {
    chrome.extension.getBackgroundPage().stopRecord();
};
var play = function() {
    chrome.extension.getBackgroundPage().startPlay();
};
var stopPlay = function() {
    chrome.extension.getBackgroundPage().stopPlay();
};

document.getElementById('record-btn').addEventListener('click', record);
document.getElementById('stop-record-btn').addEventListener('click', stopRecord);
document.getElementById('play-btn').addEventListener('click', play);
document.getElementById('stop-play-btn').addEventListener('click', stopPlay);