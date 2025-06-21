
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

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

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting',
        max_players INTEGER DEFAULT 5,
        current_round INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID REFERENCES games(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        socket_id VARCHAR(255),
        character_data JSONB,
        stats JSONB DEFAULT '{"money": 5000, "mental_health": 5, "sin": 0, "virtue": 0, "public_eye": 0}',
        position INTEGER DEFAULT 0,
        is_alive BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID REFERENCES games(id) ON DELETE CASCADE,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        round_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        effects JSONB,
        ring_type VARCHAR(50)
      )
    `);

    console.log('Database initialized successfully');
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
      const result = await pool.query(
        'INSERT INTO games (id, name, max_players) VALUES ($1, $2, $3) RETURNING *',
        [gameId, data.gameName, data.maxPlayers || 5]
      );

      const game = result.rows[0];
      gameStates.set(gameId, {
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
      });

      socket.join(gameId);
      socket.emit('game_created', { gameId, game });
    } catch (err) {
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  socket.on('join_game', async (data) => {
    try {
      const { gameId, username } = data;
      
      const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (gameResult.rows.length === 0) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const playersResult = await pool.query('SELECT COUNT(*) FROM players WHERE game_id = $1', [gameId]);
      const playerCount = parseInt(playersResult.rows[0].count);
      
      if (playerCount >= gameResult.rows[0].max_players) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }

      // Generate random character
      const character = generateRandomCharacter();
      
      const playerResult = await pool.query(
        'INSERT INTO players (game_id, username, socket_id, character_data) VALUES ($1, $2, $3, $4) RETURNING *',
        [gameId, username, socket.id, JSON.stringify(character)]
      );

      const player = playerResult.rows[0];
      
      socket.join(gameId);
      
      const gameState = gameStates.get(gameId);
      if (gameState) {
        gameState.players.push(player);
      }

      io.to(gameId).emit('player_joined', { player, playerCount: playerCount + 1 });
      socket.emit('character_assigned', { character });
    } catch (err) {
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('start_game', async (data) => {
    try {
      const { gameId } = data;
      
      await pool.query('UPDATE games SET status = $1 WHERE id = $2', ['active', gameId]);
      
      const gameState = gameStates.get(gameId);
      if (gameState) {
        gameState.currentRound = 1;
        gameState.currentPlayer = 0;
      }

      io.to(gameId).emit('game_started', { gameState });
    } catch (err) {
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('player_turn', async (data) => {
    try {
      const { gameId, playerId, action, rollResult } = data;
      
      const gameState = gameStates.get(gameId);
      if (!gameState) return;

      // Update player position
      await pool.query(
        'UPDATE players SET position = position + $1 WHERE id = $2',
        [rollResult, playerId]
      );

      // Determine which ring events trigger
      const triggeredRings = checkRingTriggers(gameState, gameState.currentRound);
      
      // Generate appropriate cards based on position and triggered rings
      const cards = await generateCardsForTurn(playerId, triggeredRings);

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
    } catch (err) {
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
    const result = await pool.query('SELECT * FROM games WHERE status = $1', ['waiting']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Reality Check game server running on port ${PORT}`);
  });
});
