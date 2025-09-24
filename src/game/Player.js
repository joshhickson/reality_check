const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(name, socket) {
    this.id = uuidv4();
    this.name = name;
    this.socketId = socket.id;

    // Stats aligned with GDD v0.4
    this.stats = {
      money: 20000,
      mentalHealth: 7,
      sin: 0,
      virtue: 0,
      socialCapital: 0,
      actionPoints: 0,
      narrativeMomentum: 0,
      kudos: 0,
      concern: 0
    };

    this.isBurnedOut = false;
    this.isImmuneToBurnout = false;
    this.burnoutImmunityRound = 0;
    this.hand = [];
    this.finalScore = null;
    this.titles = [];
  }

  applyEffects(effects, currentRound = 0) {
    if (effects.money) this.stats.money += effects.money;
    if (effects.mentalHealth) this.stats.mentalHealth += effects.mentalHealth;
    if (effects.sin) this.stats.sin += effects.sin;
    if (effects.virtue) this.stats.virtue += effects.virtue;
    if (effects.socialCapital) this.stats.socialCapital += effects.socialCapital;
    if (effects.narrativeMomentum) this.stats.narrativeMomentum += effects.narrativeMomentum;

    // Clamp values to their ranges
    this.stats.mentalHealth = Math.max(0, Math.min(10, this.stats.mentalHealth));
    this.stats.sin = Math.max(0, this.stats.sin);
    this.stats.virtue = Math.max(0, this.stats.virtue);
    this.stats.socialCapital = Math.max(0, this.stats.socialCapital);
    this.stats.narrativeMomentum = Math.max(0, this.stats.narrativeMomentum);

    this.updateBurnoutStatus(currentRound);
  }

  updateBurnoutStatus(currentRound) {
    this.checkBurnoutImmunity(currentRound);

    if (this.isImmuneToBurnout) {
      this.isBurnedOut = false;
      return;
    }

    if (this.stats.mentalHealth <= 3) {
      if (!this.isBurnedOut) {
        this.isBurnedOut = true;
        this.setBurnoutImmunity(currentRound);
      }
    } else {
      this.isBurnedOut = false;
    }
  }

  setBurnoutImmunity(currentRound) {
    this.isImmuneToBurnout = true;
    this.burnoutImmunityRound = currentRound;
  }

  checkBurnoutImmunity(currentRound) {
    if (this.isImmuneToBurnout && currentRound > this.burnoutImmunityRound) {
      this.isImmuneToBurnout = false;
    }
  }

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
      stats: this.stats,
      isBurnedOut: this.isBurnedOut,
      hand: this.hand,
      finalScore: this.finalScore
    };
  }
}

module.exports = { Player };
