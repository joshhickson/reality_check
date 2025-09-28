const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

console.log('[Minimal Server] Setting up connection listener...');
io.on('connection', (socket) => {
  console.log(`[Minimal Server] ✅ SUCCESS! New connection: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Minimal Server] 👋 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[Minimal Server] 🚀 Server listening on port ${PORT}`);
});