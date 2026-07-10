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
  const prodPath = path.join(process.cwd(), 'dist', 'seeds.json');
  if (fs.existsSync(prodPath)) {
    loadedSeeds = JSON.parse(fs.readFileSync(prodPath, 'utf-8'));
  } else if (fs.existsSync(seedsPath)) {
    loadedSeeds = JSON.parse(fs.readFileSync(seedsPath, 'utf-8'));
  } else {
    // Fallback relative to import.meta.dirname
    const relativePath = path.join(import.meta.dirname, 'seeds.json');
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
