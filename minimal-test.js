const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
    reconnection: false,
    transports: ["websocket"],
});

socket.on('connect', () => {
    console.log(`Connected with id ${socket.id}`);
    
    // Test if roll_dice event handler exists at all
    console.log('Testing roll_dice event...');
    socket.emit('roll_dice', {
        gameId: 'test-game-id',
        playerId: 'test-player-id'
    });
    
    // Also test a different event to compare
    console.log('Testing a non-existent event...');
    socket.emit('test_event', { data: 'test' });
    
    setTimeout(() => {
        console.log('Disconnecting...');
        socket.disconnect();
    }, 3000);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
});

socket.onAny((eventName, ...args) => {
    console.log(`Received event: ${eventName}`, args);
});