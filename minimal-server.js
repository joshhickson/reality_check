const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 5000;

io.on('connection', (socket) => {
  console.log('Minimal Server: A client connected.');

  socket.on('test-event', (data) => {
    console.log('Minimal Server: Received test-event with data:', data);
    socket.emit('test-response', { message: 'Hello from server!' });
  });

  socket.on('disconnect', () => {
    console.log('Minimal Server: A client disconnected.');
  });
});

server.listen(PORT, () => {
  console.log(`Minimal server listening on port ${PORT}`);
});