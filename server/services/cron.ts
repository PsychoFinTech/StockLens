import cron from 'node-cron';
import { yahooService } from './yahoo.js';
import db from './db.js';
import { warmAllRatios } from './ratiosWarmer.js';
import pLimit from 'p-limit';
import { SEED_STOCKS } from './seeds.js';

// ESM/CJS interop compatibility resolver for bundlers (e.g. esbuild/webpack)
let pLimitFn: any = pLimit;
if (pLimitFn && typeof pLimitFn.default === 'function') {
  pLimitFn = pLimitFn.default;
}

const WARM_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'RELIANCE.NS', 'BP.L', 'SAP.DE', '9984.T'];

export const initCronJobs = () => {
  // Pre-schedule warmers to execute daily at 9:00 AM local time
  console.log('[CRON] Initializing scheduled cache warming service (9:00AM daily schedule)...');
  
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Starting daily 9AM hot-cache prewarmer loop...');
    for (const ticker of WARM_TICKERS) {
      try {
        console.log(`[CRON] Pre-warming quotes for: ${ticker}`);
        await yahooService.getQuote(ticker);
        
        console.log(`[CRON] Pre-warming financials for: ${ticker}`);
        await yahooService.getFinancials(ticker);
        
        // Small delay to prevent API overloading of free keys
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        console.warn(`[CRON EXCEPTION] Failed to prewarm ticker ${ticker}:`, err.message);
      }
    }
    console.log('[CRON] Cache prewarming cycle complete.');
  });

  // Daily 9:30AM: refresh PE/ROE/D-E for the entire screener universe
  cron.schedule('30 9 * * *', async () => {
    console.log('[CRON] Starting daily full-universe ratios warm-up...');
    await warmAllRatios();
  });

  // Every 5 minutes during market hours (9 AM - 4 PM), Monday to Friday: warm quotes for the screener universe
  cron.schedule('*/5 9-16 * * 1-5', async () => {
    console.log('[CRON] Starting 5-minute quote prewarmer loop during market hours...');
    const limit = pLimitFn(4);
    await Promise.all(
      SEED_STOCKS.map(stock => limit(async () => {
        try {
          await yahooService.getQuote(stock.symbol);
        } catch (e: any) {
          console.warn(`[QUOTE WARMER] ${stock.symbol}:`, e.message);
        }
      }))
    );
    console.log('[CRON] 5-minute quote prewarmer complete.');
  });
};
