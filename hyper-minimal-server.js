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

console.log('[Hyper-Minimal] Setting up listeners...');

// Low-level listener on the HTTP server
server.on('upgrade', (req, socket, head) => {
    console.log('[Hyper-Minimal] ✅ HTTP server received an UPGRADE request.');
});

// Low-level listener on the Socket.IO engine
io.engine.on('initial_headers', (headers, req) => {
    console.log('[Hyper-Minimal] ✅ Socket.IO engine received INITIAL_HEADERS.');
});

// Standard connection handler
io.on('connection', (socket) => {
  console.log(`[Hyper-Minimal] ✅✅✅ SUCCESS! New connection: ${socket.id}`);
});

server.listen(PORT, () => {
  console.log(`[Hyper-Minimal] 🚀 Server listening on port ${PORT}`);
});