const { v4: uuidv4 } = require('uuid');
const { StateMachine } = require('../engine/StateMachine.js');
const { RingScheduler } = require('../engine/RingScheduler.js');
const { Player } = require('./Player.js');
const { CrossroadsDeck } = require('./decks/CrossroadsDeck.js');

class Game {
  constructor(name, creatorSocket, gameId) {
    this.id = gameId;
    this.name = name;
    this.players = [];
    this.status = 'waiting'; // waiting, in-progress, finished

    this.stateMachine = new StateMachine();
    this.scheduler = new RingScheduler();
    this.crossroadsDeck = new CrossroadsDeck();
    this.crossroadsDeck.shuffle();

    this.currentPlayerIndex = 0;
  }

  addPlayer(socket, username) {
    if (this.status !== 'waiting') {
      throw new Error('Game has already started.');
    }
    const player = new Player(username, socket);
    this.players.push(player);

    socket.emit('player_joined', {
        gameId: this.id,
        player: player.getPublicState(),
        allPlayers: this.players.map(p => p.getPublicState())
    });

    socket.to(this.id).emit('player_joined', {
        gameId: this.id,
        player: player.getPublicState(),
        allPlayers: this.players.map(p => p.getPublicState())
    });

    return player;
  }

  start() {
    if (this.players.length < 1) {
      throw new Error('Not enough players to start the game.');
    }
    this.status = 'in-progress';
    this.players[0].actionPoints = 2;
    this.stateMachine.updateContext({
        currentPlayer: this.getCurrentPlayer().id,
        turnNumber: this.scheduler.getCurrentTurn()
    });
    // First player doesn't have a Crossroads card drawn for them on turn 1
    this.stateMachine.transition('Roll');
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    if (this.players.length > 1) {
        const previousCrossroadsHolderIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const previousHolder = this.players[previousCrossroadsHolderIndex];
        if (previousHolder && previousHolder.heldCrossroadsCard) {
            console.log(`[GAME] Discarding unplayed Crossroads card from ${previousHolder.name}`);
            previousHolder.heldCrossroadsCard = null;
        }
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.scheduler.advanceTurn();
    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.actionPoints = 2;

    if (this.players.length > 1) {
        const crossroadsHolderIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const crossroadsHolder = this.players[crossroadsHolderIndex];
        crossroadsHolder.heldCrossroadsCard = this.crossroadsDeck.draw();
        console.log(`[GAME] ${crossroadsHolder.name} draws a Crossroads card for ${currentPlayer.name}'s turn.`);
    }

    this.stateMachine.updateContext({
      currentPlayer: currentPlayer.id,
      turnNumber: this.scheduler.getCurrentTurn()
    });
    this.stateMachine.transition('Idle');
    this.stateMachine.transition('Roll');
  }

  checkCrossroadsTrigger(actionType, playerStateBefore, playerStateAfter) {
    const activePlayerId = playerStateAfter.id;

    for (const interrupter of this.players) {
        if (interrupter.id === activePlayerId) continue;

        const card = interrupter.heldCrossroadsCard;
        if (!card) continue;

        let triggerMet = false;
        switch (card.trigger) {
            case 'SIN_INCREASE':
                if (playerStateAfter.stats.sin > playerStateBefore.stats.sin) triggerMet = true;
                break;
            case 'VIRTUE_INCREASE':
                if (playerStateAfter.stats.virtue > playerStateBefore.stats.virtue) triggerMet = true;
                break;
            case 'MONEY_GAIN_LARGE':
                if ((playerStateAfter.stats.money - playerStateBefore.stats.money) > 2000) triggerMet = true;
                break;
        }

        if (triggerMet) {
            console.log(`[MECHANIC] Crossroads trigger '${card.trigger}' met by ${interrupter.name}! Interrupting ${playerStateAfter.name}.`);

            this.stateMachine.updateContext({
              pendingDecision: {
                type: 'CROSSROADS',
                playerId: activePlayerId,
                cardId: card.id,
                text: card.text,
                options: card.options
              }
            });

            this.stateMachine.transition('Decision');
            interrupter.heldCrossroadsCard = null;
            return true; // Interrupt occurred
        }
    }
    return false; // No interrupt
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
