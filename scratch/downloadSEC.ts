import Database from 'better-sqlite3';
import path from 'path';
import { edgarService } from '../server/services/edgar.js';

const dbPath = path.resolve(process.cwd(), 'stocklens.db');
const db = new Database(dbPath);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  const symbols = db.prepare('SELECT symbol FROM stocks').all().map((r: any) => r.symbol);
  console.log(`Starting SEC Financials download for ${symbols.length} symbols...`);

  let done = 0;
  let successes = 0;
  let failures = 0;

  const tasks = symbols.map(async (sym, index) => {
    // Stagger the start time of each request by 125ms to enforce exactly 8 requests per second.
    await delay(index * 125);
    
    try {
      await edgarService.getFinancials(sym);
      successes++;
    } catch (err: any) {
      failures++;
    } finally {
      done++;
      if (done % 100 === 0) {
        console.log(`Progress: ${done}/${symbols.length} - Success: ${successes}, Failed: ${failures}`);
      }
    }
  });

  await Promise.all(tasks);

  console.log(`\nCOMPLETED! Processed ${done} symbols. Successes: ${successes}, Failures: ${failures}`);
}

main().catch(console.error);
