// initFruitDB.js
// Fetches Fruit DB and updates local cache

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parse } = require('node-html-parser');

const databaseName = 'fruitDatabase.json';
const databasePath = path.join(__dirname, 'data', databaseName);


async function scrapeHTML(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`❌ An error occured trying to scrape HTML: ${error}`);
    }
}

module.exports = async () => {
    const rawHTML = await scrapeHTML('https://growagardenstock.com/crops');
    const root = parse(rawHTML);

    const divClasses = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16';
    const divs = root.querySelectorAll(`div.grid`);
    
    const filteredDivs = divs.filter((div) => {
        const classes = div.getAttribute('class').split(' ');
        return divClasses.split(' ').every((divClass) => classes.includes(divClass));
    })

    let fruitInfos = [];
    filteredDivs.forEach((div) => {
        const fruitDivs = div.querySelectorAll('div.bg-white');

        fruitDivs.forEach((div) => {
            const fruitName = div.querySelector('h3');
            const fruitImg = div.querySelector('img');
            
            const spans = div.querySelectorAll('span');
            const rarityClasses = 'px-2 py-1 text-xs font-medium rounded-full border';
            const spanRarity = spans.filter((span) => {
                const classes = span.getAttribute('class').split(' ');
                return rarityClasses.split(' ').every((spanClass) => classes.includes(spanClass));
            })

            let fruitRarity;
            spanRarity.forEach((span) => {
                fruitRarity = span.text.trim();
            })
            
            const fruit = {
                name: `${fruitName.innerHTML}`,
                image: `https://growagardenstock.com${fruitImg.getAttribute('src')}`,
                rarity: `${fruitRarity}`
            }

            fruitInfos.push(fruit);
        });
    })

    try {
        fs.writeFile(databasePath, JSON.stringify({ fruits: fruitInfos }, null, 2), (error) => {
            if (error) throw error;

            console.log(`✅ Successfully updated ${databaseName}`);
        })
    } catch (error) {
        console.error(`❌ Error writing data to ${databaseName}: ${error}`);
    }
};