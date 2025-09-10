const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Game } = require('./src/game/Game.js');
const { v4: uuidv4 } = require('uuid');

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
const lpcGeneratorPath = path.join(__dirname, 'lpc-generator');
app.use(express.static(publicPath));
app.use('/lpc-generator', express.static(lpcGeneratorPath));

const games = {};

// --- Helper Functions ---
function checkTurnEnd(game, player) {
  if (player.actionPoints <= 0) {
    console.log(`[GAME] Player ${player.name}'s turn has ended (AP depleted).`);
    game.nextTurn();
  }
}

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
    const gameId = uuidv4();
    const game = new Game(gameName, socket, gameId);
    games[gameId] = game;
    socket.join(gameId);
    socket.emit('game_created', { gameId });
    console.log(`[GAME] Game ${gameId} created by ${socket.id}`);
  });

  socket.on('join_game', ({ gameId, username }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error', { message: 'Game not found.' });
    try {
      const player = game.addPlayer(socket, username);
      socket.join(gameId);
      console.log(`[GAME] Player ${player.name} (${player.id}) joined game ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('start_game', ({ gameId }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error', { message: 'Game not found.' });
    try {
      game.start();
      io.to(gameId).emit('game_started', { gameState: game.getGameState() });
      console.log(`[GAME] Game ${gameId} started.`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // --- Player Action Handlers ---

  socket.on('player_action', (data) => {
    const { gameId, playerId, action } = data;
    const game = games[gameId];
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    if (game.getCurrentPlayer().id !== player.id) {
      return socket.emit('error', { message: 'Not your turn.' });
    }

    const playerStateBefore = JSON.parse(JSON.stringify(player.getPublicState()));
    let cost = 0;
    let actionSucceeded = false;

    switch(action.type) {
        case 'WORK_OVERTIME':
            cost = 2;
            if (player.actionPoints >= cost) {
                player.actionPoints -= cost;
                player.applyEffects({ money: 500, mentalHealth: -1 }, game.scheduler.getCurrentTurn());
                console.log(`[ACTION] ${player.name} works overtime.`);
                actionSucceeded = true;
            }
            break;

        case 'DRAW_CARD':
            if (player.isBurnedOut) {
                return socket.emit('error', { message: "You cannot draw cards while suffering from Burnout." });
            }
            cost = 1;
            if (player.actionPoints >= cost) {
                player.actionPoints -= cost;
                console.log(`[ACTION] ${player.name} draws a card.`);
                actionSucceeded = true;
            }
            break;

        case 'PLAY_CARD':
            cost = 1;
            if (player.actionPoints >= cost) {
                player.actionPoints -= cost;
                console.log(`[ACTION] ${player.name} plays a card. (Not implemented)`);
                actionSucceeded = true;
            }
            break;
    }

    if (!actionSucceeded) {
        return socket.emit('error', { message: "Not enough Action Points." });
    }

    const playerStateAfter = player.getPublicState();
    const interruptOccurred = game.checkCrossroadsTrigger(action.type, playerStateBefore, playerStateAfter);

    io.to(game.id).emit('game_state_update', game.getGameState());

    if (!interruptOccurred) {
        checkTurnEnd(game, player);
        io.to(game.id).emit('game_state_update', game.getGameState());
    }
  });

  socket.on('card_choice', (data) => {
    const { gameId, playerId, choiceIndex } = data;
    const game = games[gameId];
    if (!game) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    const pendingDecision = game.stateMachine.getContext().pendingDecision;
    if (!pendingDecision || pendingDecision.playerId !== playerId) {
      return socket.emit('error', { message: 'Not a valid decision time for this player.' });
    }

    const chosenOption = pendingDecision.options[choiceIndex];
    if (!chosenOption) return socket.emit('error', { message: 'Invalid choice index.' });

    const playerStateBefore = JSON.parse(JSON.stringify(player.getPublicState()));
    player.applyEffects(chosenOption.effects, game.scheduler.getCurrentTurn());
    const playerStateAfter = player.getPublicState();

    console.log(`[GAME] Player ${player.name} chose '${chosenOption.text}'. New stats:`, player.stats);

    game.stateMachine.updateContext({ pendingDecision: null });

    // Only transition to EndTurn if it was a Crossroads decision.
    // Regular card plays will be handled by the AP system.
    if (pendingDecision.type === 'CROSSROADS') {
        game.stateMachine.transition('EndTurn');
    }

    io.to(game.id).emit('card_resolved', {
        playerId: player.id,
        newStats: player.stats,
        choiceText: chosenOption.text
    });
    
    const interruptOccurred = game.checkCrossroadsTrigger('CARD_CHOICE', playerStateBefore, playerStateAfter);
    
    io.to(game.id).emit('game_state_update', game.getGameState());

    if (!interruptOccurred) {
        checkTurnEnd(game, player);
        io.to(game.id).emit('game_state_update', game.getGameState());
    }
  });

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`Serving static files from: ${publicPath}`);
});
