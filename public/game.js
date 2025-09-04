// Reality Check Game Client
const socket = io();

let gameId = null;
let playerId = null;
let gameState = null;

// UI Elements
const gameSetupDiv = document.getElementById('gameSetup');
const gameAreaDiv = document.getElementById('gameArea');
const usernameInput = document.getElementById('usernameInput');
const gameIdInput = document.getElementById('gameNameInput'); // Re-using for game ID
const playersListDiv = document.getElementById('playersList');
const gameStatusDiv = document.getElementById('gameStatus');
const playerInfoDiv = document.getElementById('playerInfo');
const moneySpan = document.getElementById('money');
const mentalSpan = document.getElementById('mental');
const sinSpan = document.getElementById('sin');
const virtueSpan = document.getElementById('virtue');
const cardsAreaDiv = document.getElementById('cardsArea');
const turnControlsDiv = document.getElementById('turnControls');

// Game Setup
function createGame() {
    const playerName = usernameInput.value;
    if (!playerName) {
        alert('Please enter your username');
        return;
    }
    socket.emit('create_game', playerName);
}

function joinGame() {
    const playerName = usernameInput.value;
    const gameIdToJoin = gameIdInput.value;
    if (!playerName || !gameIdToJoin) {
        alert('Please enter your username and a game ID');
        return;
    }
    socket.emit('join_game', { gameId: gameIdToJoin, playerName });
}

function startGame() {
    socket.emit('start_game', gameId);
}

function drawCard() {
    socket.emit('draw_card', gameId);
}

function playCard(cardId, choiceIndex) {
    socket.emit('play_card', { gameId, cardId, choiceIndex });
}

function endTurn() {
    socket.emit('end_turn', gameId);
}

// UI Update Functions
function updateUI(state) {
    gameState = state;
    gameId = state.id;

    // Update player list
    playersListDiv.innerHTML = '';
    for (const p of Object.values(state.players)) {
        let playerHtml = `<div>${p.name} (Money: ${p.money}, Mental: ${p.mental_health})`;
        if (state.player_order[state.current_turn_index] === p.id) {
            playerHtml += ' <strong>(Current Turn)</strong>';
        }
        playerHtml += '</div>';
        playersListDiv.innerHTML += playerHtml;
    }

    // Update personal info
    const me = state.players[playerId];
    if (me) {
        playerInfoDiv.style.display = 'block';
        moneySpan.textContent = me.money;
        mentalSpan.textContent = me.mental_health;
        sinSpan.textContent = me.sin;
        virtueSpan.textContent = me.virtue;

        // Update hand
        cardsAreaDiv.innerHTML = '<h4>Your Hand</h4>';
        if (me.hand.length === 0) {
            cardsAreaDiv.innerHTML += '<p>No cards in hand.</p>';
        } else {
            me.hand.forEach(card => {
                let choicesHtml = card.choices.map((choice, index) =>
                    `<button onclick="playCard('${card.id}', ${index})">${choice.text}</button>`
                ).join('');
                cardsAreaDiv.innerHTML += `
                    <div class="card ${card.type}-card">
                        <h5>${card.name}</h5>
                        <p>${card.description}</p>
                        <em>${card.flavor_text}</em>
                        <div>${choicesHtml}</div>
                    </div>
                `;
            });
        }
    }

    // Update turn controls
    if (state.player_order[state.current_turn_index] === playerId) {
        turnControlsDiv.style.display = 'block';
        gameStatusDiv.textContent = "It's your turn!";
    } else {
        turnControlsDiv.style.display = 'none';
        const currentPlayerName = state.players[state.player_order[state.current_turn_index]].name;
        gameStatusDiv.textContent = `Waiting for ${currentPlayerName}...`;
    }
}

// Socket Event Handlers
socket.on('connect', () => {
    playerId = socket.id;
    console.log('Connected to server with ID:', playerId);
});

socket.on('game_created', ({ gameId: newGameId, gameState: initialState }) => {
    console.log('Game Created:', newGameId);
    gameSetupDiv.style.display = 'none';
    gameAreaDiv.style.display = 'block';
    gameIdInput.value = newGameId; // Show the new game ID
    updateUI(initialState);
    // Add a start game button for the creator
    gameStatusDiv.innerHTML = 'Game created! Waiting for players... <button onclick="startGame()">Start Game</button>';
});

socket.on('game_joined', (initialState) => {
    console.log('Joined Game:', initialState.id);
    gameSetupDiv.style.display = 'none';
    gameAreaDiv.style.display = 'block';
    updateUI(initialState);
});

socket.on('update_game_state', (newState) => {
    console.log('Game state updated');
    updateUI(newState);
});

socket.on('turn_started', (newState) => {
    alert("It's your turn!");
    updateUI(newState);
});

socket.on('error', (message) => {
    console.error('Server Error:', message);
    alert('Error: ' + message);
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Re-label the button for clarity
    document.querySelector('button[onclick="joinGame()"]').textContent = 'Join Game by ID';
    // Re-label the input placeholder
    gameIdInput.placeholder = 'Game ID (for joining)';

    // Add new buttons for turn actions to the turnControls div
    turnControlsDiv.innerHTML = `
        <button onclick="drawCard()">Draw Card</button>
        <button onclick="endTurn()">End Turn</button>
    `;
});
