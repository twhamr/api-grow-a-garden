// server.js
// Express API using NodeJS for Grow a Garden

const express = require('express');
const https = require('https');


// Initialize Express API
const args = process.argv.slice(2); // ["--port=3000"]
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : 11560; // default 11560
const app = express();


let cachedStockData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function fetchStocks() {
    const options = {
        method: "GET",
        hostname: "growagarden.gg",
        port: null,
        path: "/api/stock",
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            priority: "u=1, i",
            referer: "https://growagarden.gg/stocks",
            "trpc-accept": "application/json",
            "x-trpc-source": "gag"
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => {
                chunks.push(chunk);
            });

            res.on("end", () => {
                try {
                    const body = Buffer.concat(chunks);
                    const parsedData = JSON.parse(body.toString());
                    resolve(parsedData);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on("error", (e) => {
            reject(e);
        });

        req.end();
    });
}

function formatItems(items, imageData, isLastSeen = false) {
    if (!Array.isArray(items) || items.length === 0) return [];

    return items.map(item => {
        const image = imageData?.[item.name] || null;
        const baseItem = {
            name: item?.name || "Unknown",
            ...(image && { image })
        };

        if (isLastSeen) {
            return {
                ...baseItem,
                emoji: item?.emoji || "❓",
                seen: item?.seen ?? null,
            };
        } else {
            return {
                ...baseItem,
                value: item?.value ?? null,
            };
        }
    });
}

function formatStocks(stocks) {
    const imageData = stocks.imageData || {};

    return {
        easterStock: formatItems(stocks.easterStock, imageData),
        gearStock: formatItems(stocks.gearStock, imageData),
        eventStock: formatItems(stocks.eventStock, imageData),
        eggStock: formatItems(stocks.eggStock, imageData),
        nightStock: formatItems(stocks.nightStock, imageData),
        honeyStock: formatItems(stocks.honeyStock, imageData),
        cosmeticsStock: formatItems(stocks.cosmeticsStock, imageData),
        seedsStock: formatItems(stocks.seedsStock, imageData),

        lastSeen: {
            Seeds: formatItems(stocks.lastSeen?.Seeds, imageData, true),
            Gears: formatItems(stocks.lastSeen?.Gears, imageData, true),
            Weather: formatItems(stocks.lastSeen?.Weather, imageData, true),
            Eggs: formatItems(stocks.lastSeen?.Eggs, imageData, true),
            Honey: formatItems(stocks.lastSeen?.Honey, imageData, true)
        },

        restockTimers: stocks.restockTimers || {},
    };
}

async function fetchStockData() {
    try {
        const data = await fetchStocks();

        const timestamp = Date.now();
        if (cachedStockData && (timestamp - lastFetchTime < CACHE_DURATION)) {
            return cachedStockData;
        }

        if (!data) {
            return null;
        }
            
        cachedStockData = data;
        lastFetchTime = timestamp;

        return formatStocks(data);
    } catch (err) {
        console.error("Error fetching stock data:", err);
        return null;
    }
}

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


// API routes
const apiVersion = 1    // used in routes

app.get(`/api/v${apiVersion}`, (req, res) => {
    res.json({
        status: 200
    });
});

app.get(`/api/v${apiVersion}/all`, async (req, res) => {
    try {
        const stockData = await fetchStockData();
        
        if (!stockData) {
            return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
        }
            
        res.json({ status: 200, stock: stockData });
    } catch (error) {
        res.status(500).json({ status: 500, error: "Error fetching stock data" });
    }
});

app.get(`/api/v${apiVersion}/seeds`, async (req, res) => {
    try {
        const stockData = await fetchStockData();
        
        if (!stockData) {
            return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
        }
        
        res.json({ status: 200, stock: stockData.seedsStock });
    } catch (error) {
        res.status(500).json({ status: 500, error: "Error fetching stock data" });
    }
});

app.get(`/api/v${apiVersion}/gear`, async (req, res) => {
    try {
        const stockData = await fetchStockData();
        
        if (!stockData) {
            return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
        }
            
        res.json({ status: 200, stock: stockData.gearStock });
    } catch (error) {
        res.status(500).json({ status: 500, error: "Error fetching stock data" });
    }
});

app.get(`/api/v${apiVersion}/eggs`, async (req, res) => {
    try {
        const stockData = await fetchStockData();
        
        if (!stockData) {
            return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
        }
            
        res.json({ status: 200, stock: stockData.eggStock });
    } catch (error) {
        res.status(500).json({ status: 500, error: "Error fetching stock data" });
    }
});

app.get(`/api/v${apiVersion}/cosmetics`, async (req, res) => {
    try {
        const stockData = await fetchStockData();
        
        if (!stockData) {
            return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
        }
            
        res.json({ status: 200, stock: stockData.cosmeticsStock });
    } catch (error) {
        res.status(500).json({ status: 500, error: "Error fetching stock data" });
    }
});

app.get(`/api/v${apiVersion}/events`, async (req, res) => {
    try {
        const stockData = await fetchStockData();
        
        if (!stockData) {
            return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
        }
            
        res.json({ status: 200, stock: stockData.eventStock });
    } catch (error) {
        res.status(500).json({ status: 500, error: "Error fetching stock data" });
    }
});

// app.get(`/api/v${apiVersion}/weather`, async (req, res) => {
//     try {
//         const stockData = await fetchStockData();
        
//         if (!stockData) {
//             return res.status(500).json({ status: 500, error: "Failed to fetch stock data" });
//         }
            
//         res.json({ status: 200, stock: stockData.Weather });
//     } catch (error) {
//         res.status(500).json({ status: 500, error: "Error fetching stock data" });
//     }
// });

app.listen(port, () => {
    console.log(`Grow a Garden API is online and listening on port: ${port}`);
});