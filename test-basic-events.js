const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
    reconnection: false,
    transports: ["websocket"],
});

socket.on('connect', () => {
    console.log(`Connected with id ${socket.id}`);
    
    // Test create_game (known to work)
    console.log('Testing create_game event...');
    socket.emit('create_game', { gameName: 'Test Game' });
    
    setTimeout(() => {
        // Test roll_dice after 2 seconds
        console.log('Testing roll_dice event...');
        socket.emit('roll_dice', {
            gameId: 'test-game-id',
            playerId: 'test-player-id'
        });
        
        setTimeout(() => {
            console.log('Disconnecting...');
            socket.disconnect();
        }, 2000);
    }, 2000);
});

socket.onAny((eventName, ...args) => {
    console.log(`Received event: ${eventName}`, args);
});