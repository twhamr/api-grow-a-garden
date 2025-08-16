// initWebSocket.js
// Creates a WebSocket connection for Grow-A-Garden data

const WebSocket = require('ws');

module.exports = (url, options = {}) => {
    const {
        reconnectInterval = 3000,
        maxRetries = Infinity,
        heartbeatInterval = 10000,
        heartbeatTimeout = 5000,
        pingMessage = '__ping__',
        expectPong = true
    } = options;

    let socket = null;
    let retries = 0;
    let heartbeatTimer = null;
    let pongTimeoutTimer = null;

    const listeners = {
        onOpen: () => {},
        onMessage: () => {},
        onClose: () => {},
        onError: () => {}
    };

    function startHeatbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);

        heartbeatTimer = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(pingMessage);
                if (expectPong) {
                    // If we expect a pong, start a timeout
                    if (pongTimeoutTimer) clearTimeout(pongTimeoutTimer);

                    pongTimeoutTimer = setTimeout(() => {
                        console.warn('Pong not received. Reconnecting...');
                        socket.close(); // This triggers reconnect
                    }, heartbeatTimeout);
                }
            }
        }, heartbeatInterval);
    }

    function stopHeartbeat() {
        clearInterval(heartbeatTimer);
        clearTimeout(pongTimeoutTimer);
    }

    function connect() {
        socket = new WebSocket(url);

        socket.onopen = (event) => {
            retries = 0;
            listeners.onOpen(event);
            startHeatbeat();
        };

        socket.onmessage = (event) => {
            // If we expect the pong, clear timeout
            if (expectPong && event.data === pingMessage) {
                clearTimeout(pongTimeoutTimer);
            } else {
                listeners.onMessage(event);
            }
        };

        socket.onclose = (event) => {
            listeners.onClose(event);
            stopHeartbeat();
            attemptReconnect();
        };

        socket.onerror = (event) => {
            listeners.onError(event);
            socket.close() // This will trigger reconnect
        };
    }

    function attemptReconnect() {
        if (retries < maxRetries) {
            retries++;
            setTimeout(() => {
                connect();
            }, reconnectInterval);
        }
    }

    connect();

    return {
        send: (data) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(data);
            } else {
                console.warn('WebSocket not open. Message not sent.');
            }
        },
        close: () => {
            retries = maxRetries;   // prevent further reconnections
            stopHeartbeat();
            socket.close();
        },
        onOpen: (callback) => listeners.onOpen = callback,
        onMessage: (callback) => listeners.onMessage = callback,
        onClose: (callback) => listeners.onClose = callback,
        onError: (callback) => listeners.onError = callback
    };
}