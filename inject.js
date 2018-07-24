(function(xhr) {
    console.log('Recording XMLHttpRequest calls');
    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;
    var setRequestHeader = XHR.setRequestHeader;

    XHR.open = function(method, url) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {};
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function(postData) {
        this.addEventListener('load', function() {
            if(this._url) {
                var responseHeaders = {};
                this.getAllResponseHeaders().split('\n').forEach(header => {
                    var v = header.split(':');
                    if (v.length === 2) {
                        responseHeaders[v[0]] = v[1].trim();
                    }
                });
                var request = {
                    url: this._url,
                    method: this._method,
                    status: this.status,
                    statusText: this.statusText,
                    headers: this._requestHeaders,
                    responseHeaders: responseHeaders,
                };
                if (postData) {
                    request.requestBody = postData;
                }

                if (this.responseType !== 'blob' && this.responseText) {
                    try {
                        request.responseBody = this.responseText;
                    } catch(err) {
                        console.log(err);
                    }
                }
                var event = new CustomEvent('repeat', {detail: request});
                document.dispatchEvent(event);
            }
        });

        return send.apply(this, arguments);
    };

})(XMLHttpRequest);