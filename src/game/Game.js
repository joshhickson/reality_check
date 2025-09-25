const { v4: uuidv4 } = require('uuid');
const { StateMachine } = require('../engine/StateMachine.js');
const { RingScheduler } = require('../engine/RingScheduler.js');
const { Player } = require('./Player.js');
const { LifeHappensDeck } = require('./decks/LifeHappensDeck.js');
const { SinDeck } = require('./decks/SinDeck.js');
const { VirtueDeck } = require('./decks/VirtueDeck.js');
const { ExileObjectivesDeck } = require('./decks/ExileObjectivesDeck.js');
const { TITLES } = require('./titles.js');

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
    this.exileDeck = new ExileObjectivesDeck();

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
    if ((this.scheduler.getCurrentTurn() > this.maxTurns && this.maxTurns > 0) || this.scheduler.getCurrentTurn() > 50) {
        this.status = 'judgment_day';
        this.stateMachine.transition('JudgmentDay');
        return;
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    const currentPlayer = this.getCurrentPlayer();
    currentPlayer.stats.actionPoints = 2;
    currentPlayer.updateBurnoutStatus(this.scheduler.getCurrentTurn(), this.players.length);

    this.checkExileCondition();
  }

  checkExileCondition() {
    if (this.players.length < 3 || this.pendingDecision) return;

    const sortedPlayers = [...this.players].sort((a, b) => a.stats.money - b.stats.money);
    const richestPlayer = sortedPlayers[sortedPlayers.length - 1];
    const poorestTwoPlayers = sortedPlayers.slice(0, 2);
    const combinedWealthOfPoorestTwo = poorestTwoPlayers.reduce((sum, p) => sum + p.stats.money, 0);

    if (richestPlayer.id !== this.getCurrentPlayer().id && richestPlayer.stats.money > combinedWealthOfPoorestTwo * 2) {
      this.pendingDecision = {
        type: 'PROPOSE_EXILE',
        playerId: this.getCurrentPlayer().id,
        targetId: richestPlayer.id,
        text: `Player ${richestPlayer.name} is eligible for exile. Do you want to start a vote?`,
        options: [
          { text: 'Propose a vote to exile.', action: 'PROPOSE' },
          { text: 'Do nothing.', action: 'PASS' }
        ]
      };
    }
  }

  proposeExileVote(playerId) {
    if (this.pendingDecision.type !== 'PROPOSE_EXILE' || this.pendingDecision.playerId !== playerId) {
      return { error: 'Not the right time to propose an exile vote.' };
    }

    this.status = 'AWAITING_VOTE';
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

  submitExileVote(playerId, vote) {
    if (this.status !== 'AWAITING_VOTE' || !this.pendingDecision.voters.includes(playerId)) {
      return { error: 'Not the right time to vote for exile.' };
    }

    this.pendingDecision.votes[playerId] = vote;

    if (Object.keys(this.pendingDecision.votes).length === this.pendingDecision.voters.length) {
      this.tallyExileVotes();
    }

    return { success: true };
  }

  tallyExileVotes() {
    const votes = Object.values(this.pendingDecision.votes);
    const yesVotes = votes.filter(v => v).length;
    const noVotes = votes.length - yesVotes;

    if (yesVotes > noVotes) {
      this.handleExile(this.pendingDecision.targetId);
    } else {
      this.pendingDecision = null;
      this.status = 'in-progress';
    }
  }

  handleExile(leaderAtTimeOfExileId) {
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
    exiledPlayer.exileObjective = this.exileDeck.draw();
    exiledPlayer.exileObjective.leaderIdAtTimeOfExile = leaderAtTimeOfExileId;

    this.pendingDecision = null;
    this.status = 'in-progress';
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

    this.checkExileWinConditions();

    if (!this.winner && this.players.length > 0) {
      this.winner = this.players.filter(p => !p.isExiled)[0];
    }

    this.awardTitles();

    this.status = 'finished';
    this.stateMachine.transition('Finished');
  }

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

  checkExileWinConditions() {
    const exiledPlayers = this.players.filter(p => p.isExiled);
    if (exiledPlayers.length === 0) return;

    // Note: a player's finalScore must be calculated before this method is called.
    const sortedPlayers = [...this.players].sort((a, b) => b.finalScore - a.finalScore);

    exiledPlayers.forEach(exiledPlayer => {
      if (!exiledPlayer.exileObjective) return;

      switch (exiledPlayer.exileObjective.id) {
        case 'exile_01': // Saboteur's Gambit
          const leaderAtExile = this.players.find(p => p.id === exiledPlayer.exileObjective.leaderIdAtTimeOfExile);
          if (leaderAtExile && sortedPlayers[sortedPlayers.length - 1].id === leaderAtExile.id) {
            this.winner = exiledPlayer;
            console.log(`[GAME] ${exiledPlayer.name} wins by completing the Saboteur's Gambit objective!`);
          }
          break;

        case 'exile_02': // Anarchist's Dream
          const burnedOutPlayers = this.players.filter(p => p.isBurnedOut && p.id !== exiledPlayer.id);
          if (burnedOutPlayers.length >= exiledPlayer.exileObjective.condition.burnout_count) {
            this.winner = exiledPlayer;
            console.log(`[GAME] ${exiledPlayer.name} wins by completing the Anarchist's Dream objective!`);
          }
          break;
      }
    });
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
      winner: this.winner,
      titles: this.titles
    };
  }
}

module.exports = { Game };