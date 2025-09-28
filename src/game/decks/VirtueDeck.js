class VirtueDeck {
    constructor(cards) {
        this.deck = [...cards];
        this.discard = [];
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

module.exports = { VirtueDeck };