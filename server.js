// Final, corrected server.js
const express = require('express');
const fs = require('fs').promises; // Use the promises version of fs
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static('public'));
app.use('/lpc-generator', express.static('lpc-generator'));

// Modern async/await recursive function to find all files with a specific extension
async function findFiles(startPath, filter) {
  let results = [];
  const files = await fs.readdir(startPath);

  for (const file of files) {
    const filepath = path.join(startPath, file);
    const stats = await fs.stat(filepath);

    if (stats.isDirectory()) {
      results = results.concat(await findFiles(filepath, filter));
    } else {
      if (filepath.endsWith(filter)) {
        results.push(filepath);
      }
    }
  }
  return results;
}


app.get('/api/scan-lpc-files', async (req, res) => {
  console.log('[SERVER] Received request for /api/scan-lpc-files');
  const spritesheetsPath = 'lpc-generator/spritesheets';

  try {
    console.log(`[SERVER] Starting file scan in ${spritesheetsPath}...`);
    const filePaths = await findFiles(spritesheetsPath, '.png');
    console.log(`[SERVER] File scan complete. Found ${filePaths.length} files.`);

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
    console.log(`[SERVER] Writing database to ${outputPath}...`);
    await fs.writeFile(outputPath, JSON.stringify(spriteDatabase, null, 2));
    console.log('[SERVER] Database file written successfully.');

    res.json({
      message: `Successfully generated sprite database with ${filePaths.length} files.`,
      file: '/lpc-all-sprites.json',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error(`[SERVER] ERROR: ${err.stack}`);
    res.status(500).json({
      error: 'Failed to scan for sprite files.',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});