// Final, corrected server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;

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

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use('/lpc-generator', express.static(path.join(__dirname, 'lpc-generator')));

const games = {}; // In-memory store for game states

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function applyTriggers(game, player, triggers) {
    if (!triggers) return;

    if (triggers.add_ongoing_effect) {
        player.ongoing_effects.push(triggers.add_ongoing_effect);
        game.game_log.push(`${player.name} gained an ongoing effect: ${triggers.add_ongoing_effect.id}`);
    }

    if (triggers.group_effect) {
        let targetPlayers = [];
        if (triggers.group_effect.target === 'all') {
            targetPlayers = Object.values(game.players);
        } else if (triggers.group_effect.target === 'all_if_clout_gt_10') {
            targetPlayers = Object.values(game.players).filter(p => p.clout > 10);
        }

        for (const targetPlayer of targetPlayers) {
            for (const [stat, value] of Object.entries(triggers.group_effect.effects)) {
                if (targetPlayer[stat] !== undefined) {
                    targetPlayer[stat] += value;
                }
            }
        }
        game.game_log.push(`A group effect was triggered.`);
    }

    if (triggers.roll_dice) {
        const roll = Math.floor(Math.random() * 6) + 1;
        let outcome;
        if (roll <= 2) outcome = triggers.roll_dice['1-2'];
        else if (roll <= 4) outcome = triggers.roll_dice['3-4'];
        else outcome = triggers.roll_dice['5-6'];

        applyTriggers(game, player, outcome); // Recursively apply outcome triggers
        game.game_log.push(`${player.name} rolled a ${roll}.`);
    }

    if (triggers.self_effect) {
        // This can be expanded for more complex self-effects
        if (triggers.self_effect.lose_turn) {
            player.turns_to_skip = (player.turns_to_skip || 0) + triggers.self_effect.lose_turn;
            game.game_log.push(`${player.name} will lose ${triggers.self_effect.lose_turn} turn(s).`);
        }
    }
}

function processOngoingEffects(game, playerId) {
    const player = game.players[playerId];
    if (!player.ongoing_effects || player.ongoing_effects.length === 0) return;

    player.ongoing_effects = player.ongoing_effects.filter(effect => {
        for (const [stat, value] of Object.entries(effect.effects)) {
            if (player[stat] !== undefined) {
                player[stat] += value;
            }
        }
        effect.turns_remaining -= 1;
        game.game_log.push(`${player.name} is affected by ${effect.id}. Turns remaining: ${effect.turns_remaining}`);
        return effect.turns_remaining > 0;
    });
}

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('create_game', (playerName) => {
    const gameId = uuidv4().slice(0, 5);
    games[gameId] = {
      id: gameId,
      players: {
        [socket.id]: { id: socket.id, name: playerName, money: 1000, mental_health: 50, clout: 10, sin: 0, virtue: 0, hand: [], ongoing_effects: [] }
      },
      deck: [],
      discard: [],
      current_turn_index: 0,
      player_order: [socket.id],
      game_log: [`Game created by ${playerName}`]
    };
    socket.join(gameId);
    socket.emit('game_created', { gameId, gameState: games[gameId] });
    console.log(`Game ${gameId} created by ${playerName}`);
  });

  socket.on('join_game', ({ gameId, playerName }) => {
    if (games[gameId]) {
      const game = games[gameId];
      game.players[socket.id] = { id: socket.id, name: playerName, money: 1000, mental_health: 50, clout: 10, sin: 0, virtue: 0, hand: [], ongoing_effects: [] };
      game.player_order.push(socket.id);
      socket.join(gameId);
      io.to(gameId).emit('player_joined', { playerName, gameState: game });
      socket.emit('game_joined', game);
      game.game_log.push(`${playerName} joined the game.`);
      console.log(`${playerName} joined game ${gameId}`);
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('start_game', async (gameId) => {
    const game = games[gameId];
    if (game && game.player_order[0] === socket.id) {
      try {
        const cardData = await fs.readFile(path.join(__dirname, 'cards', 'new_card_deck.json'));
        const fullDeck = JSON.parse(cardData).starter_deck;
        game.deck = shuffleDeck([...fullDeck]);

        for (const playerId of game.player_order) {
          const player = game.players[playerId];
          player.hand.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
        }

        game.game_log.push('Game started!');
        io.to(gameId).emit('game_started', game);
        const firstPlayerId = game.player_order[game.current_turn_index];
        io.to(firstPlayerId).emit('turn_started', game);
        console.log(`Game ${gameId} started. It is ${game.players[firstPlayerId].name}'s turn.`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', 'Failed to start game.');
      }
    }
  });

  socket.on('draw_card', (gameId) => {
    const game = games[gameId];
    if (!game) {
        socket.emit('error', 'Game not found.');
        return;
    }
    const player = game.players[socket.id];
    if (!player) {
        socket.emit('error', 'Player not found in this game.');
        return;
    }

    if (game.deck.length === 0) {
        if (game.discard.length > 0) {
            game.deck = shuffleDeck([...game.discard]);
            game.discard = [];
            game.game_log.push('Discard pile reshuffled into deck.');
        } else {
            game.game_log.push(`${player.name} tried to draw, but no cards are left.`);
            io.to(gameId).emit('update_game_state', game);
            socket.emit('error', 'No cards left in the deck or discard pile.');
            return;
        }
    }

    const card = game.deck.pop();
    if (card) {
        player.hand.push(card);
        game.game_log.push(`${player.name} drew a card: ${card.name}`);
        socket.emit('card_drawn', card);
        io.to(gameId).emit('update_game_state', game);
    } else {
        game.game_log.push(`${player.name} tried to draw, but the deck was empty.`);
        io.to(gameId).emit('update_game_state', game);
        socket.emit('error', 'No cards left in the deck.');
    }
  });

  socket.on('play_card', ({ gameId, cardId, choiceIndex }) => {
    const game = games[gameId];
    const player = game.players[socket.id];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);

    if (game && player && cardIndex !== -1 && game.player_order[game.current_turn_index] === socket.id) {
      const card = player.hand.splice(cardIndex, 1)[0];
      const choice = card.choices[choiceIndex || 0];

      if (choice.effects) {
        for (const [stat, value] of Object.entries(choice.effects)) {
          if (player[stat] !== undefined) {
            player[stat] += value;
          }
        }
      }

      applyTriggers(game, player, choice.triggers);

      game.discard.push(card);
      game.game_log.push(`${player.name} played "${card.name}".`);

      io.to(gameId).emit('card_played', { player, card, gameState: game });
      io.to(gameId).emit('update_game_state', game);
    } else {
        socket.emit('error', 'Invalid move');
    }
  });

  socket.on('end_turn', (gameId) => {
      const game = games[gameId];
      if (game && game.player_order[game.current_turn_index] === socket.id) {
          game.current_turn_index = (game.current_turn_index + 1) % game.player_order.length;
          const nextPlayerId = game.player_order[game.current_turn_index];
          const nextPlayer = game.players[nextPlayerId];

          processOngoingEffects(game, nextPlayerId);

          if (nextPlayer.turns_to_skip > 0) {
              nextPlayer.turns_to_skip -= 1;
              game.game_log.push(`${nextPlayer.name}'s turn was skipped.`);
              // Immediately end this turn and start the next one
              io.to(gameId).emit('update_game_state', game);
              // Use a timeout to avoid deep recursion on multiple skipped turns
              setTimeout(() => io.to(socket.id).emit('end_turn', gameId), 100);
          } else {
              io.to(gameId).emit('update_game_state', game);
              io.to(nextPlayerId).emit('turn_started', game);
              game.game_log.push(`It is now ${nextPlayer.name}'s turn.`);
          }
      }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    for (const gameId in games) {
      const game = games[gameId];
      if (game.players[socket.id]) {
        const playerName = game.players[socket.id].name;
        delete game.players[socket.id];
        game.player_order = game.player_order.filter(id => id !== socket.id);
        io.to(gameId).emit('player_left', { playerName, gameState: game });
        game.game_log.push(`${playerName} left the game.`);
        console.log(`${playerName} left game ${gameId}`);
        if (Object.keys(game.players).length === 0) {
          delete games[gameId];
          console.log(`Game ${gameId} has been deleted.`);
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});