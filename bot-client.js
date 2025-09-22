const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";

class Bot {
    constructor(name) {
        this.name = name;
        this.socket = null;
        this.playerId = null;
        this.gameId = null;
        this.voted = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(SERVER_URL, { reconnection: false, transports: ["websocket"] });
            this.socket.on('connect', () => resolve());
            this.socket.on('connect_error', (err) => reject(err));
            this.socket.on('disconnect', () => console.log(`[${this.name}] Disconnected.`));
            this.socket.on('game_state_update', (data) => this.handleGameStateUpdate(data));
            this.socket.on('game_started', (data) => this.handleGameStateUpdate(data));
            this.socket.on('card_resolved', (data) => console.log(`[${this.name}] Card resolved: ${data.choiceText}`));
            this.socket.on('error', (data) => console.error(`[${this.name}] Server Error:`, data.message));
            this.socket.on('game_over', (data) => {
                console.log(`\n--- [${this.name}] GAME OVER ---`);
                const finalGameState = data;
                console.log('Final Scores:', finalGameState.players.map(p => ({ name: p.name, score: p.finalScore.toFixed(2) })));
                if (finalGameState.winner) {
                    console.log(`Winner: ${finalGameState.winner.name}`);
                }
                this.disconnect();
            });
        });
    }

    createGame(gameName) {
        return new Promise((resolve) => {
            this.socket.emit('create_game', { gameName });
            this.socket.on('game_created', (data) => {
                this.gameId = data.gameId;
                this.joinGame(this.gameId).then(() => resolve({ gameId: this.gameId }));
            });
        });
    }

    joinGame(gameId) {
        return new Promise((resolve) => {
            this.socket.emit('join_game', { gameId, username: this.name });
            this.socket.on('player_joined', (gameState) => {
                const me = gameState.players.find(p => p.name === this.name);
                if (me && !this.playerId) {
                    this.playerId = me.id;
                    this.gameId = gameId;
                    console.log(`[${this.name}] Joined game ${this.gameId} as player ${this.playerId}`);
                    resolve();
                }
            });
        });
    }

    startGame() {
        if (this.gameId) {
            this.socket.emit('start_game', { gameId: this.gameId });
        }
    }

    handleGameStateUpdate(gameState) {
        if (!gameState || !gameState.players) return;
        const { status, currentPlayerId, players, currentTurn, pendingDecision } = gameState;

        if (status === 'finished') {
            return;
        }

        const me = players.find(p => p.id === this.playerId);
        if (!me) return;

        if (status === 'judgment_day') {
            if (!this.voted) {
                this.submitTestimony(players);
                this.voted = true;
            }
            return;
        }

        if (currentPlayerId === this.playerId) {
            console.log(`\n--- [${this.name}] Turn ${currentTurn} ---`);
            console.log(`My Stats: AP=${me.stats.actionPoints}, Hand=${me.hand.length}, MH=${me.stats.mentalHealth}, NM=${me.stats.narrativeMomentum}`);

            setTimeout(() => {
                if (pendingDecision && pendingDecision.playerId === this.playerId) {
                    this.handleDecision(pendingDecision);
                } else if (me.stats.actionPoints > 0) {
                    this.takeTurn(me);
                }
            }, 500);
        }
    }

    takeTurn(me) {
        if (me.stats.actionPoints <= 0) return;

        const possibleActions = [];

        if (me.stats.actionPoints >= 2) {
            possibleActions.push({ type: 'WORK_OVERTIME' });
        }
        if (me.stats.actionPoints >= 1 && me.hand.length < 5 && !me.isBurnedOut) {
            possibleActions.push({ type: 'DRAW_CARD' });
        }
        if (me.stats.actionPoints >= 1 && me.hand.length > 0) {
            possibleActions.push({ type: 'PLAY_CARD' });
        }
        if (me.stats.narrativeMomentum >= 5) {
            possibleActions.push({ type: 'SPEND_MOMENTUM' });
        }

        if (possibleActions.length === 0) {
            console.log(`[${this.name}] No possible actions.`);
            return;
        }

        let action = possibleActions[Math.floor(Math.random() * possibleActions.length)];

        if (action.type === 'DRAW_CARD') {
            action.payload = { deck: Math.random() > 0.5 ? 'SIN' : 'VIRTUE' };
        }
        if (action.type === 'PLAY_CARD') {
            const cardToPlay = me.hand[Math.floor(Math.random() * me.hand.length)];
            action.payload = { cardId: cardToPlay.id };
        }

        console.log(`[${this.name}] Taking action:`, action.type, action.payload || '');
        this.socket.emit('player_action', {
            gameId: this.gameId,
            playerId: this.playerId,
            action: action
        });
    }

    handleDecision(pendingDecision) {
        console.log(`[${this.name}] Decision: "${pendingDecision.text}"`);
        const choiceIndex = Math.floor(Math.random() * pendingDecision.options.length);
        console.log(`[${this.name}] Choosing option ${choiceIndex}: "${pendingDecision.options[choiceIndex].text}"`);
        this.socket.emit('card_choice', {
            gameId: this.gameId,
            playerId: this.playerId,
            choiceIndex: choiceIndex
        });
    }

    submitTestimony(players) {
        const otherPlayers = players.filter(p => p.id !== this.playerId);
        if (otherPlayers.length === 0) {
            return;
        }

        const kudosTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const concernTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

        console.log(`[${this.name}] Submitting testimony: Kudos for ${kudosTarget.name}, Concern for ${concernTarget.name}`);

        this.socket.emit('submit_testimony', {
            gameId: this.gameId,
            playerId: this.playerId,
            kudosTargetId: kudosTarget.id,
            concernTargetId: concernTarget.id
        });
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }
}

async function runSimulation(numBots = 2) {
    console.log(`--- Starting Bot Simulation with ${numBots} bots ---`);
    const bots = [];
    for (let i = 0; i < numBots; i++) {
        bots.push(new Bot(`Bot-${i + 1}`));
    }

    try {
        for (const bot of bots) {
            await bot.connect();
        }

        const creatorBot = bots[0];
        const { gameId } = await creatorBot.createGame("Bot Game");

        for (let i = 1; i < bots.length; i++) {
            await bots[i].joinGame(gameId);
        }

        console.log("\n--- Starting Game ---");
        creatorBot.startGame();

    } catch (error) {
        console.error("Simulation failed:", error);
        bots.forEach(b => b.disconnect());
    }
}

const numBotsToRun = process.argv[2] ? parseInt(process.argv[2]) : 2;
runSimulation(numBotsToRun);
