import pLimit from 'p-limit';
import { SEED_STOCKS } from './seeds.js';
import { yahooService } from './yahoo.js';

const CONCURRENCY = 3;
const DELAY_MS = 400;

let isWarming = false;

export async function warmAllRatios(): Promise<void> {
  if (isWarming) {
    console.log('[RATIOS WARMER] Already running, skipping this trigger.');
    return;
  }
  isWarming = true;

  const limit = pLimit(CONCURRENCY);
  console.log(`[RATIOS WARMER] Starting warm-up for ${SEED_STOCKS.length} symbols...`);

  let done = 0;
  let failed = 0;

  const tasks = SEED_STOCKS.map((stock) =>
    limit(async () => {
      try {
        await yahooService.getBasicFinancials(stock.symbol);
      } catch (err: any) {
        failed++;
        console.warn(`[RATIOS WARMER] Failed for ${stock.symbol}:`, err?.message);
      }
      done++;
      if (done % 50 === 0) {
        console.log(`[RATIOS WARMER] Progress: ${done}/${SEED_STOCKS.length}`);
      }
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    })
  );

  await Promise.all(tasks);
  isWarming = false;
  console.log(`[RATIOS WARMER] Completed. ${done - failed}/${SEED_STOCKS.length} succeeded.`);
}
