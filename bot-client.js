const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const TURN_LIMIT = 15; // Increased limit to see NM system play out

class Bot {
    constructor(name) {
        this.name = name;
        this.socket = null;
        this.playerId = null;
        this.gameId = null;
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

        const { currentPlayerId, players, currentTurn, pendingDecision } = gameState;

        if (currentTurn > TURN_LIMIT) {
            console.log("--- Reached turn limit. Ending simulation. ---");
            this.disconnect();
            return;
        }

        const me = players.find(p => p.id === this.playerId);
        if (!me) return;

        if (currentPlayerId === this.playerId) {
            console.log(`\n--- [${this.name}] Turn ${currentTurn} ---`);
            console.log(`My Stats: AP=${me.stats.actionPoints}, NM=${me.stats.narrativeMomentum}, MH=${me.stats.mentalHealth}`);

            setTimeout(() => {
                if (pendingDecision && pendingDecision.playerId === this.playerId) {
                    this.handleDecision(pendingDecision);
                } else if (me.stats.actionPoints > 0) {
                    this.takeTurn(me);
                }
            }, 1000);
        }
    }

    takeTurn(me) {
        // Strategy: If we can afford a "Life Happens" event, do it. Otherwise, take a basic action.
        if (me.stats.narrativeMomentum >= 5) {
            console.log(`[${this.name}] Spending 5 NM to trigger a 'Life Happens' event.`);
            this.socket.emit('player_action', {
                gameId: this.gameId,
                playerId: this.playerId,
                action: { type: 'SPEND_MOMENTUM' }
            });
        } else {
            // Default action if we can't afford anything else, or as a primary strategy.
            // This is the most reliable action for testing NM generation.
            console.log(`[${this.name}] Taking 'WORK_OVERTIME' to build NM.`);
            this.socket.emit('player_action', {
                gameId: this.gameId,
                playerId: this.playerId,
                action: { type: 'WORK_OVERTIME' }
            });
        }
    }

    handleDecision(pendingDecision) {
        console.log(`[${this.name}] Decision: "${pendingDecision.text}"`);
        // Simple strategy: always choose the first option.
        const choiceIndex = 0;
        console.log(`[${this.name}] Choosing option ${choiceIndex}: "${pendingDecision.options[choiceIndex].text}"`);
        this.socket.emit('card_choice', {
            gameId: this.gameId,
            playerId: this.playerId,
            choiceIndex: choiceIndex
        });
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }
}

async function runSimulation() {
    console.log("--- Starting Hybrid Model Bot Simulation ---");
    const bot1 = new Bot("CreatorBot");
    const bot2 = new Bot("JoinerBot");

    try {
        await bot1.connect();
        await bot2.connect();

        const { gameId } = await bot1.createGame("Bot Test Game");
        await bot2.joinGame(gameId);

        console.log("\n--- Starting Game ---");
        bot1.startGame();

    } catch (error) {
        console.error("Simulation failed:", error);
        bot1.disconnect();
        bot2.disconnect();
    }
}

runSimulation();
