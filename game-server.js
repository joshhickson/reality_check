const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Game } = require('./src/game/Game.js');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Correctly configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Static File Serving ---
const publicPath = path.join(__dirname, 'public');
const lpcGeneratorPath = path.join(__dirname, 'lpc-generator');
app.use(express.static(publicPath));
app.use('/lpc-generator', express.static(lpcGeneratorPath));

// --- In-memory storage for games ---
const games = {};

// --- API Routes ---
app.get('/api/games', (req, res) => {
  const publicGames = Object.values(games).map(game => ({
    id: game.id,
    name: game.name,
    playerCount: game.players.length,
    status: game.status,
  }));
  res.json(publicGames);
});

// --- Socket.IO Game Logic ---
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  socket.on('create_game', ({ gameName }) => {
    console.log(`[EVENT] create_game from ${socket.id}`, { gameName });
    const gameId = uuidv4();
    const game = new Game(gameName, socket, gameId);
    games[gameId] = game;
    socket.join(gameId);
    socket.emit('game_created', { gameId });
    console.log(`[GAME] Game ${gameId} created by ${socket.id}`);
  });

  socket.on('join_game', ({ gameId, username }) => {
    console.log(`[EVENT] join_game from ${socket.id}`, { gameId, username });
    const game = games[gameId];
    if (!game) {
      return socket.emit('error', { message: 'Game not found.' });
    }
    try {
      const player = game.addPlayer(socket, username);
      socket.join(gameId);
      console.log(`[GAME] Player ${player.name} (${player.id}) joined game ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('start_game', ({ gameId }) => {
    console.log(`[EVENT] start_game from ${socket.id}`, { gameId });
    const game = games[gameId];
    if (!game) {
      return socket.emit('error', { message: 'Game not found.' });
    }
    try {
      game.start();
      io.to(gameId).emit('game_started', { gameState: game.getGameState() });
      console.log(`[GAME] Game ${gameId} started.`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('card_choice', (data) => {
    console.log(`[EVENT] card_choice from ${socket.id}`, data);
    const { gameId, playerId } = data;
    const game = games[gameId];
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    const placeholderEffect = { mentalHealth: -1, money: 100 };
    const currentRound = game.scheduler.getCurrentTurn();
    player.applyEffects(placeholderEffect, currentRound);
    console.log(`[GAME] Player ${player.name} chose an option. New stats:`, player.stats);

    game.stateMachine.transition('EndTurn');
    io.to(game.id).emit('card_resolved', {
        playerId: player.id,
        newStats: player.stats
    });

    setTimeout(() => {
        game.nextTurn();
        io.to(game.id).emit('game_state_update', game.getGameState());
    }, 2000);
  });

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// --- Server Start ---
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`Serving static files from: ${publicPath}`);
});
