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
app.use(express.static(publicPath));

const games = {};

function checkTurnEnd(game, player) {
  if (player.stats.actionPoints <= 0 && !game.stateMachine.getContext().pendingDecision) {
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

    let actionSucceeded = false;
    let cost = 0;

    switch(action.type) {
        case 'WORK_OVERTIME':
            cost = 2;
            if (player.stats.actionPoints >= cost) {
                player.stats.actionPoints -= cost;
                player.applyEffects({ money: 500, mentalHealth: -1, sin: 1, narrativeMomentum: 1 });
                actionSucceeded = true;
            }
            break;

        case 'DRAW_CARD':
            if (player.isBurnedOut) {
                return socket.emit('error', { message: "You cannot draw cards while suffering from Burnout." });
            }
            if (player.hand.length >= game.maxHandSize) {
                return socket.emit('error', { message: "Your hand is full." });
            }
            cost = 1;
            if (player.stats.actionPoints >= cost) {
                player.stats.actionPoints -= cost;
                let card;
                if (action.payload.deck === 'SIN') {
                    card = game.sinDeck.draw();
                } else if (action.payload.deck === 'VIRTUE') {
                    card = game.virtueDeck.draw();
                }
                if (card) {
                    player.hand.push(card);
                }
                player.applyEffects({ narrativeMomentum: 1 });
                actionSucceeded = true;
            }
            break;

        case 'PLAY_CARD':
            cost = 1;
            if (player.stats.actionPoints >= cost) {
                const cardIndex = player.hand.findIndex(c => c.id === action.payload.cardId);
                if (cardIndex > -1) {
                    player.stats.actionPoints -= cost;
                    const cardToPlay = player.hand.splice(cardIndex, 1)[0];
                    const effects = {
                        money: parseInt(cardToPlay.money) || 0,
                        mentalHealth: parseInt(cardToPlay.mental) || 0,
                        sin: parseInt(cardToPlay.sin) || 0,
                        virtue: parseInt(cardToPlay.virtue) || 0,
                        socialCapital: parseInt(cardToPlay.socialCapital) || 0
                    };
                    player.applyEffects(effects);
                    actionSucceeded = true;
                }
            }
            break;

        case 'SPEND_MOMENTUM':
            cost = 5;
            if (player.stats.narrativeMomentum >= cost) {
                player.stats.narrativeMomentum -= cost;
                const card = game.lifeHappensDeck.draw();
                if (card) {
                    game.stateMachine.updateContext({
                      pendingDecision: {
                        type: 'LIFE_HAPPENS',
                        playerId: player.id,
                        cardId: card.id,
                        text: card.text,
                        options: card.choices
                      }
                    });
                    game.stateMachine.transition('Decision');
                }
                actionSucceeded = true;
            }
            break;
    }

    if (!actionSucceeded) {
      return socket.emit('error', { message: "Not enough resources." });
    }

    const turnEnded = checkTurnEnd(game, player);
    io.to(game.id).emit('game_state_update', game.getGameState());
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

      player.applyEffects(chosenOption.effects);
      game.stateMachine.updateContext({ pendingDecision: null });
      game.stateMachine.transition('EndTurn');

      io.to(game.id).emit('card_resolved', {
          playerId: player.id,
          newStats: player.stats,
          choiceText: chosenOption.text
      });

      const turnEnded = checkTurnEnd(game, player);
      io.to(game.id).emit('game_state_update', game.getGameState());
  });

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
