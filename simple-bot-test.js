const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";

async function testGameCreation() {
    const socket = io(SERVER_URL, {
        reconnection: false,
        transports: ["websocket"],
    });

    socket.on('connect', () => {
        console.log(`Connected with id ${socket.id}`);
        
        // Create game
        console.log('Creating game...');
        socket.emit('create_game', { gameName: 'Test Game' });
    });

    socket.on('game_created', (data) => {
        console.log('Game created:', data);
        
        // Join game
        console.log('Joining game as TestBot...');
        socket.emit('join_game', { gameId: data.gameId, username: 'TestBot' });
        
        // Start the game after a delay
        setTimeout(() => {
            console.log('Starting game...');
            socket.emit('start_game', { gameId: data.gameId });
        }, 2000);
    });

    let creatorPlayerId;
    let testBotPlayerId;
    
    socket.on('player_joined', (data) => {
        console.log('Player joined event received:', {
            playerName: data.player.name,
            playerId: data.player.id,
            totalPlayers: data.allPlayers.length,
            allPlayerNames: data.allPlayers.map(p => p.name)
        });
        
        // Store player IDs
        if (data.player.name === 'Creator') {
            creatorPlayerId = data.player.id;
        } else if (data.player.name === 'TestBot') {
            testBotPlayerId = data.player.id;
        }
    });

    socket.on('game_started', (data) => {
        console.log('Game started! Current state:', data.gameState.currentState);
        
        // First try Creator, then TestBot
        setTimeout(() => {
            console.log('Emitting roll_dice for Creator...');
            console.log('Creator data:', { gameId: data.gameState.id, playerId: creatorPlayerId });
            socket.emit('roll_dice', {
                gameId: data.gameState.id,
                playerId: creatorPlayerId
            });
            
            // Try TestBot after 2 seconds
            setTimeout(() => {
                console.log('Emitting roll_dice for TestBot...');
                console.log('TestBot data:', { gameId: data.gameState.id, playerId: testBotPlayerId });
                socket.emit('roll_dice', {
                    gameId: data.gameState.id,
                    playerId: testBotPlayerId
                });
            }, 2000);
            
        }, 3000);
    });

    // Generic event logger
    socket.onAny((eventName, ...args) => {
        if (eventName !== 'player_joined') {
            console.log(`Event: ${eventName}`, args);
        }
    });

    // Listen for game_state_update to see if roll_dice worked
    socket.on('game_state_update', (data) => {
        console.log('Game state update received after roll_dice:', {
            currentState: data.gameState ? data.gameState.currentState : data.currentState,
            currentTurn: data.gameState ? data.gameState.currentTurn : data.currentTurn
        });
    });

    setTimeout(() => {
        console.log('Disconnecting...');
        socket.disconnect();
    }, 20000);
}

testGameCreation();