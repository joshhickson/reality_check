const fs = require('fs').promises;
const path = require('path');

// Copied from server.js
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

async function runScanInBatches() {
  console.log('[SCANNER] Starting batched scan...');
  const spritesheetsPath = 'lpc-generator/spritesheets';
  const outputPath = path.join(__dirname, 'public', 'lpc-all-sprites.json');
  const tempOutputPath = path.join(__dirname, 'public', 'lpc-all-sprites.temp.json');

  try {
    const topLevelDirs = await fs.readdir(spritesheetsPath);
    let fullSpriteDatabase = {};

    for (const dir of topLevelDirs) {
      const dirPath = path.join(spritesheetsPath, dir);
      const stats = await fs.stat(dirPath);

      if (stats.isDirectory()) {
        console.log(`[SCANNER] Processing directory: ${dirPath}`);
        const filePaths = await findFiles(dirPath, '.png');
        console.log(`[SCANNER]   Found ${filePaths.length} files.`);

        filePaths.forEach(p => {
            const pathParts = p.replace('lpc-generator/spritesheets/', '').split('/');
            if (pathParts.length < 3) return;

            const category = pathParts[0];
            const animation = pathParts[pathParts.length - 1].replace('.png', '');
            const sex = pathParts[pathParts.length - 2];
            const style = pathParts.slice(1, -2).join('/');

            if (!style) return;

            if (!fullSpriteDatabase[category]) {
                fullSpriteDatabase[category] = [];
            }

            let styleEntry = fullSpriteDatabase[category].find(s => s.style === style);
            if (!styleEntry) {
                styleEntry = {
                name: style.replace(/\//g, ' '),
                style: style,
                paths: {}
                };
                fullSpriteDatabase[category].push(styleEntry);
            }

            if (!styleEntry.paths[sex]) {
                styleEntry.paths[sex] = {};
            }
            styleEntry.paths[sex][animation] = `/${p}`;
        });
      }
    }

    console.log(`[SCANNER] Writing final database to ${outputPath}...`);
    await fs.writeFile(outputPath, JSON.stringify(fullSpriteDatabase, null, 2));
    console.log('[SCANNER] Database file written successfully.');

  } catch (err) {
    console.error(`[SCANNER] ERROR: ${err.stack}`);
  }
}

runScanInBatches();
