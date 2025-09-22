const fs = require('fs');
const path = require('path');

class ExileObjectivesDeck {
    constructor() {
        this.deck = [];
        this.discard = [];
        this._loadCards();
    }

    _loadCards() {
        const jsonPath = path.join(__dirname, '../../cards/exile-objectives.json');
        try {
            const jsonData = fs.readFileSync(jsonPath, 'utf-8');
            this.deck = JSON.parse(jsonData);
        } catch (e) {
            console.error("Error loading or parsing exile-objectives.json:", e);
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
                console.warn("Exile Objectives deck is empty and cannot be reshuffled.");
                return null;
            }
            this.deck = [...this.discard];
            this.discard = [];
            this.shuffle();
            console.log("Reshuffled Exile Objectives discard pile into deck.");
        }
        const card = this.deck.pop();
        this.discard.push(card);
        return card;
    }
}

module.exports = { ExileObjectivesDeck };
