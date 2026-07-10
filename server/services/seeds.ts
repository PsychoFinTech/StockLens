import fs from 'fs';
import path from 'path';

/**
 * Seeds dataset of S&P 500 plus popular global equities.
 * Total seeded: 2000
 */
export interface StockSeed {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
}

// Load seeds from JSON asset to keep them out of the server bundle
const seedsPath = path.join(process.cwd(), 'server', 'services', 'seeds.json');
let loadedSeeds: StockSeed[] = [];

try {
  // If running from dist/, the path might need adjustment or we just assume 
  // we copy seeds.json to dist/seeds.json and load from there.
  // Wait, process.cwd() is the project root in both dev and prod if run via `npm start`.
  // Let's check where it expects it. The prompt says: "load it via a path resolved relative to the running file / process.cwd()".
  // Actually, standard way is to copy to dist/ and load from dist/. But `process.cwd()` is usually the root.
  // Let's check if it exists in process.cwd()/server/services/seeds.json (dev) or process.cwd()/dist/seeds.json (prod).
  const prodPath = path.join(process.cwd(), 'dist', 'seeds.json');
  if (fs.existsSync(prodPath)) {
    loadedSeeds = JSON.parse(fs.readFileSync(prodPath, 'utf-8'));
  } else if (fs.existsSync(seedsPath)) {
    loadedSeeds = JSON.parse(fs.readFileSync(seedsPath, 'utf-8'));
  } else {
    // Try relative to __dirname for robustness
    const relativePath = path.join(__dirname, 'seeds.json');
    if (fs.existsSync(relativePath)) {
      loadedSeeds = JSON.parse(fs.readFileSync(relativePath, 'utf-8'));
    } else {
      console.warn('[SEEDS] Could not find seeds.json');
    }
  }
} catch (err) {
  console.error('[SEEDS] Error loading seeds.json:', err);
}

export const SEED_STOCKS: StockSeed[] = loadedSeeds;
