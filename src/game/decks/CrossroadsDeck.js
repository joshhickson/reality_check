const crossroadsCards = [
    {
        id: 'crossroads_001',
        trigger: 'SIN_INCREASE',
        text: "A local journalist saw you commit that sin. They're offering to keep quiet for a price.",
        options: [
            { text: "Pay the bribe (-$1000)", effects: { money: -1000 } },
            { text: "Threaten them (Sin +1)", effects: { sin: 1 } }
        ]
    },
    {
        id: 'crossroads_002',
        trigger: 'VIRTUE_INCREASE',
        text: "Your recent good deed was noticed by a community organizer. They've invited you to a charity gala.",
        options: [
            { text: "Attend and donate (-$500, Virtue +2)", effects: { money: -500, virtue: 2 } },
            { text: "Decline politely", effects: {} }
        ]
    },
    {
        id: 'crossroads_003',
        trigger: 'MONEY_GAIN_LARGE', // e.g., > $2000 in one action
        text: "A distant relative heard about your recent windfall and is asking for a 'loan'.",
        options: [
            { text: "Give them some money (-$1000, Virtue +1)", effects: { money: -1000, virtue: 1 } },
            { text: "Make an excuse (Mental Health -1)", effects: { mentalHealth: -1 } }
        ]
    }
];

class CrossroadsDeck {
    constructor() {
        this.deck = [...crossroadsCards];
        this.discard = [];
    }

    shuffle() {
        // Simple Fisher-Yates shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    draw() {
        if (this.deck.length === 0) {
            if (this.discard.length === 0) {
                console.warn("Crossroads deck and discard are empty.");
                return null;
            }
            this.deck = [...this.discard];
            this.discard = [];
            this.shuffle();
            console.log("Reshuffled Crossroads discard pile into deck.");
        }
        const card = this.deck.pop();
        this.discard.push(card);
        return card;
    }
}

module.exports = { CrossroadsDeck };
