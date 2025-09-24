const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Game } = require('./src/game/Game.js');
const { v4: uuidv4 } = require('uuid');
const { handleWorkOvertime } = require('./src/game/actions/workOvertime.js');
const { handleDrawCard } = require('./src/game/actions/drawCard.js');
const { handlePlayCard } = require('./src/game/actions/playCard.js');
const { handleSpendMomentum } = require('./src/game/actions/spendMomentum.js');
const { handlePassTurn } = require('./src/game/actions/passTurn.js');
const { handleUseSocialCapital } = require('./src/game/actions/useSocialCapital.js');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

const games = {};

function checkTurnEnd(game, player) {
  console.log(`[GAME] Checking turn end for ${player.name}. AP: ${player.stats.actionPoints}, PendingDecision: ${JSON.stringify(game.pendingDecision)}`);
  if (player.stats.actionPoints <= 0 && !game.pendingDecision) {
    console.log(`[GAME] Player ${player.name}'s turn has ended (AP depleted).`);
    game.nextTurn();
    return true;
  }
  return false;
}

app.get('/api/games', (req, res) => {
  res.json(Object.keys(games));
});

io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  socket.use((packet, next) => {
    console.log(`[SERVER][IN] ${packet[0]} from ${socket.id}:`, packet[1]);
    next();
  });

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
    const game = new Game(gameName, socket, gameId);
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

  socket.on('player_action', (data) => {
    const { gameId, playerId, action } = data;
    const game = games[gameId];
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    if (game.getCurrentPlayer().id !== player.id) {
      return socket.emit('error', { message: 'Not your turn.' });
    }

    const actionHandlers = {
      'WORK_OVERTIME': (player) => handleWorkOvertime(player),
      'DRAW_CARD': (player, game, payload) => handleDrawCard(player, game, payload),
      'PLAY_CARD': (player, game, payload) => handlePlayCard(player, payload),
      'SPEND_MOMENTUM': (player, game) => handleSpendMomentum(player, game),
      'PASS_TURN': (player) => handlePassTurn(player),
      'USE_SOCIAL_CAPITAL': (player) => handleUseSocialCapital(player),
    };

    const handler = actionHandlers[action.type];
    if (!handler) {
      return socket.emit('error', { message: `Unknown action type: ${action.type}` });
    }

    const actionSucceeded = handler(player, game, action.payload);

    if (!actionSucceeded) {
      return socket.emit('error', { message: "Action failed or not enough resources." });
    }

    checkTurnEnd(game, player);
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

      checkTurnEnd(game, player);
      io.to(game.id).emit('game_state_update', game.getGameState());
  });

  socket.on('submit_testimony', ({ gameId, playerId, kudosTargetId, concernTargetId }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error', { message: 'Game not found.' });
    if (game.status !== 'judgment_day') {
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

    if (game.status === 'finished') {
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
