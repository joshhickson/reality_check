/**
 * @file Manages the game server, WebSocket connections, and routes player actions to the game logic.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Game } = require('./src/game/Game.js');
const { v4: uuidv4 } = require('uuid');
const { loadAllCards } = require('./src/game/CardLoader.js');

const app = express();
const server = http.createServer(app);

const CARD_DATA = loadAllCards();

const io = new Server(server, {
  transports: ['polling'],
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Low-level engine error logging
io.engine.on("connection_error", (err) => {
  console.log('[SERVER_ENGINE_ERROR] Connection Error:');
  console.log('Error Code:', err.code);
  console.log('Error Message:', err.message);
  console.log('HTTP Context:', err.context);
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

/**
 * In-memory store for active game instances.
 * @type {Object.<string, Game>}
 */
const games = {};

/**
 * API endpoint to get a list of active game IDs.
 */
app.get('/api/games', (req, res) => {
  res.json(Object.keys(games));
});

console.log('[SERVER] Setting up main socket connection handler...');
// Main socket connection handler
io.on('connection', (socket) => {
  console.log('[SERVER] Connection handler started.');
  console.log(`🔌 New connection: ${socket.id}`);

  // Middleware to log all incoming socket events for debugging.
  socket.use((packet, next) => {
    console.log(`[SERVER][IN] ${packet[0]} from ${socket.id}:`, packet[1]);
    next();
  });

  // Wrap the socket's emit function to log all outgoing events.
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    console.log(`[SERVER][OUT] ${event} to ${socket.id}:`, args[0]);
    originalEmit.apply(socket, [event, ...args]);
  };

  socket.on('heartbeat', (data) => {
    console.log(`[HEARTBEAT] from ${data.name} (${socket.id})`);
  });

  socket.on('create_game', ({ gameName }) => {
    const gameId = uuidv4();
    const game = new Game(gameName, socket, gameId, CARD_DATA);
    games[gameId] = game;
    socket.join(gameId);
    socket.emit('game_created', { gameId });
  });

  socket.on('join_game', ({ gameId, username }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error', { message: 'Game not found.' });
    game.addPlayer(socket, username);
    socket.join(gameId);
    io.to(gameId).emit('player_joined', game.getGameState());
  });

  socket.on('start_game', ({ gameId }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error', { message: 'Game not found.' });
    game.start();
    io.to(gameId).emit('game_started', game.getGameState());
  });

  /**
   * Handles incoming player actions by delegating to the Game instance.
   */
  socket.on('player_action', (data) => {
    if (!data) {
      console.log('[DEFENSIVE LOG] Received player_action with null or undefined data.');
      return;
    }
    const { gameId, playerId, action } = data;
    const game = games[gameId];
    if (!game) {
      return socket.emit('error', { message: 'Game not found.' });
    }

    const result = game.handlePlayerAction(playerId, action);

    if (!result.success) {
      return socket.emit('error', { message: result.error });
    }

    io.to(game.id).emit('game_state_update', game.getGameState());
  });

  socket.on('card_choice', (data) => {
      const { gameId, playerId, choiceIndex } = data;
      const game = games[gameId];
      if (!game) return;
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;

      const pendingDecision = game.pendingDecision;
      if (!pendingDecision || pendingDecision.playerId !== playerId) {
        return socket.emit('error', { message: 'Not a valid decision time for this player.' });
      }

      const chosenOption = pendingDecision.options[choiceIndex];
      if (!chosenOption) return socket.emit('error', { message: 'Invalid choice index.' });

      player.applyEffects(chosenOption.effects);
      game.pendingDecision = null;

      io.to(game.id).emit('card_resolved', {
          playerId: player.id,
          newStats: player.stats,
          choiceText: chosenOption.text
      });

      game.checkTurnEnd(player);
      io.to(game.id).emit('game_state_update', game.getGameState());
  });

  socket.on('submit_testimony', ({ gameId, playerId, kudosTargetId, concernTargetId }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error', { message: 'Game not found.' });
    if (game.stateMachine.getCurrentState() !== 'JudgmentDay') {
      return socket.emit('error', { message: 'It is not time for testimony yet.' });
    }

    const result = game.addTestimony(playerId, kudosTargetId, concernTargetId);
    if (result.error) {
      return socket.emit('error', { message: result.error });
    }

    io.to(gameId).emit('testimony_submitted', {
      playerId: playerId,
      testimoniesCount: game.testimonies.length,
      totalPlayers: game.players.length
    });

    if (game.stateMachine.getCurrentState() === 'Finished') {
      io.to(gameId).emit('game_over', game.getGameState());
    }
  });

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});