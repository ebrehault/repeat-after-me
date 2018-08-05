# Repeat After Me

Repeat After Me is a Chrome extension allowing frontend developers to work when their backend server is down or unreachable.

It records all XHR calls (requests and responses) and indexes them. Then, in replay mode, it will intercept XHR calls and will return the best match.

## Installation

Install from Chrome Store https://chrome.google.com/webstore/detail/repeat-after-me/flhomojjimkkphaddjaimnkgdgcajaek

(or clone this repository, enable the developer mode in the Chrome extension page, and install the extension from its local folder)

## Usage

To start recording XHR calls, enter a context name and click "Record".

Try to run a scenario were a maximum of different backend calls will occurs.

When done, click "Stop record".

Then, you can fake your backend by selecting the context and clicking "Play".

Click "Stop play" to stop the network interception.

## Principle

In record mode, the calls are indexed, and in replay mode, when your application will make an XHR call, Repeat After Me will return the best match:

- exact match: if the very same request has been recorded, it returns its response,
- simple match: else, it will search a request with same method and same path (ignoring the querystring),
- near match: else, it will search a request with same method and a similarly ended path, for instance if the app calls `POST http://mybackend/task1/complete`, the extension might return the recorded response for `POST http://mybackend/task2/complete`.

The objective is to make the fake backend to behave in the most consistent way. Nevertheless, be aware inconsistencies might happen.


# Credits

Replay icon by Laurence Willmott from the Noun Project.