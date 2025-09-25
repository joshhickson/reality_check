class CrossroadsCard {
  constructor(id, trigger, text, choices) {
    this.id = id;
    this.trigger = trigger; // The condition that must be met for this card to activate
    this.text = text;
    this.choices = choices;
  }
}

class CrossroadsDeck {
  constructor() {
    this.cards = [
      new CrossroadsCard(
        'crossroads_001',
        { type: 'STAT_CHANGE', stat: 'sin', direction: 'increase' },
        "As your moral compass wavers, an old 'friend' from a past life emerges from the shadows with a proposition that's too tempting to ignore. 'I've got a surefire thing,' they whisper, 'but it's now or never.'",
        [
          { text: "Hear them out. (High risk, high reward)", effects: { money: 1000, sin: 2 } },
          { text: "Walk away. (Gain Virtue, but lose an opportunity)", effects: { virtue: 1 } }
        ]
      ),
      new CrossroadsCard(
        'crossroads_002',
        { type: 'ACTION', actionType: 'WORK_OVERTIME' },
        "As you're about to head home after a long day, your boss stops you. 'Big project just landed. I need all hands on deck this weekend. It's optional, of course...' The unspoken pressure hangs in the air.",
        [
            { text: "Agree to work the weekend. (Gain Money, lose Mental Health)", effects: { money: 750, mentalHealth: -2 } },
            { text: "Politely decline. (Preserve your weekend, but risk your boss's favor)", effects: { socialCapital: -1 } }
        ]
      ),
      new CrossroadsCard(
        'crossroads_003',
        { type: 'STAT_CHANGE', stat: 'mentalHealth', direction: 'decrease' },
        "You receive a text from an old flame, completely out of the blue. They want to 'catch up.' This could be exactly what you need, or a spiral into emotional turmoil.",
        [
            { text: "Agree to meet them. (Potential for connection or disaster)", effects: { narrativeMomentum: 3, mentalHealth: -1 } },
            { text: "Ignore the text. (Safer, but closes a door)", effects: {} }
        ]
      )
    ];
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    if (this.cards.length === 0) {
      // In a real game, you'd likely reshuffle the discard pile.
      // For this implementation, we'll just return null.
      return null;
    }
    return this.cards.pop();
  }
}

module.exports = { CrossroadsDeck };