// getFruitInfo.js
// API Route: get specific info for a given fruit

const fs = require('fs');
const path = require('path');

function readDB() {
    const databaseName = 'fruitDatabase.json'
    const databasePath = path.join(__dirname, '..', 'data', databaseName);

    const databaseData = fs.readFileSync(databasePath, 'utf-8', (error, data) => {
        if (error) throw error;

        try {
            return data;
        } catch (error) {
            console.error(`❌ Error reading ${databaseName}: ${error}`);
        }
    });

    return databaseData;
}

function filterFruits(database, filters) {
    return database.filter((fruit) => {
        const matchesName = filters.name ? fruit.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
        const matchesRarity = filters.rarity ? fruit.rarity.toLowerCase() === filters.rarity.toLowerCase() : true;
        return matchesName && matchesRarity;
    });
}

function initRoute(app, apiVersion) {
    app.get(`/api/v${apiVersion}/fruits`, (req, res) => {
        try {
            const database = JSON.parse(readDB());

            if (!database.fruits) {
                return res.status(500).json({ status: 500, error: 'Failed to fetch fruit data' });
            }

            const filters = {
                name: req.query.name,
                rarity: req.query.rarity
            }

            const filtered = filterFruits(database.fruits, filters);

            res.json({ status: 200, fruits: filtered });
        } catch (error) {
            res.status(500).json({ status: 500, error: 'Error fetching database' });
        }
    });
}

module.exports = { initRoute };