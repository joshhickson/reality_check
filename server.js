const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Database = require('@replit/database');
const { Client } = require('pg');

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

// Serve LPC sprite assets
app.use('/lpc-generator', express.static('lpc-generator'));

// Replit Key-Value Store
const db = new Database();

// PostgreSQL Database for sprite path caching
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL
});

// Initialize PostgreSQL connection
async function initPostgreSQL() {
  try {
    await pgClient.connect();
    console.log('PostgreSQL connected successfully');
    
    // Create sprite_paths table if it doesn't exist
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS sprite_paths (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        body_type VARCHAR(20) NOT NULL,
        animation VARCHAR(30) NOT NULL,
        style VARCHAR(50),
        file_path TEXT NOT NULL,
        is_valid BOOLEAN DEFAULT true,
        last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, body_type, animation, style, file_path)
      )
    `);
    
    // Create indexes for faster lookups
    await pgClient.query(`
      CREATE INDEX IF NOT EXISTS idx_sprite_category_body 
      ON sprite_paths(category, body_type)
    `);
    
    await pgClient.query(`
      CREATE INDEX IF NOT EXISTS idx_sprite_valid 
      ON sprite_paths(is_valid) WHERE is_valid = true
    `);
    
    console.log('Sprite paths table initialized');
    
  } catch (error) {
    console.error('PostgreSQL initialization error:', error);
  }
}

// Card deck management system
const fs = require('fs');
const path = require('path');

class CardDeckManager {
  constructor() {
    this.decks = new Map();
    this.loadCards();
  }

  loadCards() {
    try {
      const cardPath = path.join(__dirname, 'cards', 'card_templates.json');
      if (fs.existsSync(cardPath)) {
        const cardData = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
        this.decks.set('starter', cardData.starter_deck);
        console.log(`Loaded ${cardData.starter_deck.length} cards from starter deck`);
      }
    } catch (err) {
      console.error('Error loading cards:', err);
      // Fallback to hardcoded cards if file doesn't exist
      this.createFallbackDeck();
    }
  }

  createFallbackDeck() {
    const fallbackCards = [
      {
        id: 'easy_money',
        name: 'Easy Money',
        type: 'sin',
        category: 'career',
        description: 'A shady contact offers you quick cash.',
        choices: [
          {
            text: 'Take the job (+$2000, +2 Sin)',
            effects: { money: 2000, sin: 2, legal_standing: -1 }
          },
          {
            text: 'Walk away (+1 Virtue)',
            effects: { virtue: 1 }
          }
        ],
        rarity: 'common'
      }
    ];
    this.decks.set('starter', fallbackCards);
  }

  getRandomCard(deckName = 'starter', filters = {}) {
    const deck = this.decks.get(deckName);
    if (!deck) return null;

    let filteredCards = deck.filter(card => {
      if (filters.type && card.type !== filters.type) return false;
      if (filters.category && card.category !== filters.category) return false;
      if (filters.minRound && card.min_round > filters.minRound) return false;
      return true;
    });

    if (filteredCards.length === 0) filteredCards = deck;

    return filteredCards[Math.floor(Math.random() * filteredCards.length)];
  }

  getCardsByCategory(category, deckName = 'starter') {
    const deck = this.decks.get(deckName);
    if (!deck) return [];
    return deck.filter(card => card.category === category);
  }

  addDeck(name, cards) {
    this.decks.set(name, cards);
  }
}

const cardManager = new CardDeckManager();

// Sprite path caching functions
async function cacheSpritePath(category, bodyType, animation, style, filePath, isValid = true) {
  try {
    await pgClient.query(`
      INSERT INTO sprite_paths (category, body_type, animation, style, file_path, is_valid)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (category, body_type, animation, style, file_path) 
      DO UPDATE SET 
        is_valid = $6,
        last_verified = CURRENT_TIMESTAMP
    `, [category, bodyType, animation, style, filePath, isValid]);
  } catch (error) {
    console.error('Error caching sprite path:', error);
  }
}

async function getValidSpritePaths(category, bodyType, animation) {
  try {
    const result = await pgClient.query(`
      SELECT file_path, style, last_verified 
      FROM sprite_paths 
      WHERE category = $1 AND body_type = $2 AND animation = $3 AND is_valid = true
      ORDER BY last_verified DESC
    `, [category, bodyType, animation]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting sprite paths:', error);
    return [];
  }
}

async function getAllValidSpritePaths() {
  try {
    const result = await pgClient.query(`
      SELECT category, body_type, animation, style, file_path 
      FROM sprite_paths 
      WHERE is_valid = true
      ORDER BY category, body_type, animation
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all sprite paths:', error);
    return [];
  }
}

async function markSpritePathInvalid(filePath) {
  try {
    await pgClient.query(`
      UPDATE sprite_paths 
      SET is_valid = false, last_verified = CURRENT_TIMESTAMP
      WHERE file_path = $1
    `, [filePath]);
  } catch (error) {
    console.error('Error marking sprite path invalid:', error);
  }
}

// Initialize database with card system
async function initDatabase() {
  try {
    // Initialize PostgreSQL first
    await initPostgreSQL();
    
    // Initialize card system
    const cardsExist = await db.get('cards_initialized');
    if (!cardsExist) {
      await db.set('card_manager_ready', true);
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


  socket.on('card_choice', async (data) => {
    try {
      const { gameId, playerId, cardId, choiceIndex } = data;

      const player = await db.get(`player:${playerId}`);
      if (!player) return;

      // Get the card from deck
      const card = cardManager.decks.get('starter').find(c => c.id === cardId);
      if (!card || !card.choices[choiceIndex]) return;

      const choice = card.choices[choiceIndex];

      // Check if player meets conditions
      if (choice.conditions) {
        if (choice.conditions.requires_money && player.stats.money < choice.conditions.requires_money) {
          socket.emit('error', { message: 'Not enough money for this choice' });
          return;
        }
      }

      // Apply effects
      Object.entries(choice.effects).forEach(([stat, value]) => {
        if (player.stats.hasOwnProperty(stat)) {
          player.stats[stat] += value;
        }
      });

      // Handle triggers
      if (choice.triggers) {
        if (choice.triggers.add_tags) {
          if (!player.tags) player.tags = [];
          player.tags.push(...choice.triggers.add_tags);
        }

        if (choice.triggers.roll_dice) {
          const rollResult = Math.floor(Math.random() * 6) + 1;
          // Handle dice-based effects (implement specific logic per card)
          if (cardId === 'crypto_crash') {
            if (rollResult <= 2) {
              player.stats.money -= 5000; // Lost everything
            } else if (rollResult <= 4) {
              player.stats.money += 1000; // Small gain
            } else {
              player.stats.money += 10000; // Big win
            }
          }
        }
      }

      // Save updated player
      await db.set(`player:${playerId}`, player);

      // Log the choice
      const choiceEvent = {
        id: uuidv4(),
        game_id: gameId,
        player_id: playerId,
        event_type: 'card_choice',
        event_data: { cardId, choiceIndex, choice },
        created_at: new Date().toISOString()
      };
      await db.set(`event:${choiceEvent.id}`, choiceEvent);

      io.to(gameId).emit('card_resolved', {
        playerId,
        cardId,
        choice,
        newStats: player.stats,
        tags: player.tags
      });

    } catch (err) {
      console.error('Card choice error:', err);
      socket.emit('error', { message: 'Failed to process card choice' });
    }
  });


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



// API endpoint to get available cards
app.get('/api/cards/:deckName?', (req, res) => {
  try {
    const deckName = req.params.deckName || 'starter';
    const deck = cardManager.decks.get(deckName);

    if (deck) {
      res.json({
        deck: deckName,
        cards: deck,
        count: deck.length
      });
    } else {
      res.status(404).json({ error: 'Deck not found' });
    }
  } catch (err) {
    console.error('Card fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// API endpoint to add new deck
app.post('/api/cards/deck', express.json(), (req, res) => {
  try {
    const { name, cards } = req.body;

    if (!name || !cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Invalid deck format' });
    }

    cardManager.addDeck(name, cards);
    res.json({ message: `Deck '${name}' added successfully`, cardCount: cards.length });
  } catch (err) {
    console.error('Add deck error:', err);
    res.status(500).json({ error: 'Failed to add deck' });
  }
});

// Sprite path management endpoints
app.get('/api/sprites/paths/:category/:bodyType/:animation', async (req, res) => {
  try {
    const { category, bodyType, animation } = req.params;
    const paths = await getValidSpritePaths(category, bodyType, animation);
    res.json({ paths, count: paths.length });
  } catch (error) {
    console.error('Get sprite paths error:', error);
    res.status(500).json({ error: 'Failed to get sprite paths' });
  }
});

app.get('/api/sprites/paths/all', async (req, res) => {
  try {
    const paths = await getAllValidSpritePaths();
    const pathsByCategory = {};
    
    paths.forEach(path => {
      if (!pathsByCategory[path.category]) {
        pathsByCategory[path.category] = {};
      }
      if (!pathsByCategory[path.category][path.body_type]) {
        pathsByCategory[path.category][path.body_type] = {};
      }
      if (!pathsByCategory[path.category][path.body_type][path.animation]) {
        pathsByCategory[path.category][path.body_type][path.animation] = [];
      }
      pathsByCategory[path.category][path.body_type][path.animation].push({
        path: path.file_path,
        style: path.style
      });
    });
    
    res.json({ 
      pathsByCategory, 
      totalPaths: paths.length,
      categories: Object.keys(pathsByCategory).length
    });
  } catch (error) {
    console.error('Get all sprite paths error:', error);
    res.status(500).json({ error: 'Failed to get all sprite paths' });
  }
});

app.post('/api/sprites/paths/cache', express.json(), async (req, res) => {
  try {
    const { category, bodyType, animation, style, filePath, isValid } = req.body;
    
    if (!category || !bodyType || !animation || !filePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await cacheSpritePath(category, bodyType, animation, style || null, filePath, isValid !== false);
    res.json({ message: 'Sprite path cached successfully' });
  } catch (error) {
    console.error('Cache sprite path error:', error);
    res.status(500).json({ error: 'Failed to cache sprite path' });
  }
});

app.post('/api/sprites/paths/bulk-cache', express.json(), async (req, res) => {
  try {
    const { paths } = req.body;
    
    if (!Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths must be an array' });
    }
    
    let cached = 0;
    for (const pathData of paths) {
      const { category, bodyType, animation, style, filePath, isValid } = pathData;
      if (category && bodyType && animation && filePath) {
        await cacheSpritePath(category, bodyType, animation, style || null, filePath, isValid !== false);
        cached++;
      }
    }
    
    res.json({ message: `${cached} sprite paths cached successfully` });
  } catch (error) {
    console.error('Bulk cache sprite paths error:', error);
    res.status(500).json({ error: 'Failed to bulk cache sprite paths' });
  }
});

app.delete('/api/sprites/paths/invalid/:path', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.path);
    await markSpritePathInvalid(filePath);
    res.json({ message: 'Sprite path marked as invalid' });
  } catch (error) {
    console.error('Mark sprite path invalid error:', error);
    res.status(500).json({ error: 'Failed to mark sprite path invalid' });
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
  const cards = [];
  const player = await db.get(`player:${playerId}`);

  // Generate cards based on triggered rings
  for (const ring of triggeredRings) {
    const card = cardManager.getRandomCard('starter', { category: ring });
    if (card) {
      cards.push(card);
    }
  }

  // Always include at least one random card if no rings triggered
  if (cards.length === 0) {
    const randomCard = cardManager.getRandomCard('starter');
    if (randomCard) {
      cards.push(randomCard);
    }
  }

  // Limit to 3 cards max to prevent choice paralysis
  return cards.slice(0, 3);
}

// API Routes
app.get('/api/games', async (req, res) => {
  try {
    // Get all keys from the database
    const allKeys = await db.list();
    const games = [];

    // Filter for game keys and get game data
    for (const key of allKeys) {
      if (key.startsWith('game:')) {
        const game = await db.get(key);
        if (game && game.status === 'waiting') {
          games.push(game);
        }
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