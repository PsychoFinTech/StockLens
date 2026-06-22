import pLimit from 'p-limit';
import { SEED_STOCKS } from './seeds.js';
import { edgarService } from './edgar.js';

// ESM/CJS interop compatibility resolver for bundlers
let pLimitFn: any = pLimit;
if (pLimitFn && typeof pLimitFn.default === 'function') {
  pLimitFn = pLimitFn.default;
}

const CONCURRENCY = 2; // SEC limit is 10/sec, keep it safe
const DELAY_MS = 250; 
const MAX_RETRY_PASSES = 2;

let isWarming = false;

interface WarmResult {
  succeeded: string[];
  failed: string[];
}

async function warmBatch(symbols: string[], passLabel: string): Promise<WarmResult> {
  const limit = pLimitFn(CONCURRENCY);
  const succeeded: string[] = [];
  const failed: string[] = [];

  let done = 0;

  const tasks = symbols.map((symbol) =>
    limit(async () => {
      try {
        await edgarService.getFinancials(symbol);
        succeeded.push(symbol);
      } catch (err: any) {
        failed.push(symbol);
        console.warn(`[EDGAR WARMER:${passLabel}] Failed for ${symbol}:`, err?.message);
      }
      done++;
      if (done % 50 === 0) {
        console.log(`[EDGAR WARMER:${passLabel}] Progress: ${done}/${symbols.length}`);
      }
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    })
  );

  await Promise.all(tasks);
  return { succeeded, failed };
}

export async function warmAllEdgarFinancials(): Promise<void> {
  if (isWarming) {
    console.log('[EDGAR WARMER] Already running, skipping this trigger.');
    return;
  }
  isWarming = true;

  try {
    const allSymbols = SEED_STOCKS.map((s) => s.symbol);
    console.log(`[EDGAR WARMER] Starting warm-up for ${allSymbols.length} symbols...`);

    let pending = allSymbols;
    let totalSucceeded = 0;
    const overallFailed = new Set<string>(pending);

    for (let pass = 0; pass <= MAX_RETRY_PASSES && pending.length > 0; pass++) {
      const label = pass === 0 ? 'PASS1' : `RETRY${pass}`;
      if (pass > 0) {
        console.log(
          `[EDGAR WARMER] Retry pass ${pass}/${MAX_RETRY_PASSES} for ${pending.length} ` +
          `symbols that failed previously...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000 * pass));
      }

      const { succeeded, failed } = await warmBatch(pending, label);
      totalSucceeded += succeeded.length;
      for (const sym of succeeded) overallFailed.delete(sym);
      pending = failed;
    }

    console.log(
      `[EDGAR WARMER] Completed. ${totalSucceeded}/${allSymbols.length} succeeded, ` +
      `${overallFailed.size} permanently failed after ${MAX_RETRY_PASSES} retries.`
    );
    if (overallFailed.size > 0) {
      console.warn(
        `[EDGAR WARMER] Permanently failed symbols (will retry on next scheduled run): ` +
        `${Array.from(overallFailed).join(', ')}`
      );
    }
  } finally {
    isWarming = false;
  }
}
