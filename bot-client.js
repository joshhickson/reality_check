const { io } = require("socket.io-client");
const { RandomStrategy } = require("./strategies/random.js");
const { HustlerStrategy } = require("./strategies/hustler.js");
const { ZenStrategy } = require("./strategies/zen.js");

const SERVER_URL = "http://localhost:5000";

class Bot {
    constructor(name, strategy) {
        this.name = name;
        this.strategy = strategy;
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
                } else {
                    // The strategy will determine if any action is possible,
                    // including spending momentum at 0 AP.
                    this.takeTurn(me);
                }
            }, 500);
        }
    }

    takeTurn(me) {
        const action = this.strategy.chooseAction(me);
        if (action) {
            console.log(`[${this.name}] Taking action:`, action.type, action.payload || '');
            this.socket.emit('player_action', {
                gameId: this.gameId,
                playerId: this.playerId,
                action: action
            });
        } else {
            console.log(`[${this.name}] No possible actions.`);
        }
    }

    handleDecision(pendingDecision) {
        const choiceIndex = this.strategy.makeDecision(pendingDecision);
        console.log(`[${this.name}] Decision: "${pendingDecision.text}"`);
        console.log(`[${this.name}] Choosing option ${choiceIndex}: "${pendingDecision.options[choiceIndex].text}"`);
        this.socket.emit('card_choice', {
            gameId: this.gameId,
            playerId: this.playerId,
            choiceIndex: choiceIndex
        });
    }

    submitTestimony(players) {
        const testimony = this.strategy.giveTestimony(this.playerId, players);
        if (!testimony) return;

        const { kudosTargetId, concernTargetId } = testimony;
        const kudosTarget = players.find(p => p.id === kudosTargetId);
        const concernTarget = players.find(p => p.id === concernTargetId);

        console.log(`[${this.name}] Submitting testimony: Kudos for ${kudosTarget.name}, Concern for ${concernTarget.name}`);

        this.socket.emit('submit_testimony', {
            gameId: this.gameId,
            playerId: this.playerId,
            kudosTargetId,
            concernTargetId
        });
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }
}

async function runSimulation(strategyTypes) {
    console.log(`--- Starting Bot Simulation with bots: ${strategyTypes.join(', ')} ---`);
    const bots = [];
    for (let i = 0; i < strategyTypes.length; i++) {
        const strategyName = strategyTypes[i];
        let strategy;
        if (strategyName === 'hustler') {
            strategy = new HustlerStrategy();
        } else if (strategyName === 'zen') {
            strategy = new ZenStrategy();
        } else {
            strategy = new RandomStrategy();
        }
        bots.push(new Bot(`${strategyName.charAt(0).toUpperCase() + strategyName.slice(1)}Bot-${i + 1}`, strategy));
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

const scenario = process.argv[2] || 'baseline';
let strategies;

switch (scenario) {
    case 'hustler_test':
        console.log("Running Hustler Dominance Test...");
        strategies = ['hustler', 'random', 'random', 'random'];
        break;
    case 'zen_test':
        console.log("Running Zen Viability Test...");
        strategies = ['zen', 'random', 'random', 'random'];
        break;
    case 'clash':
        console.log("Running Clash of Ideologies Test...");
        strategies = ['hustler', 'hustler', 'zen', 'zen'];
        break;
    case 'baseline':
    default:
        console.log("Running Baseline Test...");
        strategies = ['random', 'random', 'random', 'random'];
        break;
}

runSimulation(strategies);
