import https from 'https';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import YahooFinance from 'yahoo-finance2';

// Compatibility for CJS/ESM
let YahooFinanceClass = YahooFinance;
if (YahooFinanceClass && typeof YahooFinanceClass.default === 'function') {
  YahooFinanceClass = YahooFinanceClass.default;
}

const yahooFinance = new YahooFinanceClass({
  queue: { concurrency: 10 }
});

const limit = pLimit(10); // 10 concurrent requests to not get totally banned

const url = 'https://raw.githubusercontent.com/Ate329/top-us-stock-tickers/main/tickers/all.csv';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    const lines = data.split('\n').map(l => l.trim()).filter(l => l);
    const symbols = [];
    
    // index 1 to skip header
    for (let i = 1; i < lines.length && symbols.length < 2100; i++) {
      const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (match) {
        const symbol = match[0].replace(/"/g, '');
        // skip weird symbols or preferred shares
        if (!symbol.includes('^') && !symbol.includes('-')) {
          symbols.push(symbol);
        }
      }
    }
    
    console.log(`Extracted ${symbols.length} raw symbols, now fetching real data via Yahoo Finance...`);
    const stocks = [];
    
    // Batch process to prevent memory overload and monitor progress
    const tasks = symbols.map(sym => limit(async () => {
      try {
        const result = await yahooFinance.quoteSummary(sym, { modules: ['assetProfile', 'price'] });
        const p = result.price;
        const a = result.assetProfile;
        
        if (p && a && p.exchangeName && a.sector) {
          stocks.push({
            symbol: sym,
            name: p.longName || p.shortName || sym,
            exchange: p.exchangeName,
            sector: a.sector || 'Unknown',
            industry: a.industry || 'Unknown',
            country: a.country || 'United States'
          });
        }
      } catch (err) {
        // Ignored on purpose to skip failed/delisted tickers
      }
    }));
    
    // Log progress every 200 items
    let done = 0;
    tasks.forEach(t => t.then(() => {
      done++;
      if (done % 200 === 0) console.log(`Processed ${done}/${symbols.length}...`);
    }));

    await Promise.all(tasks);
    
    // Take exactly 2000 if we have more
    const finalStocks = stocks.slice(0, 2000);

    const fileContent = `/**
 * Seeds dataset of S&P 500 plus popular global equities.
 * Total seeded: ${finalStocks.length}
 */
export interface StockSeed {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
}

export const SEED_STOCKS: StockSeed[] = ${JSON.stringify(finalStocks, null, 2)};
`;

    const outputPath = path.join(process.cwd(), 'server', 'services', 'seeds.ts');
    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully wrote ${finalStocks.length} REAL stocks to seeds.ts`);
  });
}).on('error', err => console.error(err));
