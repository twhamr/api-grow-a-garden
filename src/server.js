// server.js
// Express API using NodeJS for Grow a Garden

const express = require('express');
const WebSocket = require('ws');


// Initialize Express API
const args = process.argv.slice(2); // ["--port=3000"]
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : 11560; // default 11560
const app = express();


// Function: initialize WebSocket parameters and connection
function createWebSocket(url, protocols = null, options = {}) {
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

    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);

        heartbeatTimer - setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(pingMessage);
                if (expectPong) {
                    // If we expect a pong, start a timeout
                    if (pongTimeoutTimer) clearTimeout(pongTimeoutTimer);

                    pongTimeoutTimer = setTimeout(() => {
                        console.warn('Pong not received. Reconnecting...');
                        socket.close(); // This triggers the reconnect
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
        socket = protocols ? new WebSocket(url, protocols) : new WebSocket(url);

        socket.onopen = (event) => {
            retries = 0;
            listeners.onOpen(event);
            startHeartbeat();
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
            socket.close(); // Trigger reconnect via onclose
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

    // Start initial connection
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
            retries = maxRetries; // prevent further reconnection
            stopHeartbeat();
            socket.close();
        },
        onOpen: (callback) => listeners.onOpen = callback,
        onMessage: (callback) => listeners.onMessage = callback,
        onClose: (callback) => listeners.onClose = callback,
        onError: (callback) => listeners.onError = callback,
    };
}

// Function: calculate elapsed time since last message  => Used for debug in console
let lastMessageTime = null;

function calcElapsedTime() {
    const now = Date.now();

    if (lastMessageTime !== null) {
        const elapsedTime = now - lastMessageTime; // difference in ms
        return elapsedTime;
    }

    lastMessageTime = now;

    return lastMessageTime;
}


const ws = createWebSocket('wss://ws.growagardenpro.com/', null, {
    reconnectInterval: 5000,
    maxRetries: Infinity,
    heartbeatInterval: 10000,
    heartbeatTimeout: 4000,
    pingMessage: '__ping__',
    expectPong: false // only enable if your server echos back ping
});

ws.onOpen(() => {
    console.log('WebSocket connected!');
});

let allData = null;
ws.onMessage((event) => {
    allData = JSON.parse(event.data);

    console.log(`INFO: received WebSocket message | timestamp: ${Date.now()} | sinceLastMessage: ${calcElapsedTime()}`);
});

ws.onClose(() => {
    console.log('WebSocket closed. Reconnecting...');
});

ws.onError((error) => {
    console.error(`WebSocket error: ${error}`);
});


// API routes
const apiVersion = 1    // used in routes

app.get(`/api/v${apiVersion}`, (req, res) => {
    res.json({
        status: 200
    });
});

app.get(`/api/v${apiVersion}/all`, (req, res) => {
    res.json({ status: 200, data: allData.data});
});

app.get(`/api/v${apiVersion}/seeds`, (req, res) => {
    const seeds = allData.data.seeds;

    res.json({ status: 200, seeds: seeds});
});

app.get(`/api/v${apiVersion}/gear`, (req, res) => {
    const gear = allData.data.gear;

    res.json({ status: 200, gear: gear});
});

app.get(`/api/v${apiVersion}/eggs`, (req, res) => {
    const eggs = allData.data.eggs;

    res.json({ status: 200, eggs: eggs});
});

app.get(`/api/v${apiVersion}/cosmetics`, (req, res) => {
    const cosmetics = allData.data.cosmetics;

    res.json({ status: 200, cosmetics: cosmetics});
});

app.get(`/api/v${apiVersion}/events`, (req, res) => {
    const events = allData.data.events;

    res.json({ status: 200, events: events});
});

app.get(`/api/v${apiVersion}/weather`, (req, res) => {
    const weather = allData.data.weather;

    res.json({ status: 200, weather: weather});
});

app.listen(port, () => {
    console.log(`Grow a Garden API is online and listening on port: ${port}`);
});