
import * as fs from 'fs';
import * as path from 'path';

export interface Card {
  id: string;
  deck: 'sin' | 'virtue';
  type: 'immediate' | 'delayed';
  text: string;
  money: number;
  mental: number;
  sin: number;
  virtue: number;
  delay: number;
}

export class CardParser {
  private watchMode = false;
  private watchers: fs.FSWatcher[] = [];

  constructor(private srcDir: string = './src/cards', private distDir: string = './dist') {
    this.ensureDistDir();
  }

  private ensureDistDir(): void {
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }
  }

  private parseCSV(csvContent: string): Card[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const card: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (['money', 'mental', 'sin', 'virtue', 'delay'].includes(header)) {
          card[header] = parseInt(value) || 0;
        } else {
          card[header] = value;
        }
      });
      
      return card as Card;
    });
  }

  private async parseFile(filePath: string): Promise<Card[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parseCSV(content);
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      return [];
    }
  }

  private async writeJSON(cards: Card[], outputPath: string): Promise<void> {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
      console.log(`✅ Generated ${outputPath} with ${cards.length} cards`);
    } catch (error) {
      console.error(`Error writing ${outputPath}:`, error);
    }
  }

  async parseAll(): Promise<{ sin: Card[], virtue: Card[] }> {
    const sinPath = path.join(this.srcDir, 'sin.csv');
    const virtuePath = path.join(this.srcDir, 'virtue.csv');
    
    const [sinCards, virtueCards] = await Promise.all([
      this.parseFile(sinPath),
      this.parseFile(virtuePath)
    ]);

    // Write to dist
    await this.writeJSON(sinCards, path.join(this.distDir, 'sin.json'));
    await this.writeJSON(virtueCards, path.join(this.distDir, 'virtue.json'));

    return { sin: sinCards, virtue: virtueCards };
  }

  startWatching(): void {
    if (this.watchMode) return;
    
    this.watchMode = true;
    const csvFiles = ['sin.csv', 'virtue.csv'];
    
    csvFiles.forEach(filename => {
      const filePath = path.join(this.srcDir, filename);
      if (fs.existsSync(filePath)) {
        const watcher = fs.watchFile(filePath, { interval: 1000 }, () => {
          console.log(`📝 ${filename} changed, regenerating...`);
          this.parseAll();
        });
        this.watchers.push(watcher);
      }
    });
    
    console.log('👀 Watching CSV files for changes...');
  }

  stopWatching(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
    this.watchMode = false;
  }
}

// CLI usage
if (require.main === module) {
  const parser = new CardParser();
  const args = process.argv.slice(2);
  
  if (args.includes('--watch')) {
    parser.parseAll().then(() => {
      parser.startWatching();
    });
  } else {
    parser.parseAll();
  }
}
