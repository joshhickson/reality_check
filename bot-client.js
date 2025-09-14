const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const TURN_LIMIT = 20; // Increased limit for more actions

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
            console.log(`My Stats: AP=${me.stats.actionPoints}, Hand=${me.hand.length}, MH=${me.stats.mentalHealth}`);

            setTimeout(() => {
                if (pendingDecision && pendingDecision.playerId === this.playerId) {
                    this.handleDecision(pendingDecision);
                } else if (me.stats.actionPoints > 0) {
                    this.takeTurn(me);
                }
            }, 500); // Shorter delay for faster simulation
        }
    }

    takeTurn(me) {
        if (me.stats.actionPoints <= 0) return;

        // New Strategy: Use the card system
        if (me.hand.length >= 5) {
            // Must play a card if hand is full
            const cardToPlay = me.hand[0]; // Play the first card
            console.log(`[${this.name}] Hand is full. Playing card: ${cardToPlay.text}`);
            this.socket.emit('player_action', {
                gameId: this.gameId,
                playerId: this.playerId,
                action: { type: 'PLAY_CARD', payload: { cardId: cardToPlay.id } }
            });
        } else {
            // Randomly draw a card
            const deckToDraw = Math.random() > 0.5 ? 'SIN' : 'VIRTUE';
            console.log(`[${this.name}] Drawing from ${deckToDraw} deck.`);
            this.socket.emit('player_action', {
                gameId: this.gameId,
                playerId: this.playerId,
                action: { type: 'DRAW_CARD', payload: { deck: deckToDraw } }
            });
        }
    }

    handleDecision(pendingDecision) {
        console.log(`[${this.name}] Decision: "${pendingDecision.text}"`);
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
    console.log("--- Starting Card System Bot Simulation ---");
    const bot1 = new Bot("Alice");
    const bot2 = new Bot("Bob");

    try {
        await bot1.connect();
        await bot2.connect();

        const { gameId } = await bot1.createGame("Card Game Test");
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
