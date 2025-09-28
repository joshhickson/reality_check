const { v4: uuidv4 } = require('uuid');
const { StateMachine } = require('../engine/StateMachine.js');
const { RingScheduler } = require('../engine/RingScheduler.js');
const { Player } = require('./Player.js');
const { LifeHappensDeck } = require('./decks/LifeHappensDeck.js');
const { SinDeck } = require('./decks/SinDeck.js');
const { VirtueDeck } = require('./decks/VirtueDeck.js');
const { ExileObjectivesDeck } = require('./decks/ExileObjectivesDeck.js');
const { TITLES } = require('./titles.js');

/**
 * Represents the main game instance, managing state, players, and game logic.
 */
class Game {
  /**
   * Creates a new game instance.
   * @param {string} name - The name of the game.
   * @param {object} creatorSocket - The socket of the player who created the game.
   * @param {string} gameId - The unique identifier for the game.
   * @param {object} cardData - An object containing pre-loaded card arrays.
   */
  constructor(name, creatorSocket, gameId, cardData) {
    this.id = gameId;
    this.name = name;
    this.players = [];
    this.maxHandSize = 5;
    this.pendingDecision = null;

    this.stateMachine = new StateMachine();
    this.scheduler = new RingScheduler();
    this.lifeHappensDeck = new LifeHappensDeck(cardData.lifeHappens);
    this.sinDeck = new SinDeck(cardData.sin);
    this.virtueDeck = new VirtueDeck(cardData.virtue);
    this.exileDeck = new ExileObjectivesDeck(cardData.exile);

    this.lifeHappensDeck.shuffle();
    this.sinDeck.shuffle();
    this.virtueDeck.shuffle();
    this.exileDeck.shuffle();

    this.currentPlayerIndex = 0;
    this.maxTurns = 0;
    this.testimonies = [];
    this.winner = null;
    this.titles = [];
  }

  /**
   * Adds a new player to the game.
   * @param {object} socket - The player's socket connection.
   * @param {string} username - The player's chosen username.
   * @returns {Player} The newly created player object.
   */
  addPlayer(socket, username) {
    if (this.stateMachine.getCurrentState() !== 'Idle') {
      throw new Error('Game has already started.');
    }
    const player = new Player(username, socket);
    this.players.push(player);
    return player;
  }

  /**
   * Starts the game, transitioning its state and setting initial player values.
   */
  start() {
    if (this.players.length < 1) {
      throw new Error('Not enough players to start the game.');
    }
    this.stateMachine.transition('InProgress');
    this.maxTurns = this.players.length * 10;
    this.getCurrentPlayer().stats.actionPoints = 2;
  }

  /**
   * Gets the player whose turn it currently is.
   * @returns {Player} The current player.
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Advances the game to the next turn, checking for game-end conditions.
   */
  nextTurn() {
    this.scheduler.advanceTurn();
    if ((this.scheduler.getCurrentTurn() > this.maxTurns && this.maxTurns > 0) || this.scheduler.getCurrentTurn() > 50) {
        this.stateMachine.transition('JudgmentDay');
        return;
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.stats.actionPoints = 2;
    currentPlayer.updateBurnoutStatus(this.scheduler.getCurrentTurn(), this.players.length);

    this.checkExileCondition();
  }

  /**
   * Checks if the conditions for an exile vote have been met.
   */
  checkExileCondition() {
    if (this.players.length < 3) return;

    const sortedPlayers = [...this.players].sort((a, b) => a.stats.money - b.stats.money);
    const richestPlayer = sortedPlayers[sortedPlayers.length - 1];
    const poorestTwoPlayers = sortedPlayers.slice(0, 2);
    const combinedWealthOfPoorestTwo = poorestTwoPlayers.reduce((sum, p) => sum + p.stats.money, 0);

    if (richestPlayer.stats.money > combinedWealthOfPoorestTwo * 2) {
      this.stateMachine.transition('ProposeExileVote');
      this.pendingDecision = {
        type: 'propose-exile',
        playerId: this.getCurrentPlayer().id,
        targetId: richestPlayer.id,
        text: `Player ${richestPlayer.name} is eligible for exile. Do you want to start a vote?`
      };
    }
  }

  /**
   * Initiates an exile vote.
   * @param {string} playerId - The ID of the player proposing the vote.
   * @returns {{success: boolean}|{error: string}} Result of the action.
   */
  proposeExileVote(playerId) {
    if (this.stateMachine.getCurrentState() !== 'ProposeExileVote' || this.pendingDecision.playerId !== playerId) {
      return { error: 'Not the right time to propose an exile vote.' };
    }

    this.stateMachine.transition('AwaitingExileVote');
    const targetPlayer = this.players.find(p => p.id === this.pendingDecision.targetId);
    this.pendingDecision = {
      type: 'exile-vote',
      targetId: this.pendingDecision.targetId,
      votes: {},
      voters: this.players.filter(p => p.id !== this.pendingDecision.targetId).map(p => p.id),
      text: `Vote to exile ${targetPlayer.name}?`
    };
    return { success: true };
  }

  /**
   * Submits a single player's vote for an ongoing exile proposal.
   * @param {string} playerId - The ID of the voting player.
   * @param {boolean} vote - The player's vote (true for 'yes', false for 'no').
   * @returns {{success: boolean}|{error: string}} Result of the action.
   */
  submitExileVote(playerId, vote) {
    if (this.stateMachine.getCurrentState() !== 'AwaitingExileVote' || !this.pendingDecision.voters.includes(playerId)) {
      return { error: 'Not the right time to vote for exile.' };
    }

    this.pendingDecision.votes[playerId] = vote;

    if (Object.keys(this.pendingDecision.votes).length === this.pendingDecision.voters.length) {
      this.tallyExileVotes();
    }

    return { success: true };
  }

  /**
   * Tallies the votes of an exile proposal and processes the result.
   */
  tallyExileVotes() {
    const votes = Object.values(this.pendingDecision.votes);
    const yesVotes = votes.filter(v => v).length;
    const noVotes = votes.length - yesVotes;

    if (yesVotes > noVotes) {
      this.handleExile();
    } else {
      this.pendingDecision = null;
      this.stateMachine.transition('InProgress');
    }
  }

  /**
   * Processes the consequences of a successful exile vote.
   */
  handleExile() {
    const exiledPlayer = this.players.find(p => p.id === this.pendingDecision.targetId);
    if (!exiledPlayer) return;

    console.log(`[GAME] Player ${exiledPlayer.name} has been exiled!`);

    const moneyToRedistribute = exiledPlayer.stats.money / 2;
    exiledPlayer.stats.money -= moneyToRedistribute;

    const otherPlayers = this.players.filter(p => p.id !== exiledPlayer.id);
    if (otherPlayers.length > 0) {
      const share = moneyToRedistribute / otherPlayers.length;
      otherPlayers.forEach(p => p.stats.money += share);
    }

    exiledPlayer.isExiled = true;
    exiledPlayer.secretObjective = this.exileDeck.draw();
    if (exiledPlayer.secretObjective.id === 'exile_001') {
        exiledPlayer.secretObjective.data = { leaderId: this.pendingDecision.targetId };
    }

    this.pendingDecision = null;
    this.stateMachine.transition('InProgress');
  }

  /**
   * Adds a player's testimony during the 'Judgment Day' phase.
   * @param {string} playerId - The ID of the player submitting the testimony.
   * @param {string} kudosTargetId - The ID of the player receiving kudos.
   * @param {string} concernTargetId - The ID of the player receiving concern.
   * @returns {{success: boolean}|{error: string}} Result of the action.
   */
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

  /**
   * Calculates the final scores for all players at the end of the game.
   */
  calculateFinalScores() {
    this.checkExileWinConditions();

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

    let builderBonusAwarded = false;
    if (this.players.length > 0) {
        const topBuilder = this.players.reduce((max, p) => p.stats.communityImpact > max.stats.communityImpact ? p : max, this.players[0]);
        if (topBuilder.stats.communityImpact > 0) {
            const bonus = topBuilder.getCommunityImpactBonus();
            topBuilder.finalScore = (topBuilder.finalScore || 0) + bonus;
            console.log(`[GAME] Awarded ${bonus} point Builder Bonus to ${topBuilder.name}`);
            builderBonusAwarded = true;
        }
    }

    this.players.forEach(player => {
      if (builderBonusAwarded && player.finalScore) {
          // Score already calculated for the builder
      } else {
        const { money, mentalHealth, sin, virtue, kudos, concern } = player.stats;
        let mhBonus = 0;
        if (mentalHealth >= 8) {
            mhBonus = 10;
        } else if (mentalHealth >= 5) {
            mhBonus = 5;
        }
        const score = (money / 200) + (virtue * 1.5) - (sin * 1.5) + mhBonus + (kudos * 2) - (concern * 2);
        player.finalScore = score;
      }
    });

    this.players.sort((a, b) => b.finalScore - a.finalScore);

    const exiledPlayers = this.players.filter(p => p.isExiled);
    exiledPlayers.forEach(exiledPlayer => {
        if (exiledPlayer.secretObjective && exiledPlayer.secretObjective.id === 'exile_001') { // Saboteur's Gambit
            const leaderAtExile = this.players.find(p => p.id === exiledPlayer.secretObjective.data.leaderId);
            if (leaderAtExile && leaderAtExile === this.players[this.players.length - 1]) {
                this.winner = exiledPlayer;
                console.log(`[GAME] ${exiledPlayer.name} wins by completing the Saboteur's Gambit objective!`);
            }
        }
    });

    if (!this.winner && this.players.length > 0) {
      this.winner = this.players.filter(p => !p.isExiled)[0];
    }

    this.awardTitles();

    this.stateMachine.transition('Finished');
  }

  /**
   * Awards titles to players based on their performance and stats.
   */
  awardTitles() {
      TITLES.forEach(title => {
          const winner = title.isAwardedTo(this.players);
          if (winner) {
              this.titles.push({ title: title.name, winner: winner.name });
              const player = this.players.find(p => p.id === winner.id);
              if(player) {
                  player.titles.push(title.name);
              }
          }
      });
  }

  /**
   * Checks if any exiled players have met their secret win conditions.
   */
  checkExileWinConditions() {
    const exiledPlayers = this.players.filter(p => p.isExiled);
    exiledPlayers.forEach(exiledPlayer => {
      if (!exiledPlayer.secretObjective) return;

      switch (exiledPlayer.secretObjective.id) {
        case 'exile_002': // Anarchist's Dream
          const burnedOutPlayers = this.players.filter(p => p.isBurnedOut && p.id !== exiledPlayer.id);
          if (burnedOutPlayers.length >= 2) {
            this.winner = exiledPlayer;
            console.log(`[GAME] ${exiledPlayer.name} wins by completing the Anarchist's Dream objective!`);
          }
          break;
      }
    });
  }

  /**
   * Checks if the current player's turn should end.
   * @param {Player} player - The player whose turn it is.
   * @returns {boolean} True if the turn ended, false otherwise.
   */
  checkTurnEnd(player) {
    const playerToCheck = player || this.getCurrentPlayer();
    console.log(`[GAME] Checking turn end for ${playerToCheck.name}. AP: ${playerToCheck.stats.actionPoints}, PendingDecision: ${JSON.stringify(this.pendingDecision)}`);
    if (playerToCheck.stats.actionPoints <= 0 && !this.pendingDecision) {
      console.log(`[GAME] Player ${playerToCheck.name}'s turn has ended (AP depleted).`);
      this.nextTurn();
      return true;
    }
    return false;
  }

  /**
   * Processes a player action, updating game state accordingly.
   * @param {string} playerId - The ID of the player performing the action.
   * @param {object} action - The action object from the client.
   * @returns {{success: boolean, error?: string}} An object indicating the result of the action.
   */
  handlePlayerAction(playerId, action) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: "Player not found." };
    }

    if (this.getCurrentPlayer().id !== player.id) {
      return { success: false, error: "Not your turn." };
    }

    let actionSucceeded = false;
    let cost = 0;

    switch(action.type) {
        case 'WORK_OVERTIME':
            cost = 2;
            if (player.stats.actionPoints >= cost) {
                player.stats.actionPoints -= cost;
                player.applyEffects({ money: 500, mentalHealth: -1, sin: 1, narrativeMomentum: 1 });
                actionSucceeded = true;
            }
            break;

        case 'DRAW_CARD':
            cost = player.isBurnedOut ? 2 : 1; // Burnout increases AP cost

            if (player.hand.length >= this.maxHandSize) {
                return { success: false, error: "Your hand is full." };
            }

            if (player.stats.actionPoints >= cost) {
                player.stats.actionPoints -= cost;
                let card;
                if (action.payload.deck === 'SIN') {
                    card = this.sinDeck.draw();
                } else if (action.payload.deck === 'VIRTUE') {
                    card = this.virtueDeck.draw();
                }
                if (card) {
                    player.hand.push(card);
                }
                player.applyEffects({ narrativeMomentum: 1 });
                actionSucceeded = true;
            }
            break;

        case 'PLAY_CARD':
            cost = 1;
            if (player.stats.actionPoints >= cost) {
                const cardIndex = player.hand.findIndex(c => c.id === action.payload.cardId);
                if (cardIndex > -1) {
                    player.stats.actionPoints -= cost;
                    const cardToPlay = player.hand.splice(cardIndex, 1)[0];
                    const effects = {
                        money: parseInt(cardToPlay.money) || 0,
                        mentalHealth: parseInt(cardToPlay.mental) || 0,
                        sin: parseInt(cardToPlay.sin) || 0,
                        virtue: parseInt(cardToPlay.virtue) || 0,
                        socialCapital: parseInt(cardToPlay.socialCapital) || 0
                    };
                    player.applyEffects(effects);
                    actionSucceeded = true;
                }
            }
            break;

        case 'SPEND_MOMENTUM':
            cost = 5;
            if (player.stats.narrativeMomentum >= cost) {
                player.stats.narrativeMomentum -= cost;
                const card = this.lifeHappensDeck.draw();
                if (card) {
                    this.pendingDecision = {
                        type: 'LIFE_HAPPENS',
                        playerId: player.id,
                        cardId: card.id,
                        text: card.text,
                        options: card.choices
                    };
                }
                actionSucceeded = true;
            }
            break;

        case 'PASS_TURN':
            player.stats.actionPoints = 0;
            actionSucceeded = true;
            break;
    }

    if (!actionSucceeded) {
      return { success: false, error: "Not enough resources." };
    }

    this.checkTurnEnd(player);
    return { success: true };
  }

  /**
   * Returns a serializable object representing the current state of the game.
   * @returns {object} The public game state.
   */
  getGameState() {
    return {
      id: this.id,
      name: this.name,
      players: this.players.map(p => p.getPublicState()),
      currentPlayerId: this.getCurrentPlayer() ? this.getCurrentPlayer().id : null,
      currentTurn: this.scheduler.getCurrentTurn(),
      currentState: this.stateMachine.getCurrentState(),
      pendingDecision: this.pendingDecision,
      winner: this.winner,
      titles: this.titles
    };
  }
}

module.exports = { Game };