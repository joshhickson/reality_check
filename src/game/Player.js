const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(name, socket) {
    this.id = uuidv4();
    this.name = name;
    this.socketId = socket.id;

    // GDD v0.3: Starting stats are fixed for consistent testing.
    this.stats = {
      money: 20000,
      mentalHealth: 7,
      sin: 0,
      virtue: 0
    };

    this.isBurnedOut = false; // Player is suffering from burnout this turn
    this.isImmuneToBurnout = false; // Player is immune for one round after burnout
    this.burnoutImmunityRound = 0;
    this.actionPoints = 0;
    this.heldCrossroadsCard = null;
  }

  // Method to apply stat changes from events or choices
  applyEffects(effects, currentRound = 0) {
    if (effects.money) this.stats.money += effects.money;
    if (effects.mentalHealth) this.stats.mentalHealth += effects.mentalHealth;
    if (effects.sin) this.stats.sin += effects.sin;
    if (effects.virtue) this.stats.virtue += effects.virtue;

    // Clamp values to their ranges
    this.stats.mentalHealth = Math.max(0, Math.min(10, this.stats.mentalHealth));
    this.stats.sin = Math.max(0, this.stats.sin);
    this.stats.virtue = Math.max(0, this.stats.virtue);

    // After stats change, update the player's burnout status
    this.updateBurnoutStatus(currentRound);
  }

  // GDD v0.3: Burnout is a deterministic state, not a probabilistic event.
  updateBurnoutStatus(currentRound) {
    this.checkBurnoutImmunity(currentRound); // Check if immunity has expired

    if (this.isImmuneToBurnout) {
      this.isBurnedOut = false;
      return;
    }

    if (this.stats.mentalHealth <= 3) {
      if (!this.isBurnedOut) {
        console.log(`[MECHANIC] Player ${this.name} is now suffering from Burnout.`);
        this.isBurnedOut = true;
        // Set immunity for the *next* round (Circuit Breaker)
        this.setBurnoutImmunity(currentRound);
      }
    } else {
      if (this.isBurnedOut) {
        console.log(`[MECHANIC] Player ${this.name} has recovered from Burnout.`);
      }
      this.isBurnedOut = false;
    }
  }

  // Method to set burnout immunity for the next round
  setBurnoutImmunity(currentRound) {
    this.isImmuneToBurnout = true;
    this.burnoutImmunityRound = currentRound;
  }

  // Method to check and clear burnout immunity
  checkBurnoutImmunity(currentRound) {
    // Immunity lasts for one full round. It expires if the game is on a later round than the one immunity was granted in.
    if (this.isImmuneToBurnout && currentRound > this.burnoutImmunityRound) {
      console.log(`[MECHANIC] Player ${this.name}'s burnout immunity has worn off.`);
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
      stats: this.stats,
      isBurnedOut: this.isBurnedOut, // Expose this to the client
      actionPoints: this.actionPoints,
      hasCrossroadsCard: !!this.heldCrossroadsCard
    };
  }
}

module.exports = { Player };
