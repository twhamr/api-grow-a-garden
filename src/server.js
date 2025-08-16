// server.js
// Express API using NodeJS for Grow a Garden

const express = require('express');
const fs = require('fs');
const path = require('path');
const createWebSocket = require('./initWebSocket');
const updateDB = require('./initFruitDB');


// Initialize Express API
const args = process.argv.slice(2); // ["--port=3000"]
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : 11560; // default 11560
const app = express();


// Initialize WebSocket connection
const url = 'wss://ws.growagardenpro.com/'
const ws = createWebSocket(url, {
    reconnectInterval: 5000,
    maxRetries: Infinity,
    heartbeatInterval: 10000,
    heartbeatTimeout: 4000,
    pingMessage: '__ping__',
    expectPong: false   // only enable if your server echos back ping
});

ws.onOpen(() => {
    console.log(`✅ WebSocket connection success! | url: ${url}`);
});

// Update cache when there is a message received from the WebSocket
ws.onMessage((event) => {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdir(dataDir);

    const cacheName = 'stockCache.json';
    const cachePath = path.join(dataDir, cacheName);
    try {
        let response = JSON.parse(event.data);
        let cacheData = JSON.stringify(response, null, 2);
        fs.writeFile(cachePath, cacheData, (error) => {
            if (error) throw error;

            console.log(`💬 WebSocket message received, storing data to ${cacheName}`);
        })
    } catch (error) {
        console.error(`❌ Error writing data to ${cacheName}: ${error}`);
    }
});

ws.onClose(() => {
    console.warn('⚠️ WebSocket closed. Reconnecting...');
});

ws.onError((error) => {
    console.error(`❌ WebSocket error: ${error}`);
});


const apiVersion = 1    // used in routes

app.get(`/api/v${apiVersion}/status`, (req, res) => {
    res.json({
        status: 200,
        timestamp: Date.now().toString()
    });
});

const routesDir = path.join(__dirname, 'routes');
if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir);

let loadCount = 0;
fs.readdir(routesDir, (error, files) => {
    if (error) {
        console.error(`❌ Failed to read routes directory: ${error}`);
        return;
    }

    files.forEach((file) => {
        if (file.endsWith('.js')) {
            const routePath = path.join(routesDir, file);

            try {
                const routeModule = require(routePath);

                if (typeof routeModule.initRoute === 'function') {
                    routeModule.initRoute(app, apiVersion);
                    console.log(`✅ Added module: ${file}`);
                    loadCount++;
                } else {
                    console.warn(`⚠️ No initRoute() export: ${file}`);
                }
            } catch (error) {
                console.error(`❌ Error in ${file}: ${error}`);
            }
        }
    });

    updateDB()

    const updateDBInterval = setInterval(() => {
        updateDB();
    }, 86400000);

    app.listen(port, () => {
        console.log(`🤖 API is live on http://localhost:${port}`);
        console.log(`❓ Status check available at /api/v${apiVersion}/status`);
        console.log('©️ Grow-A-Garden API developed by twhamr | https://github.com/twhamr');
    });
});