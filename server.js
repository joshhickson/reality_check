const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;

// --- Globals ---
let cardData = {}; // To hold all card templates

// In-memory storage for game states
const games = {};


// --- Server Setup ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/lpc-generator', express.static(path.join(__dirname, 'lpc-generator')));

app.get('/api/games', (req, res) => {
    const availableGames = Object.values(games)
        .filter(game => game.status === 'waiting')
        .map(game => ({ id: game.id, name: game.name, status: game.status, playerCount: game.players.length }));
    res.json(availableGames);
});


// --- Helper Functions ---
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function createPlayer(id, username, socketId) {
    return {
        id,
        username,
        socketId,
        stats: { money: 20000, mental_health: 8, sin: 1, virtue: 1, clout: 0 },
        position: 0,
        character: null,
        inventory: []
    };
}

function createGame(gameId, gameName, maxPlayers) {
    return {
        id: gameId,
        name: gameName,
        players: [],
        maxPlayers,
        status: 'waiting',
        round: 0,
        currentPlayerIndex: 0,
        board: {},
        decks: {
            sin: shuffleDeck([...cardData.sin]),
            virtue: shuffleDeck([...cardData.virtue]),
            chaos: shuffleDeck([...cardData.chaos])
        }
    };
}

function drawCard(game, cardType) {
    if (game.decks[cardType] && game.decks[cardType].length > 0) {
        return game.decks[cardType].pop();
    }
    // Reshuffle if deck is empty
    game.decks[cardType] = shuffleDeck([...cardData[cardType]]);
    return game.decks[cardType].pop();
}


// --- Socket.IO Logic ---
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('create_game', ({ gameName, maxPlayers }) => {
        const gameId = uuidv4();
        const newGame = createGame(gameId, gameName, maxPlayers);
        games[gameId] = newGame;
        console.log(`Game created: ${gameName} (${gameId})`);
        socket.join(gameId);
        socket.emit('game_created', { gameId });
    });

    socket.on('join_game', ({ gameId, username }) => {
        const game = games[gameId];
        if (!game) return socket.emit('error', { message: 'Game not found.' });
        if (game.players.length >= game.maxPlayers) return socket.emit('error', { message: 'Game is full.' });

        const playerId = uuidv4();
        const newPlayer = createPlayer(playerId, username, socket.id);
        game.players.push(newPlayer);
        socket.join(gameId);
        console.log(`Player ${username} joined game ${game.name}`);
        io.to(gameId).emit('player_joined', { gameId, player: newPlayer, players: game.players });
    });

    socket.on('start_game', ({ gameId }) => {
        const game = games[gameId];
        if (!game) return;

        game.status = 'in_progress';
        game.round = 1;
        game.players.forEach(player => {
            player.character = {
                background: { description: "Came from a small town with big dreams.", money: player.stats.money },
                traits: ["Charismatic", "Impulsive"],
                drawback: "Terrible at remembering names"
            };
            io.to(player.socketId).emit('character_assigned', { character: player.character });
        });

        io.to(gameId).emit('game_started', { gameState: game });
        console.log(`Game ${gameId} started.`);
    });

    socket.on('player_turn', ({ gameId, playerId, rollResult, action }) => {
        const game = games[gameId];
        if (!game || game.status !== 'in_progress') return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        if (action === 'move') {
            player.position = (player.position + rollResult) % 50;
        }

        // Draw a card from a random deck type
        const cardTypes = ['sin', 'virtue', 'chaos'];
        const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const drawnCard = drawCard(game, randomType);
        console.log(`Drew a ${randomType} card: ${drawnCard.name}`);

        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        io.to(gameId).emit('turn_result', {
            playerId,
            newPosition: player.position,
            cards: [drawnCard], // Send as an array
            nextPlayer: game.currentPlayerIndex,
            gameState: game
        });
    });

    socket.on('card_choice', ({ gameId, playerId, cardId, choiceIndex }) => {
        const game = games[gameId];
        if (!game) return;
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        // Find the original card from the 'all' list to apply its effects
        const card = cardData.all.find(c => c.id === cardId);
        if (!card || !card.choices[choiceIndex]) return;

        const choice = card.choices[choiceIndex];
        if (choice.effects) {
            for (const stat in choice.effects) {
                if (player.stats.hasOwnProperty(stat)) {
                    player.stats[stat] += choice.effects[stat];
                }
            }
        }

        console.log(`Player ${player.username} chose: ${choice.action}. New stats:`, player.stats);

        io.to(gameId).emit('card_resolved', {
            playerId,
            cardId,
            newStats: player.stats,
            gameState: game
        });
    });

    socket.on('post_on_metanet', ({ gameId, playerId }) => {
        const game = games[gameId];
        if (!game) return;
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        // Define the cost and reward for posting
        const CLOUT_COST = 100; // in money
        const CLOUT_GAIN = 1;

        if (player.stats.money >= CLOUT_COST) {
            player.stats.money -= CLOUT_COST;
            player.stats.clout += CLOUT_GAIN;

            console.log(`Player ${player.username} posted on MetaNet. New clout: ${player.stats.clout}`);

            // Notify clients of the stat change
            io.to(gameId).emit('stats_updated', {
                playerId,
                newStats: player.stats
            });
        } else {
            socket.emit('error', { message: "Not enough money to post on MetaNet!" });
        }
    });

    socket.on('disconnect', () => {
        console.log(`A user disconnected: ${socket.id}`);
        for (const gameId in games) {
            const game = games[gameId];
            const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex > -1) {
                const disconnectedPlayer = game.players.splice(playerIndex, 1)[0];
                io.to(gameId).emit('player_left', {
                    playerId: disconnectedPlayer.id,
                    players: game.players
                });
                console.log(`Player ${disconnectedPlayer.username} removed from game ${gameId}.`);
                break;
            }
        }
    });
});


// --- Main Application Logic ---
async function main() {
    try {
        const filePath = path.join(__dirname, 'cards', 'card_templates.json');
        const data = await fs.readFile(filePath, 'utf8');
        const templates = JSON.parse(data);

        // Correctly parse the single deck into typed decks
        cardData = {
            sin: templates.starter_deck.filter(c => c.type === 'sin'),
            virtue: templates.starter_deck.filter(c => c.type === 'virtue'),
            chaos: templates.starter_deck.filter(c => c.type === 'chaos'),
            opportunity: templates.starter_deck.filter(c => c.type === 'opportunity'),
            // Keep a flat list for easy lookups by ID
            all: templates.starter_deck
        };

        // The card lookup logic will be fixed in the main connection handler.

        console.log(`Card data loaded: ${cardData.sin.length} sin, ${cardData.virtue.length} virtue, ${cardData.chaos.length} chaos cards.`);

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to load card data or start server:', err);
        process.exit(1);
    }
}

main();
