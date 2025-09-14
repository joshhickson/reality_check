const fs = require('fs');
const path = require('path');

class SinDeck {
    constructor() {
        this.deck = [];
        this.discard = [];
        this._loadCards();
    }

    _loadCards() {
        const csvPath = path.join(__dirname, '../../cards/sin.csv');
        try {
            const csvData = fs.readFileSync(csvPath, 'utf-8');
            const lines = csvData.trim().split('\n');
            const header = lines.shift().split(',');

            this.deck = lines.map(line => {
                const values = line.split(',');
                const card = {};
                for (let i = 0; i < header.length; i++) {
                    card[header[i]] = values[i];
                }
                return card;
            });
        } catch (e) {
            console.error("Error loading or parsing sin.csv:", e);
            this.deck = [];
        }
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    draw() {
        if (this.deck.length === 0) {
            if (this.discard.length === 0) {
                return null;
            }
            this.deck = [...this.discard];
            this.discard = [];
            this.shuffle();
        }
        const card = this.deck.pop();
        this.discard.push(card);
        return card;
    }
}

module.exports = { SinDeck };
