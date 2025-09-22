const fs = require('fs');
const path = require('path');

class LifeHappensDeck {
    constructor() {
        this.deck = [];
        this.discard = [];
        this._loadCards();
    }

    _loadCards() {
        const jsonPath = path.join(__dirname, '../../cards/life-happens.json');
        try {
            const jsonData = fs.readFileSync(jsonPath, 'utf-8');
            this.deck = JSON.parse(jsonData);
        } catch (e) {
            console.error("Error loading or parsing life-happens.json:", e);
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
            this.reshuffle();
        }
        if (this.deck.length === 0) {
            console.warn("Life Happens deck is empty and cannot draw a card.");
            return null;
        }
        const card = this.deck.pop();
        this.discard.push(card);
        return card;
    }

    drawTwo() {
        if (this.deck.length < 2) {
            this.reshuffle();
        }
        if (this.deck.length < 2) {
            console.warn("Not enough cards in Life Happens deck to draw two.");
            // Draw as many as possible
            const cards = [...this.deck];
            this.deck = [];
            cards.forEach(card => this.discard.push(card));
            return cards;
        }
        const cards = [this.deck.pop(), this.deck.pop()];
        this.discard.push(...cards);
        return cards;
    }

    reshuffle() {
        if (this.discard.length > 0) {
            this.deck = [...this.deck, ...this.discard];
            this.discard = [];
            this.shuffle();
            console.log("Reshuffled Life Happens discard pile into deck.");
        }
    }
}

module.exports = { LifeHappensDeck };
