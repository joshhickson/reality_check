// Final, corrected server.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static('public'));
app.use('/lpc-generator', express.static('lpc-generator'));

app.get('/api/scan-lpc-files', (req, res) => {
  const command = 'find lpc-generator/spritesheets -type f -name "*.png"';

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`File scan exec error: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to scan for sprite files.',
        details: stderr
      });
    }

    const filePaths = stdout.split('\n').filter(file => file.trim() !== '');
    const spriteDatabase = {};

    filePaths.forEach(p => {
      const pathParts = p.replace('lpc-generator/spritesheets/', '').split('/');
      if (pathParts.length < 3) return;

      const category = pathParts[0];
      const animation = pathParts[pathParts.length - 1].replace('.png', '');
      const sex = pathParts[pathParts.length - 2];
      const style = pathParts.slice(1, -2).join('/');

      if (!style) return;

      if (!spriteDatabase[category]) {
        spriteDatabase[category] = [];
      }

      let styleEntry = spriteDatabase[category].find(s => s.style === style);
      if (!styleEntry) {
        styleEntry = {
          name: style.replace(/\//g, ' '),
          style: style,
          paths: {}
        };
        spriteDatabase[category].push(styleEntry);
      }

      if (!styleEntry.paths[sex]) {
        styleEntry.paths[sex] = {};
      }
      styleEntry.paths[sex][animation] = `/${p}`;
    });

    const outputPath = path.join(__dirname, 'public', 'lpc-all-sprites.json');
    fs.writeFile(outputPath, JSON.stringify(spriteDatabase, null, 2), (err) => {
      if (err) {
        console.error('Error writing sprite database file:', err);
        return res.status(500).json({ error: 'Failed to save sprite database.' });
      }

      console.log(`✅ Sprite database generated at ${outputPath}`);
      res.json({
        message: `Successfully generated sprite database with ${filePaths.length} files.`,
        file: '/lpc-all-sprites.json',
        timestamp: new Date().toISOString()
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});