const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Database = require('@replit/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Replit Key-Value Store
const db = new Database();

// Initialize database with default cards
async function initDatabase() {
  try {
    // Initialize default cards if they don't exist
    const cardsExist = await db.get('cards_initialized');
    if (!cardsExist) {
      const defaultCards = [
        {
          id: uuidv4(),
          type: 'sin',
          title: 'Easy Money',
          description: 'Accept a suspicious cash job. +$2000, +2 Sin',
          effects: { money: 2000, sin: 2 },
          ring_type: 'career'
        },
        {
          id: uuidv4(),
          type: 'virtue',
          title: 'Help a Neighbor',
          description: 'Spend your weekend helping someone move. -$100, +2 Virtue',
          effects: { money: -100, virtue: 2 },
          ring_type: 'social'
        },
        {
          id: uuidv4(),
          type: 'chaos',
          title: 'Unexpected Vet Bill',
          description: 'Your pet needs emergency surgery. -$3000, +1 Mental Health if you pay',
          effects: { money: -3000, mental_health: 1 },
          ring_type: 'personal'
        },
        {
          id: uuidv4(),
          type: 'chaos',
          title: 'Divorce Papers',
          description: 'Your spouse files for divorce. -$5000, -2 Mental Health, +3 Public Eye',
          effects: { money: -5000, mental_health: -2, public_eye: 3 },
          ring_type: 'personal'
        },
        {
          id: uuidv4(),
          type: 'chaos',
          title: 'Medical Mystery',
          description: 'Roll for diagnosis. 1-2: Cancer, 3-4: Chronic illness, 5-6: False alarm',
          effects: { mental_health: -1 },
          ring_type: 'health'
        }
      ];

      await db.set('default_cards', defaultCards);
      await db.set('cards_initialized', true);
    }

    console.log('Replit database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Game state management
const gameStates = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_game', async (data) => {
    try {
      const gameId = uuidv4();
      const game = {
        id: gameId,
        name: data.gameName,
        status: 'waiting',
        max_players: data.maxPlayers || 5,
        current_round: 0,
        created_at: new Date().toISOString(),
        players: []
      };

      // Store game in database
      await db.set(`game:${gameId}`, game);

      // Store game state
      const gameState = {
        id: gameId,
        players: [],
        currentRound: 0,
        currentPlayer: 0,
        chaos_rings: {
          career: { frequency: 4, lastTriggered: 0 },
          health: { frequency: 6, lastTriggered: 0 },
          social: { frequency: 8, lastTriggered: 0 },
          personal: { frequency: 10, lastTriggered: 0 },
          babel: { frequency: 12, lastTriggered: 0 }
        }
      };

      gameStates.set(gameId, gameState);
      await db.set(`gamestate:${gameId}`, gameState);

      socket.join(gameId);
      socket.emit('game_created', { gameId, game });
    } catch (err) {
      console.error('Create game error:', err);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  socket.on('join_game', async (data) => {
    try {
      const { gameId, username } = data;

      // Get game from database
      const game = await db.get(`game:${gameId}`);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.players.length >= game.max_players) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }

      // Generate random character
      const character = generateRandomCharacter();

      const player = {
        id: uuidv4(),
        game_id: gameId,
        username: username,
        socket_id: socket.id,
        character_data: character,
        stats: { money: character.background.money, mental_health: 5, sin: 0, virtue: 0, public_eye: 0 },
        position: 0,
        is_alive: true,
        created_at: new Date().toISOString()
      };

      // Add player to game
      game.players.push(player);
      await db.set(`game:${gameId}`, game);
      await db.set(`player:${player.id}`, player);

      socket.join(gameId);

      const gameState = gameStates.get(gameId);
      if (gameState) {
        gameState.players.push(player);
        await db.set(`gamestate:${gameId}`, gameState);
      }

      io.to(gameId).emit('player_joined', { player, playerCount: game.players.length });
      socket.emit('character_assigned', { character });
    } catch (err) {
      console.error('Join game error:', err);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('start_game', async (data) => {
    try {
      const { gameId } = data;

      // Update game status
      const game = await db.get(`game:${gameId}`);
      if (game) {
        game.status = 'active';
        await db.set(`game:${gameId}`, game);
      }

      const gameState = gameStates.get(gameId);
      if (gameState) {
        gameState.currentRound = 1;
        gameState.currentPlayer = 0;
        await db.set(`gamestate:${gameId}`, gameState);
      }

      io.to(gameId).emit('game_started', { gameState });
    } catch (err) {
      console.error('Start game error:', err);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('player_turn', async (data) => {
    try {
      const { gameId, playerId, action, rollResult } = data;

      const gameState = gameStates.get(gameId);
      if (!gameState) return;

      // Update player position
      const player = await db.get(`player:${playerId}`);
      if (player) {
        player.position += rollResult;
        await db.set(`player:${playerId}`, player);
      }

      // Determine which ring events trigger
      const triggeredRings = checkRingTriggers(gameState, gameState.currentRound);

      // Generate appropriate cards based on position and triggered rings
      const cards = await generateCardsForTurn(playerId, triggeredRings);

      // Log the event
      const gameEvent = {
        id: uuidv4(),
        game_id: gameId,
        player_id: playerId,
        event_type: 'player_turn',
        event_data: { rollResult, triggeredRings, cards },
        round_number: gameState.currentRound,
        created_at: new Date().toISOString()
      };
      await db.set(`event:${gameEvent.id}`, gameEvent);

      io.to(gameId).emit('turn_result', {
        playerId,
        rollResult,
        triggeredRings,
        cards,
        nextPlayer: (gameState.currentPlayer + 1) % gameState.players.length
      });

      gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
      if (gameState.currentPlayer === 0) {
        gameState.currentRound++;
      }

      await db.set(`gamestate:${gameId}`, gameState);
    } catch (err) {
      console.error('Turn processing error:', err);
      socket.emit('error', { message: 'Turn processing failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper functions
function generateRandomCharacter() {
  const backgrounds = [
    { type: 'privileged', money: 15000, description: 'Trust fund kid' },
    { type: 'working_class', money: 3000, description: 'Blue collar family' },
    { type: 'immigrant', money: 1000, description: 'Recent immigrant' },
    { type: 'middle_class', money: 8000, description: 'Suburban upbringing' }
  ];

  const traits = [
    'Optimistic', 'Stubborn', 'Creative', 'Analytical', 'Charismatic', 'Cautious'
  ];

  const drawbacks = [
    'Addictive Personality', 'Trust Issues', 'Impulsive', 'Anxious', 'Prideful'
  ];

  const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const selectedTraits = traits.sort(() => 0.5 - Math.random()).slice(0, 2);
  const selectedDrawback = drawbacks[Math.floor(Math.random() * drawbacks.length)];

  return {
    background,
    traits: selectedTraits,
    drawback: selectedDrawback,
    age: 18,
    documentation: background.type === 'immigrant' ? 'work_permit' : 'drivers_license'
  };
}

function checkRingTriggers(gameState, currentRound) {
  const triggered = [];

  Object.entries(gameState.chaos_rings).forEach(([ringName, ring]) => {
    if (currentRound % ring.frequency === 0) {
      triggered.push(ringName);
      ring.lastTriggered = currentRound;
    }
  });

  return triggered;
}

async function generateCardsForTurn(playerId, triggeredRings) {
  // For now, return sample cards - this would integrate with your card system
  return [
    {
      type: 'sin',
      title: 'Easy Money',
      description: 'Accept a suspicious cash job. +$2000, +2 Sin',
      effects: { money: 2000, sin: 2 }
    },
    {
      type: 'virtue',
      title: 'Help a Neighbor',
      description: 'Spend your weekend helping someone move. -$100, +2 Virtue',
      effects: { money: -100, virtue: 2 }
    }
  ];
}

// API Routes
app.get('/api/games', async (req, res) => {
  try {
    const gameKeys = await db.list('game:');
    const games = [];

    for (const key of gameKeys) {
      const game = await db.get(key);
      if (game && game.status === 'waiting') {
        games.push(game);
      }
    }

    res.json(games);
  } catch (err) {
    console.error('Fetch games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// API endpoint to load game state
app.get('/api/game/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const gameData = await db.get(`game:${roomId}`);

    if (gameData) {
      res.json(JSON.parse(gameData));
    } else {
      res.json({ players: {}, currentPlayer: 0, gamePhase: 'waiting' });
    }
  } catch (error) {
    console.error('Error loading game:', error);
    res.status(500).json({ error: 'Failed to load game' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 5000;

// Initialize database - Replit DB is key-value, no tables needed
async function initDatabase() {
  try {
    // Replit Database is ready to use, no initialization required
    console.log('Replit Database connected successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Reality Check game server running on port ${PORT}`);
  });
});