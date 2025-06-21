
// Reality Check Game Client
const socket = io();

let gameId = null;
let playerId = null;
let gameState = null;
let currentPlayer = null;

// Game setup functions
function createGame() {
  const gameName = document.getElementById('gameNameInput').value;
  const username = document.getElementById('usernameInput').value;
  
  if (!gameName || !username) {
    alert('Please enter both game name and username');
    return;
  }
  
  socket.emit('create_game', { gameName, maxPlayers: 5 });
  
  // Auto-join the created game
  setTimeout(() => {
    socket.emit('join_game', { gameId: gameId, username });
  }, 100);
}

function joinGame() {
  const username = document.getElementById('usernameInput').value;
  
  if (!username) {
    alert('Please enter a username');
    return;
  }
  
  // For now, we'll need a game ID input or list
  const gameIdInput = prompt('Enter Game ID:');
  if (gameIdInput) {
    socket.emit('join_game', { gameId: gameIdInput, username });
  }
}

function startGame() {
  if (gameId) {
    socket.emit('start_game', { gameId });
  }
}

function rollDice() {
  const rollResult = Math.floor(Math.random() * 6) + 1;
  document.getElementById('rollResult').innerHTML = `Rolled: ${rollResult}`;
  
  socket.emit('player_turn', {
    gameId,
    playerId,
    rollResult,
    action: 'move'
  });
  
  document.getElementById('rollButton').disabled = true;
}

function acceptCard(cardIndex) {
  socket.emit('card_action', {
    gameId,
    playerId,
    cardIndex,
    action: 'accept'
  });
}

function rejectCard(cardIndex) {
  socket.emit('card_action', {
    gameId,
    playerId,
    cardIndex,
    action: 'reject'
  });
}

function delayCard(cardIndex) {
  socket.emit('card_action', {
    gameId,
    playerId,
    cardIndex,
    action: 'delay'
  });
}

// Socket event handlers
socket.on('game_created', (data) => {
  gameId = data.gameId;
  console.log('Game created:', data);
  
  document.getElementById('gameSetup').style.display = 'none';
  document.getElementById('gameArea').style.display = 'block';
  
  updateGameStatus('Game created! Waiting for players...');
});

socket.on('player_joined', (data) => {
  console.log('Player joined:', data);
  updatePlayersList(data);
  
  if (data.player.socket_id === socket.id) {
    playerId = data.player.id;
    currentPlayer = data.player;
    showPlayerInfo(data.player);
  }
});

socket.on('character_assigned', (data) => {
  console.log('Character assigned:', data);
  displayCharacterInfo(data.character);
});

socket.on('game_started', (data) => {
  console.log('Game started:', data);
  gameState = data.gameState;
  updateGameStatus('Game started! Round 1');
  
  // Show turn controls for first player
  if (gameState.currentPlayer === 0 && currentPlayer) {
    enableTurnControls();
  }
});

socket.on('turn_result', (data) => {
  console.log('Turn result:', data);
  
  // Update board position
  if (data.playerId === playerId) {
    // Update your own position and stats here
    movePlayerToPosition(playerId, data.newPosition);
  }
  
  // Highlight triggered rings
  if (data.triggeredRings.length > 0) {
    highlightRingEvents(data.triggeredRings);
  }
  
  // Display cards
  if (data.cards) {
    displayCards(data.cards);
  }
  
  // Update turn controls
  updateTurnControls(data.nextPlayer);
});

socket.on('error', (data) => {
  alert('Error: ' + data.message);
});

// UI update functions
function updateGameStatus(status) {
  document.getElementById('gameStatus').textContent = status;
}

function showPlayerInfo(player) {
  document.getElementById('playerInfo').style.display = 'block';
  updatePlayerStats(player.stats);
}

function updatePlayerStats(stats) {
  if (stats) {
    document.getElementById('money').textContent = stats.money || 5000;
    document.getElementById('mental').textContent = stats.mental_health || 5;
    document.getElementById('sin').textContent = stats.sin || 0;
    document.getElementById('virtue').textContent = stats.virtue || 0;
  }
}

function displayCharacterInfo(character) {
  const characterDiv = document.getElementById('characterInfo');
  characterDiv.innerHTML = `
    <div><strong>Background:</strong> ${character.background.description}</div>
    <div><strong>Traits:</strong> ${character.traits.join(', ')}</div>
    <div><strong>Drawback:</strong> ${character.drawback}</div>
    <div><strong>Starting Money:</strong> $${character.background.money}</div>
  `;
}

function displayCards(cards) {
  const cardsArea = document.getElementById('cardsArea');
  cardsArea.innerHTML = '<h4>Your Cards</h4>';
  
  cards.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${card.type}-card`;
    cardDiv.innerHTML = `
      <h5>${card.title}</h5>
      <p>${card.description}</p>
      <div>
        <button onclick="acceptCard(${index})">Accept</button>
        <button onclick="rejectCard(${index})">Reject</button>
        <button onclick="delayCard(${index})">Delay</button>
      </div>
    `;
    cardsArea.appendChild(cardDiv);
  });
}

function enableTurnControls() {
  document.getElementById('turnControls').style.display = 'block';
  document.getElementById('rollButton').disabled = false;
}

function updateTurnControls(nextPlayerIndex) {
  // Enable/disable controls based on whose turn it is
  const isMyTurn = gameState && gameState.players[nextPlayerIndex] && 
                   gameState.players[nextPlayerIndex].id === playerId;
  
  document.getElementById('rollButton').disabled = !isMyTurn;
  
  if (isMyTurn) {
    updateGameStatus("It's your turn!");
  } else {
    updateGameStatus(`Waiting for other players...`);
  }
}

function updatePlayersList(data) {
  // This would update the players list UI
  console.log('Players updated:', data);
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  // Load available games
  fetch('/api/games')
    .then(response => response.json())
    .then(games => {
      const gamesList = document.getElementById('gamesList');
      if (games.length > 0) {
        gamesList.innerHTML = '<h4>Available Games:</h4>';
        games.forEach(game => {
          const gameDiv = document.createElement('div');
          gameDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 10px; margin: 5px; border-radius: 5px;">
              <strong>${game.name}</strong> - ${game.status}
              <button onclick="socket.emit('join_game', {gameId: '${game.id}', username: document.getElementById('usernameInput').value})">Join</button>
            </div>
          `;
          gamesList.appendChild(gameDiv);
        });
      }
    });
});
