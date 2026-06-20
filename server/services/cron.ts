import cron from 'node-cron';
import { yahooService } from './yahoo.js';
import db from './db.js';
import { warmAllRatios } from './ratiosWarmer.js';

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
};
