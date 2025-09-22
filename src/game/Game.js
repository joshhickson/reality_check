const { v4: uuidv4 } = require('uuid');
const { StateMachine } = require('../engine/StateMachine.js');
const { RingScheduler } = require('../engine/RingScheduler.js');
const { Player } = require('./Player.js');
const { LifeHappensDeck } = require('./decks/LifeHappensDeck.js');
const { SinDeck } = require('./decks/SinDeck.js');
const { VirtueDeck } = require('./decks/VirtueDeck.js');

class Game {
  constructor(name, creatorSocket, gameId) {
    this.id = gameId;
    this.name = name;
    this.players = [];
    this.status = 'waiting';
    this.maxHandSize = 5;
    this.pendingDecision = null;

    this.stateMachine = new StateMachine();
    this.scheduler = new RingScheduler();
    this.lifeHappensDeck = new LifeHappensDeck();
    this.sinDeck = new SinDeck();
    this.virtueDeck = new VirtueDeck();

    this.lifeHappensDeck.shuffle();
    this.sinDeck.shuffle();
    this.virtueDeck.shuffle();

    this.currentPlayerIndex = 0;
    this.maxTurns = 0;
    this.testimonies = [];
    this.winner = null;
  }

  addPlayer(socket, username) {
    if (this.status !== 'waiting') {
      throw new Error('Game has already started.');
    }
    const player = new Player(username, socket);
    this.players.push(player);

    return player;
  }

  start() {
    if (this.players.length < 1) {
      throw new Error('Not enough players to start the game.');
    }
    this.status = 'in-progress';
    this.stateMachine.transition('InProgress');
    this.maxTurns = this.players.length * 10;
    this.getCurrentPlayer().stats.actionPoints = 2;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    this.scheduler.advanceTurn();
    if (this.scheduler.getCurrentTurn() > this.maxTurns && this.maxTurns > 0) {
        this.status = 'judgment_day';
        this.stateMachine.transition('JudgmentDay');
        return;
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.getCurrentPlayer().stats.actionPoints = 2;
  }

  addTestimony(playerId, kudosTargetId, concernTargetId) {
    if (this.testimonies.some(t => t.playerId === playerId)) {
      return { error: 'You have already submitted your testimony.' };
    }

    const kudosPlayer = this.players.find(p => p.id === kudosTargetId);
    const concernPlayer = this.players.find(p => p.id === concernTargetId);

    if (!kudosPlayer || !concernPlayer) {
      return { error: 'Invalid target player for testimony.' };
    }

    if (kudosTargetId === playerId || concernTargetId === playerId) {
      return { error: 'You cannot give Kudos or Concern to yourself.' };
    }

    this.testimonies.push({ playerId, kudosTargetId, concernTargetId });

    if (this.testimonies.length === this.players.length) {
      this.calculateFinalScores();
    }

    return { success: true };
  }

  calculateFinalScores() {
    this.testimonies.forEach(testimony => {
      const kudosPlayer = this.players.find(p => p.id === testimony.kudosTargetId);
      if (kudosPlayer) {
        kudosPlayer.stats.kudos++;
      }
      const concernPlayer = this.players.find(p => p.id === testimony.concernTargetId);
      if (concernPlayer) {
        concernPlayer.stats.concern++;
      }
    });

    this.players.forEach(player => {
      const { money, mentalHealth, sin, virtue, kudos, concern } = player.stats;
      let mhBonus = 0;
      if (mentalHealth >= 8) {
        mhBonus = 10;
      } else if (mentalHealth >= 5) {
        mhBonus = 5;
      }
      const score = (money / 1000) + (virtue * 2) - (sin * 2) + mhBonus + (kudos * 3) - (concern * 1);
      player.finalScore = score;
    });

    this.players.sort((a, b) => b.finalScore - a.finalScore);

    if (this.players.length > 0) {
      this.winner = this.players[0];
    }

    this.status = 'finished';
    this.stateMachine.transition('Finished');
  }

  getGameState() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      players: this.players.map(p => p.getPublicState()),
      currentPlayerId: this.getCurrentPlayer() ? this.getCurrentPlayer().id : null,
      currentTurn: this.scheduler.getCurrentTurn(),
      currentState: this.stateMachine.getCurrentState(),
      pendingDecision: this.pendingDecision,
      winner: this.winner
    };
  }
}

module.exports = { Game };
