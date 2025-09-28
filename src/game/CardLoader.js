const fs = require('fs');
const path = require('path');

/**
 * Loads card data from a JSON file.
 * @param {string} filePath - The relative path to the JSON file from the `src` directory.
 * @returns {Array} The parsed card data.
 */
function loadJson(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        const jsonData = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (e) {
        console.error(`[CardLoader] Error loading or parsing ${filePath}:`, e);
        return [];
    }
}

/**
 * Loads card data from a CSV file.
 * @param {string} filePath - The relative path to the CSV file from the `src` directory.
 * @returns {Array} The parsed card data.
 */
function loadCsv(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        const csvData = fs.readFileSync(fullPath, 'utf-8');
        const lines = csvData.trim().split('\n');
        const header = lines.shift().split(',');

        return lines.map(line => {
            const values = line.split(',');
            const card = {};
            for (let i = 0; i < header.length; i++) {
                card[header[i]] = values[i];
            }
            return card;
        });
    } catch (e) {
        console.error(`[CardLoader] Error loading or parsing ${filePath}:`, e);
        return [];
    }
}

/**
 * Loads all card decks from the disk. This should be called once on server startup.
 * @returns {object} An object containing all the loaded card decks.
 */
function loadAllCards() {
    console.log('[CardLoader] Loading all card data...');
    const cardData = {
        lifeHappens: loadJson('../cards/life-happens.json'),
        sin: loadCsv('../cards/sin.csv'),
        virtue: loadCsv('../cards/virtue.csv'),
        exile: loadJson('../cards/exile-objectives.json')
    };
    console.log('[CardLoader] Card data loaded successfully.');
    return cardData;
}

module.exports = { loadAllCards };