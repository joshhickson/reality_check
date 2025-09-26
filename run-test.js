const { spawn } = require('child_process');

const NUM_BOTS = 4; // Run with 4 bots as requested

console.log('--- Starting Test Runner ---');

// 1. Start the game server
const server = spawn('node', ['game-server.js']);
console.log('Starting game server...');

server.stdout.on('data', (data) => {
    console.log(`[Server]: ${data}`);
    // Check for the server ready message
    if (data.toString().includes('Server listening on port')) {
        console.log('Server is running. Starting bots...');
        startBots();
    }
});

server.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
});

let botsProcess;

function startBots() {
    // 2. Start the bot client simulation
    botsProcess = spawn('node', ['bot-client.js', 'puppeteer_test']);

    botsProcess.stdout.on('data', (data) => {
        console.log(`[Bots]: ${data}`);
        if (data.toString().includes('GAME OVER')) {
            console.log('Game finished. Shutting down in 3 seconds...');
            setTimeout(shutdown, 3000);
        }
        if (data.toString().includes('--- [')) {
            // Request full game state every time a turn starts
            botsProcess.stdin.write('get_game_state\n');
        }
    });

    botsProcess.stderr.on('data', (data) => {
        console.error(`[Bots Error]: ${data}`);
    });
}

function shutdown() {
    console.log('Shutting down all processes.');
    if (server) server.kill();
    if (botsProcess) botsProcess.kill();
    process.exit(0);
}

process.on('SIGINT', shutdown); // Handle Ctrl+C
