// getCosmetics.js
// API Route: get the current cosmetics stock from WebSocket

const fs = require('fs');
const path = require('path');

function readCache() {
    const cacheName = 'stockCache.json'
    const cachePath = path.join(__dirname, '..', 'data', cacheName);

    const cacheData = fs.readFileSync(cachePath, 'utf-8', (error, data) => {
        if (error) throw error;

        try {
            return data;
        } catch (error) {
            console.error(`❌ Error reading ${cacheName}: ${error}`);
        }
    });

    return cacheData;
}

function initRoute(app, apiVersion) {
    app.get(`/api/v${apiVersion}/cosmetics`, async (req, res) => {
        try {
            const cache = JSON.parse(readCache());

            if (!cache.data.cosmetics) {
                return res.status(500).json({ status: 500, error: "Failed to fetch cosmetics data" });
            }
            
            res.json({ status: 200, cosmetics: cache.data.cosmetics });
        } catch (error) {
            res.status(500).json({ status: 500, error: "Error fetching cosmetics data" });
        }
    });
}

module.exports = { initRoute };