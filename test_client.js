const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const TIMEOUT = 10000; // 10 seconds

console.log("--- Starting Reality Check Integration Test ---");

const client1 = io(SERVER_URL);
const client2 = io(SERVER_URL);

let gameId = null;
let player1 = { id: null, username: "Player1" };
let player2 = { id: null, username: "Player2" };

let testState = {
    p1_connected: false,
    p2_connected: false,
    game_created: false,
    p1_joined: false,
    p2_joined: false,
    game_started: false,
    p1_turn_taken: false,
    p1_clout_posted: false,
    test_finished: false
};

const checkCompletion = () => {
    const allPassed = Object.entries(testState)
        .filter(([key]) => key !== 'test_finished')
        .every(([, value]) => value === true);

    if (allPassed) {
        console.log("\n✅ --- All Tests Passed --- ✅");
        endTest();
    }
};

const endTest = () => {
    if (testState.test_finished) return;
    testState.test_finished = true;
    console.log("\nFinal Test State:", testState);
    client1.disconnect();
    client2.disconnect();
    console.log("--- Test Finished ---");
};

// Failsafe timeout
const timeoutId = setTimeout(() => {
    if (!testState.test_finished) {
        console.error("\n❌ --- Test Timed Out --- ❌");
        endTest();
    }
}, TIMEOUT);

// --- Client 1 Logic ---
client1.on('connect', () => {
    console.log("P1: Connected", client1.id);
    testState.p1_connected = true;
    if (testState.p2_connected) {
        console.log("P1: Creating game...");
        client1.emit('create_game', { gameName: "Test Game", maxPlayers: 2 });
    }
});

client1.on('game_created', (data) => {
    console.log("P1: Game created", data);
    console.assert(data.gameId, "FAIL: P1: No gameId received.");
    gameId = data.gameId;
    testState.game_created = true;

    console.log("P1: Joining game...");
    client1.emit('join_game', { gameId, username: player1.username });
});

client1.on('player_joined', (data) => {
    console.log(`P1: Player joined event for ${data.player.username}`);
    if (data.player.username === player1.username) {
        player1.id = data.player.id;
        testState.p1_joined = true;
        console.log("P1: I have joined the game.");
        // Now that P1 has joined, P2 can join.
        console.log("P2: Joining game...");
        client2.emit('join_game', { gameId, username: player2.username });
    }
    if (data.player.username === player2.username) {
        console.log("P1: Saw Player 2 join. Starting game...");
        client1.emit('start_game', { gameId });
    }
});

client1.on('game_started', (data) => {
    console.log("P1: Game started.");
    console.assert(data.gameState.status === 'in_progress', "FAIL: P1: Game status not 'in_progress'.");
    testState.game_started = true;

    console.log("P1: Taking my turn...");
    client1.emit('player_turn', { gameId, playerId: player1.id, rollResult: 3, action: 'move' });
});

client1.on('turn_result', (data) => {
    console.log("P1: Received turn result.");
    console.assert(data.playerId === player1.id, "FAIL: P1: Wrong player took turn.");
    console.assert(data.newPosition === 3, "FAIL: P1: Position incorrect.");
    testState.p1_turn_taken = true;

    console.log("P1: Posting on MetaNet...");
    client1.emit('post_on_metanet', { gameId, playerId: player1.id });
});

client1.on('stats_updated', (data) => {
    console.log("P1: Received stats update.", data.newStats);
    console.assert(data.playerId === player1.id, "FAIL: P1: Wrong player stats updated.");
    console.assert(data.newStats.clout === 1, "FAIL: P1: Clout not updated.");
    console.assert(data.newStats.money === 19900, "FAIL: P1: Money not deducted.");
    testState.p1_clout_posted = true;
    checkCompletion();
});


// --- Client 2 Logic ---
client2.on('connect', () => {
    console.log("P2: Connected", client2.id);
    testState.p2_connected = true;
    if (testState.p1_connected) {
        console.log("P1: Creating game...");
        client1.emit('create_game', { gameName: "Test Game", maxPlayers: 2 });
    }
});

client2.on('player_joined', (data) => {
    console.log(`P2: Player joined event for ${data.player.username}`);
    if (data.player.username === player2.username) {
        player2.id = data.player.id;
        testState.p2_joined = true;
        console.log("P2: I have joined the game.");
    }
});


// --- Generic Error Handling ---
const handleError = (clientName) => (data) => {
    console.error(`❌ ${clientName} Error:`, data.message);
    endTest();
};
client1.on('error', handleError('P1'));
client2.on('error', handleError('P2'));
