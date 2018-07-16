var s = document.createElement('script');
s.src = chrome.extension.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
document.addEventListener('repeat', function(data) {
    chrome.runtime.sendMessage(
        localStorage.getItem('repeat-after-me-extension'),
        { request: data.detail },
        res => {},
    );
});
