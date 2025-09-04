
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

function makeCardChoice(cardId, choiceIndex) {
  socket.emit('card_choice', {
    gameId,
    playerId,
    cardId,
    choiceIndex
  });
}

function postOnMetaNet() {
    if (gameId && playerId) {
        socket.emit('post_on_metanet', { gameId, playerId });
    }
}

function addBot() {
    if (gameId) {
        socket.emit('add_bot', { gameId });
    }
}

// Socket event handlers
socket.on('game_created', (data) => {
    gameId = data.gameId;
    console.log('Game created:', data);

    // Show lobby controls
    document.getElementById('addBotButton').style.display = 'inline-block';
    document.getElementById('startGameButton').style.display = 'inline-block';

    // Disable initial setup buttons
    document.querySelector('button[onclick="createGame()"]').disabled = true;
    document.querySelector('button[onclick="joinGame()"]').disabled = true;
    document.getElementById('gameNameInput').disabled = true;


    updateGameStatus(`Game "${document.getElementById('gameNameInput').value}" created! Add players or bots.`);
});

socket.on('player_joined', (data) => {
    console.log('Player joined:', data);
    updatePlayersList({ players: data.players }); // Pass the full players list

    // If I am the one who just joined, hide the setup screen
    if (data.player.socketId === socket.id) {
        playerId = data.player.id;
        currentPlayer = data.player;
        document.getElementById('gameSetup').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        showPlayerInfo(data.player);
    }
});

socket.on('character_assigned', (data) => {
  console.log('Character assigned:', data);
  displayCharacterInfo(data.character);
});

socket.on('game_started', (data) => {
    console.log('Game started:', data);
    updateUIFromGameState(data.gameState);
});

socket.on('game_state_updated', (data) => {
    console.log('Game state updated:', data.message);
    updateUIFromGameState(data.gameState);
});

// This event is now only for the current player after they move
socket.on('turn_result', (data) => {
    console.log('Turn result:', data);
    // Display cards for the human player to choose from
    if (data.cards) {
        displayCards(data.cards);
    }
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
    document.getElementById('money').textContent = stats.money || 0;
    document.getElementById('mental').textContent = stats.mental_health || 0;
    document.getElementById('sin').textContent = stats.sin || 0;
    document.getElementById('virtue').textContent = stats.virtue || 0;
    document.getElementById('clout').textContent = stats.clout || 0;
  }
}

function updateUIFromGameState(newState) {
    gameState = newState;
    
    // Update my player object
    currentPlayer = gameState.players.find(p => p.id === playerId);
    if (currentPlayer) {
        showPlayerInfo(currentPlayer);
    }

    // Update player list
    updatePlayersList({ players: gameState.players });

    // Update turn controls
    const myPlayerObject = gameState.players.find(p => p.id === playerId);
    const myTurn = myPlayerObject && gameState.players[gameState.currentPlayerIndex].id === myPlayerObject.id;

    document.getElementById('turnControls').style.display = 'block'; // Always show controls
    document.getElementById('rollButton').disabled = !myTurn;
    document.getElementById('metanetButton').disabled = !myTurn;

    // Update game status
    if (myTurn) {
        updateGameStatus("It's your turn!");
        document.getElementById('cardsArea').innerHTML = ''; // Clear cards at start of my turn
    } else {
        const activePlayer = gameState.players[gameState.currentPlayerIndex];
        updateGameStatus(`Waiting for ${activePlayer.username}...`);
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
  cardsArea.innerHTML = '<h4>Choose Your Path</h4>';
  
  cards.forEach((card, cardIndex) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${card.type}-card`;
    
    let choicesHtml = '';
    if (card.choices && card.choices.length > 0) {
      choicesHtml = card.choices.map((choice, choiceIndex) => `
        <button onclick="makeCardChoice('${card.id}', ${choiceIndex})" class="choice-btn">
          ${choice.text}
        </button>
      `).join('');
    }
    
    cardDiv.innerHTML = `
      <h5>${card.name}</h5>
      <p>${card.description}</p>
      ${card.flavor_text ? `<em class="flavor-text">"${card.flavor_text}"</em>` : ''}
      <div class="card-choices">
        ${choicesHtml}
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
    const playersListDiv = document.getElementById('playersList');
    playersListDiv.innerHTML = ''; // Clear the list
    data.players.forEach(p => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-card'; // Reuse the player-card style
        if (p.id === gameState.players[gameState.currentPlayerIndex].id) {
            playerDiv.style.border = '2px solid #00ff00'; // Highlight current player
        }
        playerDiv.innerHTML = `
            <strong>${p.username} ${p.isBot ? '(Bot)' : ''}</strong>
            <div class="stats-grid">
                <div class="stat">💰 ${p.stats.money}</div>
                <div class="stat">🧠 ${p.stats.mental_health}</div>
                <div class="stat">☠️ ${p.stats.sin}</div>
                <div class="stat">✝️ ${p.stats.virtue}</div>
                <div class="stat">✨ ${p.stats.clout}</div>
            </div>
        `;
        playersListDiv.appendChild(playerDiv);
    });
}

// Placeholder functions to avoid errors
function movePlayerToPosition(playerId, position) {
    console.log(`Player ${playerId} moved to position ${position}. (UI update not implemented)`);
}

function highlightRingEvents(rings) {
    console.log(`Ring events triggered: ${rings.join(', ')}. (UI update not implemented)`);
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
