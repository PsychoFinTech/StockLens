import { execFile, execSync } from 'child_process';
import path from 'path';
import NodeCache from 'node-cache';
import db from './db.js';

// ─── LAYER 1: In-memory hot cache (fast, lost on restart) ────────────────────
// Short TTL — if in memory it's definitely fresh. Real durability is in SQLite.
const memCache = new NodeCache({ stdTTL: 3600 });

// ─── LAYER 2: Persistent SQLite cache TTLs (seconds) ────────────────────────
const SQLITE_TTL = {
  financials:  7 * 24 * 60 * 60, // 7 days  — annual filings change infrequently
  insiders:    6 * 60 * 60,       // 6 hours — Form 4 can be filed any day
  holdings:    7 * 24 * 60 * 60, // 7 days  — 13F is quarterly
  section:     7 * 24 * 60 * 60, // 7 days  — 10-K is annual
  risk_diff:   7 * 24 * 60 * 60, // 7 days
};

// Track in-flight fetches to avoid duplicate parallel Python processes
const inFlight = new Map<string, Promise<any>>();

export interface EdgarFinancials {
  symbol: string;
  incomeStatement: any[];
  balanceSheet: any[];
  cashFlow: any[];
}

export interface EdgarInsider {
  name: string;
  relationship: string;
  date: string;
  action: string;
  code: string;
  shares: number;
  price: number;
  value: number;
  secLink: string;
}

export interface EdgarHolding {
  ticker: string;
  name: string;
  value: number;
  shares: number;
  option: string;
  qoqChange: string;
}

export interface EdgarHoldingsResponse {
  managerName: string;
  portfolioDate: string;
  holdings: EdgarHolding[];
}

export interface EdgarSectionResponse {
  symbol: string;
  section: string;
  title: string;
  paragraphs: string[];
}

export interface EdgarRiskDiffParagraph {
  status: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface EdgarRiskDiffResponse {
  symbol: string;
  paragraphs: EdgarRiskDiffParagraph[];
}

// ─── Resolve absolute Python path once at startup ────────────────────────────
let pythonPath = 'py';
try {
  pythonPath = execSync('py -c "import sys; sys.stdout.write(sys.executable)"', { encoding: 'utf8' }).trim();
  console.log(`[EDGAR] Resolved Python path: ${pythonPath}`);
} catch (e: any) {
  console.warn('[EDGAR] Failed to resolve Python path, falling back to launcher: ' + e.message);
}

// ─── SQLite helpers ───────────────────────────────────────────────────────────

function sqliteGet(key: string, ttlSeconds: number): any | null {
  try {
    const row = db.prepare('SELECT data, fetched_at FROM edgar_cache WHERE cache_key = ?').get(key) as
      | { data: string; fetched_at: number }
      | undefined;
    if (!row) return null;
    const age = Math.floor(Date.now() / 1000) - row.fetched_at;
    if (age > ttlSeconds) return null; // expired
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

function sqliteSet(key: string, value: any): void {
  try {
    const data = JSON.stringify(value);
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      'INSERT INTO edgar_cache (cache_key, data, fetched_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data, fetched_at=excluded.fetched_at'
    ).run(key, data, now);
  } catch (e: any) {
    console.warn('[EDGAR CACHE] SQLite write failed:', e.message);
  }
}

// ─── Python runner ────────────────────────────────────────────────────────────

function runPythonClient(args: string[]): Promise<any> {
  const scriptPath = path.join(process.cwd(), 'server', 'services', 'edgar_client.py');
  return new Promise((resolve, reject) => {
    execFile(
      pythonPath,
      [scriptPath, ...args],
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 },
      (error, stdout, stderr) => {
        if (error) {
          let errMessage = stderr || error.message;
          try {
            const parsed = JSON.parse(stdout);
            if (parsed?.error) errMessage = parsed.error;
          } catch {}
          return reject(new Error(errMessage));
        }
        try {
          const parsed = JSON.parse(stdout);
          if (parsed?.error) return reject(new Error(parsed.error));
          resolve(parsed);
        } catch (parseError: any) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      }
    );
  });
}

// ─── Generic 3-tier cache-then-fetch helper ───────────────────────────────────
// Returns data instantly from memory or SQLite, or fetches from EDGAR.
// Deduplicates in-flight requests so only one Python process runs per key.

async function cachedFetch<T>(
  memKey: string,
  sqlKey: string,
  sqlTtl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Tier 1: in-memory
  const mem = memCache.get<T>(memKey);
  if (mem !== undefined) return mem;

  // Tier 2: SQLite persistent
  const stored = sqliteGet(sqlKey, sqlTtl);
  if (stored !== null) {
    memCache.set(memKey, stored); // promote to memory
    return stored as T;
  }

  // Tier 3: fetch from EDGAR (deduplicated)
  if (inFlight.has(memKey)) {
    return inFlight.get(memKey) as Promise<T>;
  }

  const promise = fetchFn().then((result) => {
    memCache.set(memKey, result);
    sqliteSet(sqlKey, result);
    inFlight.delete(memKey);
    return result;
  }).catch((err) => {
    inFlight.delete(memKey);
    throw err;
  });

  inFlight.set(memKey, promise);
  return promise;
}

// ─── Statement mapper ─────────────────────────────────────────────────────────

function mapStatement(stmt: any) {
  if (!stmt || !stmt.rows || !stmt.periods) return [];

  const years = stmt.periods.map((p: string) => {
    const match = p.match(/^(\d{4})/);
    return match ? match[1] : p;
  });

  return stmt.rows.map((row: any) => {
    const valuesObj: { [year: string]: number | null } = {};
    years.forEach((year: string, idx: number) => {
      const rawVal = row.values[idx];
      if (rawVal === null || rawVal === undefined) {
        valuesObj[year] = null;
      } else {
        const isEPS =
          row.label.toLowerCase().includes('eps') ||
          row.label.toLowerCase().includes('per share') ||
          row.concept.toLowerCase().includes('earningspershare') ||
          row.label.toLowerCase().includes('earnings per share');
        valuesObj[year] = isEPS ? rawVal : Math.round(rawVal / 1000000);
      }
    });
    return { label: row.label || row.concept || 'Unknown', values: valuesObj };
  });
}

// ─── Public EDGAR service ─────────────────────────────────────────────────────

export const edgarService = {
  getFinancials: async (symbol: string): Promise<EdgarFinancials> => {
    const sym = symbol.toUpperCase();
    return cachedFetch<EdgarFinancials>(
      `fin:${sym}`,
      `financials:${sym}`,
      SQLITE_TTL.financials,
      async () => {
        const result = await runPythonClient(['financials', sym]);
        return {
          symbol: sym,
          incomeStatement: mapStatement(result.income_statement),
          balanceSheet: mapStatement(result.balance_sheet),
          cashFlow: mapStatement(result.cashflow_statement),
        };
      }
    );
  },

  getInsiders: async (symbol: string): Promise<any> => {
    const sym = symbol.toUpperCase();
    return cachedFetch(
      `ins:${sym}`,
      `insiders:${sym}`,
      SQLITE_TTL.insiders,
      async () => {
        const result = await runPythonClient(['insiders', sym]);
        const transactions = (result || []).map((tx: any): EdgarInsider => {
          let action = 'Option Exercise';
          const code = (tx.code || '').toUpperCase();
          if (code === 'S' || code === 'F') action = 'Sell';
          else if (code === 'P' || code === 'A') action = 'Buy';
          return {
            name: tx.owner || 'Unknown',
            relationship: tx.relationship || 'Insider',
            date: tx.date || '',
            action,
            code,
            shares: typeof tx.shares === 'number' ? tx.shares : 0,
            price: typeof tx.price === 'number' ? tx.price : 0,
            value: typeof tx.value === 'number' ? tx.value : 0,
            secLink: tx.filing_url || '',
          };
        });
        return { symbol: sym, transactions };
      }
    );
  },

  getHoldings: async (cikOrSymbol: string): Promise<EdgarHoldingsResponse> => {
    const key = cikOrSymbol.toUpperCase();
    return cachedFetch<EdgarHoldingsResponse>(
      `hld:${key}`,
      `holdings:${key}`,
      SQLITE_TTL.holdings,
      async () => {
        const result = await runPythonClient(['holdings', cikOrSymbol]);

        let managerName = 'Unknown Asset Manager';
        const q = cikOrSymbol.toLowerCase();
        if (q === '0001067983' || q.includes('berkshire') || q.includes('buffett')) managerName = 'Berkshire Hathaway Inc';
        else if (q === '0001166559' || q.includes('gates') || q.includes('foundation')) managerName = 'Bill & Melinda Gates Foundation Trust';
        else if (q === '0001029160' || q.includes('soros')) managerName = 'Soros Fund Management LLC';
        else managerName = key.length <= 5 ? `${key} Portfolio Advisor Group` : `${key} Capital Management LLC`;

        const rawHoldings = result.holdings || [];
        const comparisons = result.comparison || [];
        const holdingsList: EdgarHolding[] = [];

        if (comparisons.length > 0) {
          comparisons.forEach((record: any) => {
            if (record.Status === 'CLOSED') return;
            const matchingRaw = rawHoldings.find((h: any) => (h.cusip || '').toLowerCase() === (record.Cusip || '').toLowerCase());
            const option = matchingRaw?.option_type || 'None';
            let qoqChange = '0.0%';
            if (record.Status === 'NEW') qoqChange = 'New';
            else if (record.Status === 'INCREASED') qoqChange = `+${(record.ShareChangePct || 0).toFixed(1)}%`;
            else if (record.Status === 'DECREASED') qoqChange = `${(record.ShareChangePct || 0).toFixed(1)}%`;
            holdingsList.push({
              ticker: record.Ticker || record.Cusip || 'UNKNOWN',
              name: record.Issuer || 'Unknown Issuer',
              value: record.Value ? Math.round(record.Value / 1000) : 0,
              shares: record.Shares || 0,
              option,
              qoqChange,
            });
          });
        } else {
          rawHoldings.forEach((hold: any) => {
            holdingsList.push({
              ticker: hold.cusip || 'UNKNOWN',
              name: hold.issuer || 'Unknown Issuer',
              value: hold.value ? Math.round(hold.value / 1000) : 0,
              shares: hold.shares || 0,
              option: hold.option_type || 'None',
              qoqChange: '0.0%',
            });
          });
        }

        holdingsList.sort((a, b) => b.value - a.value);
        return { managerName, portfolioDate: '2026-03-31', holdings: holdingsList };
      }
    );
  },

  getSection: async (symbol: string, item: string): Promise<EdgarSectionResponse> => {
    const sym = symbol.toUpperCase();
    return cachedFetch<EdgarSectionResponse>(
      `sec:${sym}:${item}`,
      `section:${sym}:${item}`,
      SQLITE_TTL.section,
      async () => {
        const result = await runPythonClient(['section', sym, item]);
        const paragraphs = (result.text || '')
          .split('\n')
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);
        return {
          symbol: sym,
          section: item,
          title: item === '1A' ? 'Item 1A. Risk Factors' : "Item 7. Management's Discussion and Analysis (MD&A)",
          paragraphs,
        };
      }
    );
  },

  getRiskDiff: async (symbol: string): Promise<EdgarRiskDiffResponse> => {
    const sym = symbol.toUpperCase();
    return cachedFetch<EdgarRiskDiffResponse>(
      `rdiff:${sym}`,
      `risk_diff:${sym}`,
      SQLITE_TTL.risk_diff,
      async () => {
        const result = await runPythonClient(['risk_diff', sym]);
        const paragraphs = (result || []).map((p: any): EdgarRiskDiffParagraph => ({
          status: p.type || 'unchanged',
          text: p.text || '',
        }));
        return { symbol: sym, paragraphs };
      }
    );
  },
};

// ─── Background pre-fetch: call this fire-and-forget for any symbol ───────────
// Starts fetching financials + insiders in the background without blocking the
// caller. By the time the user clicks the SEC tab, data will already be cached.

export function prefetchEdgar(symbol: string): void {
  const sym = symbol.toUpperCase();

  // Skip if already in memory (definitely already cached)
  if (memCache.get(`fin:${sym}`) !== undefined) return;

  // Skip if already cached in SQLite within TTL
  const existing = sqliteGet(`financials:${sym}`, SQLITE_TTL.financials);
  if (existing !== null) return;

  // Skip if already fetching
  if (inFlight.has(`fin:${sym}`)) return;

  console.log(`[EDGAR PREFETCH] Background warming cache for: ${sym}`);

  // Fire and forget — fetch financials + insiders concurrently
  Promise.allSettled([
    edgarService.getFinancials(sym),
    edgarService.getInsiders(sym),
  ]).then((results) => {
    const ok = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[EDGAR PREFETCH] ${sym}: ${ok}/2 tasks completed successfully`);
  });
}
