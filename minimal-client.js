const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('Minimal Client: Connected to server.');

  console.log('Minimal Client: Sending test-event.');
  socket.emit('test-event', { message: 'Hello from client!' });
});

socket.on('test-response', (data) => {
  console.log('Minimal Client: Received test-response:', data);
  socket.disconnect();
});

socket.on('disconnect', () => {
  console.log('Minimal Client: Disconnected from server.');
});

socket.on('connect_error', (err) => {
  console.error('Minimal Client: Connection Error:', err);
});