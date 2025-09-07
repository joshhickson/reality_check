// DEPRECATED: This server.js file is redundant and conflicts with game-server.js
// The game-server.js file already includes all this functionality plus Socket.IO
// Keeping this file for reference but commented out to prevent port conflicts

/*
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Use absolute paths to prevent any ambiguity about the working directory
const publicPath = path.join(__dirname, 'public');
const lpcGeneratorPath = path.join(__dirname, 'lpc-generator');

console.log(`Serving static files from: ${publicPath}`);
console.log(`Serving LPC generator from: ${lpcGeneratorPath}`);

app.use(express.static(publicPath));
app.use('/lpc-generator', express.static(lpcGeneratorPath));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
*/