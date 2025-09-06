const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(name, socket) {
    this.id = uuidv4();
    this.name = name;
    this.socketId = socket.id;

    // Starting stats based on docs/stats-system.md
    this.stats = {
      money: Math.floor(Math.random() * 10001) + 15000, // $15,000 - $25,000
      mentalHealth: Math.floor(Math.random() * 3) + 6, // 6-8
      sin: Math.floor(Math.random() * 3), // 0-2
      virtue: Math.floor(Math.random() * 3) // 0-2
    };

    this.isImmuneToBurnout = false;
    this.burnoutImmunityRound = 0;
  }

  // Method to apply stat changes from events or choices
  applyEffects(effects, currentRound = 0) {
    const oldMentalHealth = this.stats.mentalHealth;

    if (effects.money) this.stats.money += effects.money;
    if (effects.mentalHealth) this.stats.mentalHealth += effects.mentalHealth;
    if (effects.sin) this.stats.sin += effects.sin;
    if (effects.virtue) this.stats.virtue += effects.virtue;

    // Clamp values to their ranges
    this.stats.mentalHealth = Math.max(0, Math.min(10, this.stats.mentalHealth));
    this.stats.sin = Math.max(0, this.stats.sin);
    this.stats.virtue = Math.max(0, this.stats.virtue);

    // Check for burnout if mental health decreased
    if (this.stats.mentalHealth < oldMentalHealth) {
      this.checkAndTriggerBurnout(currentRound);
    }
  }

  // Burnout Mechanic
  checkAndTriggerBurnout(currentRound) {
    this.checkBurnoutImmunity(currentRound);
    if (this.isImmuneToBurnout) {
      console.log(`[MECHANIC] Player ${this.name} is immune to burnout this round.`);
      return;
    }

    const mh = this.stats.mentalHealth;
    let burnoutChance = 0;
    if (mh <= 3) burnoutChance = 0.33;
    if (mh <= 2) burnoutChance = 0.66;
    if (mh <= 1) burnoutChance = 1.0;

    if (Math.random() < burnoutChance) {
      console.log(`[MECHANIC] Player ${this.name} suffered a burnout!`);
      // Apply burnout consequences directly to avoid recursive loop
      this.stats.mentalHealth = Math.max(0, this.stats.mentalHealth - 2);
      this.stats.money -= 500;

      this.setBurnoutImmunity(currentRound);
      // In a full implementation, an event would be emitted to notify the client
    }
  }

  // Method to set burnout immunity
  setBurnoutImmunity(currentRound) {
    this.isImmuneToBurnout = true;
    this.burnoutImmunityRound = currentRound;
  }

  // Method to check and clear burnout immunity
  checkBurnoutImmunity(currentRound) {
    if (this.isImmuneToBurnout && currentRound > this.burnoutImmunityRound) {
      this.isImmuneToBurnout = false;
    }
  }

  // Community Impact Bonus Mechanic
  getCommunityImpactBonus() {
    const virtue = this.stats.virtue;
    if (virtue >= 10) return 3;
    if (virtue >= 5) return 2;
    if (virtue >= 1) return 1;
    return 0;
  }

  getPublicState() {
    return {
      id: this.id,
      name: this.name,
      stats: this.stats
    };
  }
}

module.exports = { Player };
