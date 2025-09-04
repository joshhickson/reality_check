const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const TIMEOUT = 15000; // Increased timeout for bot turns

console.log("--- Starting Bot Integration Test ---");

const client1 = io(SERVER_URL);

let gameId = null;
let player1 = { id: null, username: "Player1" };
let botId = null;

let testState = {
    p1_connected: false,
    game_created: false,
    bot_joined: false,
    p1_joined: false,
    game_started: false,
    bot_took_turn: false,
    test_finished: false
};

const checkCompletion = () => {
    const allPassed = Object.entries(testState)
        .filter(([key]) => key !== 'test_finished')
        .every(([, value]) => value === true);

    if (allPassed) {
        console.log("\n✅ --- All Bot Tests Passed --- ✅");
        endTest();
    }
};

const endTest = () => {
    if (testState.test_finished) return;
    testState.test_finished = true;
    console.log("\nFinal Test State:", testState);
    client1.disconnect();
    console.log("--- Test Finished ---");
};

const timeoutId = setTimeout(() => {
    if (!testState.test_finished) {
        console.error("\n❌ --- Test Timed Out --- ❌");
        endTest();
    }
}, TIMEOUT);

// --- Test Flow ---

client1.on('connect', () => {
    console.log("P1: Connected", client1.id);
    testState.p1_connected = true;
    console.log("P1: Creating game...");
    client1.emit('create_game', { gameName: "Bot Test Game", maxPlayers: 2 });
});

client1.on('game_created', (data) => {
    console.log("P1: Game created", data);
    gameId = data.gameId;
    testState.game_created = true;

    console.log("P1: Adding a bot...");
    client1.emit('add_bot', { gameId });
});

client1.on('player_joined', (data) => {
    console.log(`P1: Player joined event for ${data.player.username}`);
    if (data.player.isBot) {
        botId = data.player.id;
        testState.bot_joined = true;
        console.log("P1: Bot has joined. Now I will join.");
        client1.emit('join_game', { gameId, username: player1.username });
    } else if (data.player.username === player1.username) {
        player1.id = data.player.id;
        testState.p1_joined = true;
        console.log("P1: I have joined. Starting game...");
        client1.emit('start_game', { gameId });
    }
});

client1.on('game_started', (data) => {
    console.log("P1: Game started.");
    console.assert(data.gameState.status === 'in_progress', "FAIL: Game status not 'in_progress'.");
    testState.game_started = true;
    // The server should now automatically handle the bot's turn if it's first
});

client1.on('game_state_updated', (data) => {
    console.log(`P1: Received game state update: ${data.message}`);
    const botPlayer = data.gameState.players.find(p => p.isBot);
    // Check if the bot has taken its turn (its stats will have changed)
    if (botPlayer && (botPlayer.stats.money !== 20000 || botPlayer.stats.clout !== 0)) {
        console.log("P1: Bot has taken its turn. Test successful.");
        testState.bot_took_turn = true;
        checkCompletion();
    }
});

client1.on('error', (data) => {
    console.error(`❌ P1 Error:`, data.message);
    endTest();
});
