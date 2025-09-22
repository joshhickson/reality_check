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
      actionPoints: 0,
      narrativeMomentum: 0,
      kudos: 0,
      concern: 0,
      communityImpact: 0
    };

    this.isBurnedOut = false;
    this.isImmuneToBurnout = false;
    this.burnoutImmunityRound = 0;
    this.hand = [];
    this.finalScore = null;
    this.isExiled = false;
    this.secretObjective = null;
  }

  applyEffects(effects, currentTurn = 0) {
    if (effects.money) this.stats.money += effects.money;
    if (effects.mentalHealth) this.stats.mentalHealth += effects.mentalHealth;
    if (effects.sin) this.stats.sin += effects.sin;
    if (effects.virtue) this.stats.virtue += effects.virtue;
    if (effects.narrativeMomentum) this.stats.narrativeMomentum += effects.narrativeMomentum;
    if (effects.socialCapital) { // Assuming socialCapital might be an effect
        this.stats.socialCapital = (this.stats.socialCapital || 0) + effects.socialCapital;
    }
    if (effects.communityImpact) this.stats.communityImpact += effects.communityImpact;


    // Clamp values to their ranges
    this.stats.mentalHealth = Math.max(0, Math.min(10, this.stats.mentalHealth));
    this.stats.sin = Math.max(0, this.stats.sin);
    this.stats.virtue = Math.max(0, this.stats.virtue);
    this.stats.narrativeMomentum = Math.max(0, this.stats.narrativeMomentum);

    this.updateBurnoutStatus(currentTurn);
  }

  updateBurnoutStatus(currentTurn, numPlayers) {
    this.checkBurnoutImmunity(currentTurn, numPlayers);

    if (this.isImmuneToBurnout) {
      this.isBurnedOut = false;
      return;
    }

    if (this.stats.mentalHealth <= 3) {
      if (!this.isBurnedOut) {
        console.log(`[Player: ${this.name}] Entering burnout!`);
        this.isBurnedOut = true;
        this.setBurnoutImmunity(currentTurn);
      }
    } else {
      if (this.isBurnedOut) {
        console.log(`[Player: ${this.name}] Recovered from burnout.`);
      }
      this.isBurnedOut = false;
    }
  }

  setBurnoutImmunity(turnBurnoutOccurred) {
    this.isImmuneToBurnout = true;
    // Immunity lasts until the start of the player's next turn after the *next* turn.
    // So, if burnout happens on turn N, they are immune for turn N+1.
    // The check will happen at the start of turn N+2.
    this.burnoutImmunityRound = turnBurnoutOccurred;
  }

  checkBurnoutImmunity(currentTurn, numPlayers) {
    // Immunity wears off if the current turn is at least one full round (i.e., numPlayers turns) after the burnout
    if (this.isImmuneToBurnout && currentTurn > this.burnoutImmunityRound + numPlayers) {
        console.log(`[Player: ${this.name}] Burnout immunity has worn off.`);
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
      finalScore: this.finalScore,
      isExiled: this.isExiled
    };
  }
}

module.exports = { Player };
