const { v4: uuidv4 } = require('uuid');
const { StateMachine } = require('../engine/StateMachine.js');
const { RingScheduler } = require('../engine/RingScheduler.js');
const { Player } = require('./Player.js');
const { LifeHappensDeck } = require('./decks/LifeHappensDeck.js');

class Game {
  constructor(name, creatorSocket, gameId) {
    this.id = gameId;
    this.name = name;
    this.players = [];
    this.status = 'waiting';

    this.stateMachine = new StateMachine();
    this.scheduler = new RingScheduler();
    this.lifeHappensDeck = new LifeHappensDeck();
    this.lifeHappensDeck.shuffle();

    this.currentPlayerIndex = 0;
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
    this.getCurrentPlayer().stats.actionPoints = 2;
    this.stateMachine.updateContext({
        currentPlayer: this.getCurrentPlayer().id,
        turnNumber: this.scheduler.getCurrentTurn()
    });
    this.stateMachine.transition('Roll');
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.scheduler.advanceTurn();
    this.getCurrentPlayer().stats.actionPoints = 2;
    this.stateMachine.updateContext({
      currentPlayer: this.getCurrentPlayer().id,
      turnNumber: this.scheduler.getCurrentTurn()
    });
    this.stateMachine.transition('Idle');
    this.stateMachine.transition('Roll');
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
      pendingDecision: this.stateMachine.getContext().pendingDecision
    };
  }
}

module.exports = { Game };
