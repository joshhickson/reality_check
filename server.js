const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;

// Simple file logger
const logStream = fs.createWriteStream('game.log', { flags: 'a' });
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(logMessage); // Also log to console for real-time viewing
}

let cardData = {};
const games = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use('/lpc-generator', express.static(path.join(__dirname, 'lpc-generator')));

app.get('/api/games', (req, res) => {
    const availableGames = Object.values(games)
        .filter(game => game.status === 'waiting')
        .map(game => ({ id: game.id, name: game.name, status: game.status, playerCount: game.players.length }));
    res.json(availableGames);
});

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function createPlayer(id, username, socketId) {
    return { id, username, socketId, isBot: false, stats: { money: 20000, mental_health: 8, sin: 1, virtue: 1, clout: 0 }, position: 0, character: null, inventory: [] };
}

function createBotPlayer(id, username) {
    return { id, username, socketId: null, isBot: true, stats: { money: 20000, mental_health: 8, sin: 1, virtue: 1, clout: 0 }, position: 0, character: null, inventory: [] };
}

function createGame(gameId, gameName, maxPlayers) {
    return {
        id: gameId, name: gameName, players: [], maxPlayers, status: 'waiting', round: 0, currentPlayerIndex: 0, board: {},
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
    game.decks[cardType] = shuffleDeck([...cardData[cardType]]);
    return game.decks[cardType].pop();
}

function executeBotTurn(game) {
    const botPlayer = game.players[game.currentPlayerIndex];
    if (!botPlayer || !botPlayer.isBot) return;

    log(`--- Executing turn for bot: ${botPlayer.username} ---`);

    setTimeout(() => {
        const rollResult = Math.floor(Math.random() * 6) + 1;
        botPlayer.position = (botPlayer.position + rollResult) % 50;
        log(`Bot ${botPlayer.username} rolled a ${rollResult} and moved to position ${botPlayer.position}.`);

        const cardTypes = ['sin', 'virtue', 'chaos'];
        const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const drawnCard = drawCard(game, randomType);
        log(`Bot ${botPlayer.username} drew a ${randomType} card: ${drawnCard.name}`);

        const choiceIndex = Math.floor(Math.random() * drawnCard.choices.length);
        const choice = drawnCard.choices[choiceIndex];
        log(`Bot ${botPlayer.username} chose: ${choice.text}`);

        if (choice.effects) {
            for (const stat in choice.effects) {
                if (botPlayer.stats.hasOwnProperty(stat)) {
                    botPlayer.stats[stat] += choice.effects[stat];
                }
            }
        }

        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        io.to(game.id).emit('game_state_updated', {
            message: `${botPlayer.username} took their turn.`,
            gameState: game
        });

        log(`--- Bot turn finished. Next player is ${game.players[game.currentPlayerIndex].username} ---`);
        executeBotTurn(game);

    }, 2000);
}

io.on('connection', (socket) => {
    log(`A user connected: ${socket.id}`);

    socket.on('create_game', ({ gameName, maxPlayers }) => {
        const gameId = uuidv4();
        games[gameId] = createGame(gameId, gameName, maxPlayers);
        log(`Game created: ${gameName} (${gameId})`);
        socket.join(gameId);
        socket.emit('game_created', { gameId });
    });

    socket.on('join_game', ({ gameId, username }) => {
        const game = games[gameId];
        if (!game) return socket.emit('error', { message: 'Game not found.' });
        if (game.players.length >= game.maxPlayers) return socket.emit('error', { message: 'Game is full.' });

        const newPlayer = createPlayer(uuidv4(), username, socket.id);
        game.players.push(newPlayer);
        socket.join(gameId);
        log(`Player ${username} joined game ${game.name}`);
        io.to(gameId).emit('player_joined', { gameId, player: newPlayer, players: game.players });
    });

    socket.on('add_bot', ({ gameId }) => {
        const game = games[gameId];
        if (!game) return socket.emit('error', { message: 'Game not found.' });
        if (game.players.length >= game.maxPlayers) return socket.emit('error', { message: 'Game is full.' });

        const newBot = createBotPlayer(uuidv4(), `Bot_${Math.floor(Math.random() * 1000)}`);
        game.players.push(newBot);
        log(`Bot ${newBot.username} added to game ${game.name}`);
        io.to(gameId).emit('player_joined', { gameId, player: newBot, players: game.players });
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
            if (!player.isBot) {
                io.to(player.socketId).emit('character_assigned', { character: player.character });
            }
        });

        io.to(gameId).emit('game_started', { gameState: game });
        log(`Game ${gameId} started.`);
        executeBotTurn(game);
    });

    socket.on('player_turn', ({ gameId, playerId, rollResult, action }) => {
        const game = games[gameId];
        if (!game || game.status !== 'in_progress') return;

        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        if (action === 'move') {
            player.position = (player.position + rollResult) % 50;
        }

        const cardTypes = ['sin', 'virtue', 'chaos'];
        const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const drawnCard = drawCard(game, randomType);

        io.to(socket.id).emit('turn_result', {
            playerId,
            newPosition: player.position,
            cards: [drawnCard]
        });
    });

    socket.on('card_choice', ({ gameId, playerId, cardId, choiceIndex }) => {
        const game = games[gameId];
        if (!game) return;
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        const card = cardData.all.find(c => c.id === cardId);
        if (!card || !card.choices[choiceIndex]) return socket.emit('error', { message: 'Invalid card or choice.' });

        const choice = card.choices[choiceIndex];
        if (choice.effects) {
            for (const stat in choice.effects) {
                if (player.stats.hasOwnProperty(stat)) {
                    player.stats[stat] += choice.effects[stat];
                }
            }
        }

        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        io.to(gameId).emit('game_state_updated', {
            message: `${player.username} chose: ${choice.text}.`,
            gameState: game
        });

        executeBotTurn(game);
    });

    socket.on('post_on_metanet', ({ gameId, playerId }) => {
        const game = games[gameId];
        if (!game) return;
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        const CLOUT_COST = 100;
        const CLOUT_GAIN = 1;

        if (player.stats.money >= CLOUT_COST) {
            player.stats.money -= CLOUT_COST;
            player.stats.clout += CLOUT_GAIN;
            io.to(gameId).emit('game_state_updated', {
                 message: `${player.username} posted on MetaNet!`,
                 gameState: game
            });
        } else {
            socket.emit('error', { message: "Not enough money to post on MetaNet!" });
        }
    });

    socket.on('disconnect', () => {
        log(`A user disconnected: ${socket.id}`);
        for (const gameId in games) {
            const game = games[gameId];
            const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex > -1) {
                const disconnectedPlayer = game.players.splice(playerIndex, 1)[0];
                io.to(gameId).emit('player_left', {
                    playerId: disconnectedPlayer.id,
                    players: game.players
                });
                log(`Player ${disconnectedPlayer.username} removed from game ${gameId}.`);
                break;
            }
        }
    });
});

async function main() {
    try {
        const filePath = path.join(__dirname, 'cards', 'card_templates.json');
        const fileData = await fs.promises.readFile(filePath, 'utf8');
        const templates = JSON.parse(fileData);

        cardData = {
            sin: templates.starter_deck.filter(c => c.type === 'sin'),
            virtue: templates.starter_deck.filter(c => c.type === 'virtue'),
            chaos: templates.starter_deck.filter(c => c.type === 'chaos'),
            opportunity: templates.starter_deck.filter(c => c.type === 'opportunity'),
            all: templates.starter_deck
        };

        log(`Card data loaded: ${cardData.sin.length} sin, ${cardData.virtue.length} virtue, ${cardData.chaos.length} chaos cards.`);

        server.listen(PORT, () => {
            log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to load card data or start server:', err);
        process.exit(1);
    }
}

main();
