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
        this.controlsCreator = false; // Flag to indicate if this bot controls the 'Creator' player
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

            // Listen for game state updates
            this.socket.on('game_state_update', (data) => this.handleGameStateUpdate(data));
            this.socket.on('game_started', (data) => this.handleGameStateUpdate(data));

            // Generic event logger for debugging
            this.socket.onAny((eventName, ...args) => {
                console.log(`[${this.name}] Event: ${eventName}`, JSON.stringify(args));
            });
        });
    }

    createGame(gameName) {
        return new Promise((resolve) => {
            this.socket.emit('create_game', { gameName });
            this.socket.on('game_created', (data) => {
                this.gameId = data.gameId;
                console.log(`Game created with ID: ${this.gameId}`);
                // The creator of the game also joins it.
                this.joinGame(this.gameId).then(() => {
                    resolve({ gameId: this.gameId });
                });
            });
        });
    }

    joinGame(gameId) {
        return new Promise((resolve) => {
            this.socket.emit('join_game', { gameId, username: this.name });
            this.socket.on('player_joined', (playerData) => {
                if (playerData.player.name === this.name) {
                    this.playerId = playerData.player.id;
                    this.gameId = gameId;
                    console.log(`Bot ${this.name} joined game ${this.gameId} with player ID ${this.playerId}`);
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

    handleGameStateUpdate(data) {
        const gameState = data.gameState || data;
        if (!gameState) {
            console.error(`[${this.name}] Invalid game state data received:`, data);
            return;
        }

        const { currentPlayerId, players, currentState, currentTurn } = gameState;

        if (currentTurn > TURN_LIMIT) {
            console.log("Reached turn limit. Ending simulation.");
            this.disconnect();
            return;
        }

        const currentPlayer = players.find(p => p.id === currentPlayerId);
        if (!currentPlayer) {
            console.log("Game over or invalid state. Disconnecting.");
            this.disconnect();
            return;
        }

        // A bot acts if it's their turn, or if they are controlling the 'Creator' player
        const isMyTurn = currentPlayer.id === this.playerId;
        const isCreatorTurn = currentPlayer.name === 'Creator' && this.controlsCreator;

        if (isMyTurn || isCreatorTurn) {
            console.log(`[${this.name}] It's ${currentPlayer.name}'s turn. State is ${currentState}`);
            setTimeout(() => {
                this.makeDecision(gameState);
            }, 2000); // Wait 2 seconds to make the simulation easier to follow
        }
    }

    makeDecision(gameState) {
        const { currentState, currentPlayerId } = gameState;

        if (currentState === 'Roll') {
            console.log(`[${this.name}] Rolling the dice.`);
            this.socket.emit('roll_dice', {
                gameId: this.gameId,
                playerId: currentPlayerId
            });
        } else if (currentState === 'Decision') {
            const choiceIndex = this.chooseOption(gameState);
            console.log(`[${this.name}] Making a choice (option ${choiceIndex}).`);
            this.socket.emit('card_choice', {
                gameId: this.gameId,
                playerId: currentPlayerId,
                cardId: 'dummy_card', // This will need to be dynamic in the future
                choiceIndex: choiceIndex
            });
        }
    }

    chooseOption(gameState) {
        const pendingDecision = gameState.pendingDecision;
        if (!pendingDecision || !pendingDecision.options || pendingDecision.options.length === 0) {
            console.log(`[${this.name}] No decision options found, defaulting to 0.`);
            return 0;
        }

        const options = pendingDecision.options;

        switch (this.personality) {
            case 'Aggressive':
                console.log(`[${this.name}] Choosing as Aggressive personality.`);
                let bestSinOption = 0;
                let maxSin = -Infinity;
                options.forEach((option, i) => {
                    const sin = option.effects.sin || 0;
                    if (sin > maxSin) {
                        maxSin = sin;
                        bestSinOption = i;
                    }
                });
                return bestSinOption;

            case 'Virtuous':
                console.log(`[${this.name}] Choosing as Virtuous personality.`);
                let bestVirtueOption = 0;
                let maxVirtue = -Infinity;
                options.forEach((option, i) => {
                    const virtue = option.effects.virtue || 0;
                    if (virtue > maxVirtue) {
                        maxVirtue = virtue;
                        bestVirtueOption = i;
                    }
                });
                return bestVirtueOption;

            case 'Random':
            default:
                console.log(`[${this.name}] Choosing as Random personality.`);
                return Math.floor(Math.random() * options.length);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

async function runSimulation() {
    const bot1 = new Bot("Bot1", "Aggressive");
    const bot2 = new Bot("Bot2", "Virtuous");

    try {
        // Connect both bots
        await bot1.connect();
        await bot2.connect();

        // Bot1 creates the game. This also makes Bot1 join the game.
        const { gameId } = await bot1.createGame("Bot Game");
        bot1.controlsCreator = true; // Bot1 is the game creator, so it controls the 'Creator' player

        // Bot2 joins the game
        await bot2.joinGame(gameId);

        console.log("Starting game with an Aggressive bot and a Virtuous bot...");
        bot1.startGame();

    } catch (error) {
        console.error("Simulation failed:", error);
        bot1.disconnect();
        bot2.disconnect();
    }
}

runSimulation();
