import Database from 'better-sqlite3';
import YahooFinance from 'yahoo-finance2';
import pLimit from 'p-limit';
import path from 'path';

// ESM Interop
let YahooFinanceClass = YahooFinance;
if (YahooFinanceClass && typeof YahooFinanceClass.default === 'function') {
  YahooFinanceClass = YahooFinanceClass.default;
}
const yahooFinance = new YahooFinanceClass({
  queue: { concurrency: 10 }
});

const dbPath = path.resolve(process.cwd(), 'stocklens.db');
const db = new Database(dbPath);

// Ensure schema is updated manually in case the backend hasn't done it yet
db.exec(`
  CREATE TABLE IF NOT EXISTS historical_prices (
    symbol TEXT NOT NULL,
    date INTEGER NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    PRIMARY KEY (symbol, date)
  ) WITHOUT ROWID;
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO historical_prices (symbol, date, open, high, low, close, volume)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

async function main() {
  const symbols = db.prepare('SELECT symbol FROM stocks').all().map((r: any) => r.symbol);
  console.log(`Starting historical download for ${symbols.length} symbols...`);

  // 5 years ago
  const period1 = new Date(Date.now() - 5 * 365 * 24 * 3600 * 1000);
  
  const limit = pLimit(10);
  let done = 0;
  let totalRows = 0;

  const tasks = symbols.map(sym => limit(async () => {
    try {
      const results = await yahooFinance.historical(sym, {
        period1,
        period2: new Date(),
        interval: '1d'
      });
      
      if (results && results.length > 0) {
        db.transaction(() => {
          for (const row of results) {
            // Convert date to seconds timestamp to match our API standard
            const timestamp = Math.floor(row.date.getTime() / 1000);
            insertStmt.run(sym, timestamp, row.open, row.high, row.low, row.close, row.volume);
          }
        })();
        totalRows += results.length;
      }
    } catch (err: any) {
      console.warn(`[WARN] Failed to fetch ${sym}:`, err.message);
    } finally {
      done++;
      if (done % 50 === 0) {
        console.log(`Progress: ${done}/${symbols.length} - Extracted ${totalRows} rows so far...`);
      }
    }
  }));

  await Promise.all(tasks);
  console.log(`\nCOMPLETED! Total historical rows inserted: ${totalRows}`);
}

main().catch(console.error);
