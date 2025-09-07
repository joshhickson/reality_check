const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";

let gameId;
let bot1_socket;
let bot2_socket;
let bot1_id;
let bot2_id;
const turnLimit = 10; // Stop after 10 turns
let turnCount = 0;

function connectBot(name) {
    return new Promise((resolve, reject) => {
        const socket = io(SERVER_URL, {
            reconnection: false,
            transports: ["websocket"],
        });

        socket.on('connect', () => {
            console.log(`Bot ${name} connected with id ${socket.id}`);
            resolve(socket);
        });

        socket.on('connect_error', (err) => {
            console.error(`Bot ${name} connection error: ${err.message}`);
            reject(err);
        });

        socket.on('disconnect', () => {
            console.log(`Bot ${name} disconnected`);
        });

        // Generic event logger
        socket.onAny((eventName, ...args) => {
            console.log(`[${name}] Event: ${eventName}`, args);
        });
    });
}

function createGame(socket, gameName, username) {
    return new Promise((resolve) => {
        socket.emit('create_game', { gameName });
        socket.on('game_created', (data) => {
            gameId = data.gameId;
            console.log(`Game created with ID: ${gameId}`);
            // Join the game immediately after creation
            socket.emit('join_game', { gameId, username });
            socket.on('player_joined', (playerData) => {
                if(playerData.player.name === username) {
                    resolve(playerData.player.id);
                }
            });
        });
    });
}

function joinGame(socket, gameId, username) {
    return new Promise((resolve) => {
        socket.emit('join_game', { gameId, username });
        socket.on('player_joined', (playerData) => {
             if(playerData.player.name === username) {
                resolve(playerData.player.id);
            }
        });
    });
}

function startGame(socket, gameId) {
    socket.emit('start_game', { gameId });
}

function handleGameStateUpdate(data) {
    console.log("Game state update received");
    const gameState = data.gameState || data; // Handle both event structures
    if (!gameState) {
        console.error("Invalid game state data received:", data);
        return;
    }

    turnCount = gameState.currentTurn;
    console.log(`Current turn: ${turnCount}`);

    if (turnCount > turnLimit) {
        console.log("Reached turn limit. Ending simulation.");
        bot1_socket.disconnect();
        bot2_socket.disconnect();
        return;
    }

    const { currentPlayerId, players, currentState } = gameState;
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    if (!currentPlayer) {
        console.log("Game over or invalid state.");
        bot1_socket.disconnect();
        bot2_socket.disconnect();
        return;
    }

    console.log(`It's ${currentPlayer.name}'s turn. State is ${currentState}`);

    let currentSocket;
    if (currentPlayer.id === bot1_id) {
        currentSocket = bot1_socket;
    } else if (currentPlayer.id === bot2_id) {
        currentSocket = bot2_socket;
    }

    if (currentSocket) {
        setTimeout(() => {
            if (currentState === 'Roll') {
                console.log(`Bot ${currentPlayer.name} is rolling the dice.`);
                currentSocket.emit('roll_dice', {
                    gameId: gameId,
                    playerId: currentPlayer.id
                });
            } else if (currentState === 'Decision') {
                console.log(`Bot ${currentPlayer.name} is making a choice.`);
                currentSocket.emit('card_choice', {
                    gameId: gameId,
                    playerId: currentPlayer.id,
                    cardId: 'dummy_card',
                    choiceIndex: 0
                });
            }
        }, 2000);
    }
}


async function runSimulation() {
    try {
        bot1_socket = await connectBot("Bot1");
        bot2_socket = await connectBot("Bot2");

        bot1_id = await createGame(bot1_socket, "Bot Game", "Bot1");
        bot2_id = await joinGame(bot2_socket, gameId, "Bot2");

        bot1_socket.on('game_started', handleGameStateUpdate);
        bot2_socket.on('game_started', handleGameStateUpdate);
        bot1_socket.on('game_state_update', handleGameStateUpdate);
        bot2_socket.on('game_state_update', handleGameStateUpdate);

        console.log("Starting game...");
        startGame(bot1_socket, gameId);

    } catch (error) {
        console.error("Simulation failed:", error);
    }
}

runSimulation();
