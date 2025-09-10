const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const TURN_LIMIT = 10;

class Bot {
    constructor(name, personality = 'Random') {
        this.name = name;
        this.personality = personality;
        this.socket = null;
        this.playerId = null;
        this.gameId = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(SERVER_URL, {
                reconnection: false,
                transports: ["websocket"],
            });

            this.socket.on('connect', () => {
                console.log(`Bot ${this.name} connected with id ${this.socket.id}`);
                resolve();
            });

            this.socket.on('connect_error', (err) => {
                console.error(`Bot ${this.name} connection error: ${err.message}`);
                reject(err);
            });

            this.socket.on('disconnect', () => {
                console.log(`Bot ${this.name} disconnected`);
            });

            this.socket.on('game_state_update', (data) => this.handleGameStateUpdate(data));
            this.socket.on('game_started', (data) => this.handleGameStateUpdate(data.gameState));
            this.socket.on('card_resolved', (data) => console.log(`[${this.name}] Card resolved:`, data));
            this.socket.on('error', (data) => console.error(`[${this.name}] Server Error:`, data.message));
        });
    }

    createGame(gameName) {
        return new Promise((resolve) => {
            this.socket.emit('create_game', { gameName });
            this.socket.on('game_created', (data) => {
                this.gameId = data.gameId;
                console.log(`[${this.name}] Game created with ID: ${this.gameId}`);
                this.joinGame(this.gameId).then(() => {
                    resolve({ gameId: this.gameId });
                });
            });
        });
    }

    joinGame(gameId) {
        return new Promise((resolve) => {
            this.socket.emit('join_game', { gameId, username: this.name });
            this.socket.on('player_joined', (data) => {
                if (data.player.name === this.name) {
                    this.playerId = data.player.id;
                    this.gameId = gameId;
                    console.log(`[${this.name}] Joined game ${this.gameId} with player ID ${this.playerId}`);
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
        if (!gameState || !gameState.players) {
            console.error(`[${this.name}] Invalid game state data received:`, gameState);
            return;
        }

        const { currentPlayerId, players, currentState, currentTurn, pendingDecision } = gameState;

        if (currentTurn > TURN_LIMIT) {
            console.log("Reached turn limit. Ending simulation.");
            this.disconnect();
            return;
        }

        const me = players.find(p => p.id === this.playerId);
        if (!me) return;

        if (currentPlayerId === this.playerId) {
            console.log(`\n--- [${this.name}] It's my turn (Turn ${currentTurn}) ---`);
            console.log(`My Stats: ${JSON.stringify(me.stats)}`);
            console.log(`My AP: ${me.actionPoints}`);

            setTimeout(() => {
                if (pendingDecision && pendingDecision.playerId === this.playerId) {
                    this.handleDecision(pendingDecision);
                } else if (me.actionPoints > 0) {
                    this.takeTurn(me);
                }
            }, 1500);
        }
    }

    takeTurn(me) {
        if (me.actionPoints <= 0) return;

        // Enhanced strategy: randomly choose actions to better test the system.
        if (me.actionPoints >= 2) {
            if (Math.random() > 0.5) {
                console.log(`[${this.name}] Decided to WORK_OVERTIME.`);
                this.socket.emit('player_action', {
                    gameId: this.gameId,
                    playerId: this.playerId,
                    action: { type: 'WORK_OVERTIME' }
                });
            } else {
                console.log(`[${this.name}] Decided to DRAW_CARD twice.`);
                this.socket.emit('player_action', {
                    gameId: this.gameId,
                    playerId: this.playerId,
                    action: { type: 'DRAW_CARD' }
                });
                // The bot will get another game_state_update and take its second action.
            }
        } else if (me.actionPoints >= 1) {
             console.log(`[${this.name}] Decided to DRAW_CARD.`);
             this.socket.emit('player_action', {
                gameId: this.gameId,
                playerId: this.playerId,
                action: { type: 'DRAW_CARD' }
            });
        }
    }

    handleDecision(pendingDecision) {
        console.log(`[${this.name}] I have a decision to make: "${pendingDecision.text}"`);
        const choiceIndex = this.chooseOption(pendingDecision.options);
        console.log(`[${this.name}] Making a choice (option ${choiceIndex}).`);
        this.socket.emit('card_choice', {
            gameId: this.gameId,
            playerId: this.playerId,
            choiceIndex: choiceIndex
        });
    }

    chooseOption(options) {
        // For now, bot always chooses the first option during a decision.
        return 0;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

async function runSimulation() {
    console.log("--- Starting Bot Simulation ---");
    const creatorBot = new Bot("CreatorBot");
    const joiningBot = new Bot("JoinerBot");

    try {
        await creatorBot.connect();
        await joiningBot.connect();

        const { gameId } = await creatorBot.createGame("Bot Test Game");

        await joiningBot.joinGame(gameId);

        console.log("\n--- Starting Game ---");
        creatorBot.startGame();

    } catch (error) {
        console.error("Simulation failed:", error);
        creatorBot.disconnect();
        joiningBot.disconnect();
    }
}

runSimulation();
