import NodeCache from 'node-cache';
import db from './db.js';
import fs from 'fs';
import path from 'path';

// ─── LAYER 1: In-memory hot cache (fast, lost on restart) ────────────────────
const memCache = new NodeCache({ stdTTL: 3600 });

// ─── LAYER 2: Persistent SQLite cache TTLs (seconds) ────────────────────────
const SQLITE_TTL = {
  financials:  7 * 24 * 60 * 60, // 7 days
  insiders:    6 * 60 * 60,       // 6 hours
  holdings:    7 * 24 * 60 * 60, // 7 days
  section:     7 * 24 * 60 * 60, // 7 days
  risk_diff:   7 * 24 * 60 * 60, // 7 days
};

// Track in-flight fetches to avoid duplicate parallel requests
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

// ─── Generic 3-tier cache-then-fetch helper ───────────────────────────────────

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

// ─── CIK & CUSIP Mappings ──────────────────────────────────────────────────────

let tickerToCikMap: Record<string, string> = {};
let cusipToTickerMap: Record<string, string> = {};

function loadMappings() {
  try {
    const tickerPath = path.join(process.cwd(), 'server', 'services', 'ticker_to_cik.json');
    if (fs.existsSync(tickerPath)) {
      tickerToCikMap = JSON.parse(fs.readFileSync(tickerPath, 'utf8'));
    }
  } catch (err) {
    console.warn('[EDGAR] Failed to load ticker_to_cik.json:', err);
  }

  try {
    const cusipPath = path.join(process.cwd(), 'server', 'services', 'cusip_to_ticker.json');
    if (fs.existsSync(cusipPath)) {
      cusipToTickerMap = JSON.parse(fs.readFileSync(cusipPath, 'utf8'));
    }
  } catch (err) {
    console.warn('[EDGAR] Failed to load cusip_to_ticker.json:', err);
  }
}
loadMappings();

const USER_AGENT = 'Stocklens Research Agent stocklens-admin@gmail.com';

async function getCik(symbol: string): Promise<string> {
  const sym = symbol.toUpperCase();
  if (tickerToCikMap[sym]) {
    return tickerToCikMap[sym];
  }

  // Fetch from SEC
  try {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as Record<string, { cik_str: number; ticker: string; title: string }>;
    for (const key of Object.keys(data)) {
      const item = data[key];
      tickerToCikMap[item.ticker.toUpperCase()] = String(item.cik_str).padStart(10, '0');
    }
    // Write back to cache
    try {
      const tickerPath = path.join(process.cwd(), 'server', 'services', 'ticker_to_cik.json');
      fs.writeFileSync(tickerPath, JSON.stringify(tickerToCikMap), 'utf8');
    } catch {}
  } catch (err: any) {
    console.warn('[EDGAR] CIK lookup fallback failed, using defaults:', err.message);
    const fallbacks: Record<string, string> = {
      AAPL: '0000320193',
      MSFT: '0000789019',
      GOOGL: '0001652044',
      GOOG: '0001652044',
      AMZN: '0001018724',
      NVDA: '0001045810',
      META: '0001326801',
      TSLA: '0001318605',
      JPM: '0000019617',
    };
    if (fallbacks[sym]) return fallbacks[sym];
    throw new Error(`Could not resolve CIK for ticker ${sym}`);
  }

  if (tickerToCikMap[sym]) {
    return tickerToCikMap[sym];
  }
  throw new Error(`Could not resolve CIK for ticker ${sym}`);
}

// ─── Financials Helpers & Concepts ───────────────────────────────────────────

const INCOME_CONCEPTS: [string, string, string | null][] = [
  ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Net sales', 'Revenue'],
  ['SalesRevenueNet', 'Net sales', 'Revenue'],
  ['Revenues', 'Net sales', 'Revenue'],
  ['CostOfGoodsAndServicesSold', 'Cost of sales', 'CostOfGoodsAndServicesSold'],
  ['CostOfGoodsSold', 'Cost of sales', 'CostOfGoodsAndServicesSold'],
  ['GrossProfit', 'Gross margin', 'GrossProfit'],
  ['ResearchAndDevelopmentExpense', 'Research and development', 'ResearchAndDevelopmentExpenses'],
  ['SellingGeneralAndAdministrativeExpense', 'Selling, general and administrative', 'SellingGeneralAndAdminExpenses'],
  ['OperatingExpenses', 'Total operating expenses', 'TotalOperatingExpenses'],
  ['OperatingIncomeLoss', 'Operating income', 'OperatingIncomeLoss'],
  ['NonoperatingIncomeExpense', 'Other income/(expense), net', 'NonoperatingIncomeExpense'],
  ['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'Income before provision for income taxes', 'PretaxIncomeLoss'],
  ['IncomeTaxExpenseBenefit', 'Provision for income taxes', 'IncomeTaxes'],
  ['NetIncomeLoss', 'Net income', 'NetIncome'],
  ['EarningsPerShareBasic', 'Basic (in dollars per share)', null],
  ['EarningsPerShareDiluted', 'Diluted (in dollars per share)', null],
  ['WeightedAverageNumberOfSharesOutstandingBasic', 'Basic (in shares)', 'SharesAverage'],
  ['WeightedAverageNumberOfDilutedSharesOutstanding', 'Diluted (in shares)', 'SharesFullyDilutedAverage']
];

const BALANCE_CONCEPTS: [string, string, string | null][] = [
  ['CashAndCashEquivalentsAtCarryingValue', 'Cash and cash equivalents', 'CashAndMarketableSecurities'],
  ['MarketableSecuritiesCurrent', 'Marketable securities', 'ShortTermInvestments'],
  ['AccountsReceivableNetCurrent', 'Accounts receivable, net', 'TradeReceivables'],
  ['NontradeReceivablesCurrent', 'Vendor non-trade receivables', 'OtherNonOperatingCurrentAssets'],
  ['InventoryNet', 'Inventories', 'Inventories'],
  ['OtherAssetsCurrent', 'Other current assets', 'OtherNonOperatingCurrentAssets'],
  ['AssetsCurrent', 'Total current assets', 'CurrentAssetsTotal'],
  ['MarketableSecuritiesNoncurrent', 'Marketable securities (noncurrent)', 'OtherNonOperatingNonCurrentAssets'],
  ['PropertyPlantAndEquipmentNet', 'Property, plant and equipment, net', 'PlantPropertyEquipmentNet'],
  ['OtherAssetsNoncurrent', 'Other non-current assets', 'OtherNonOperatingNonCurrentAssets'],
  ['Assets', 'Total assets', 'Assets'],
  ['AccountsPayableCurrent', 'Accounts payable', 'TradePayables'],
  ['OtherLiabilitiesCurrent', 'Other current liabilities', 'OtherNonOperatingCurrentLiabilities'],
  ['ContractWithCustomerLiabilityCurrent', 'Deferred revenue', 'OtherOperatingCurrentLiabilities'],
  ['CommercialPaper', 'Commercial paper', 'ShortTermDebt'],
  ['LongTermDebtCurrent', 'Term debt (current)', 'CurrentPortionOfLongTermDebt'],
  ['LiabilitiesCurrent', 'Total current liabilities', 'CurrentLiabilitiesTotal'],
  ['LongTermDebtNoncurrent', 'Term debt (noncurrent)', 'LongTermDebt'],
  ['OtherLiabilitiesNoncurrent', 'Other non-current liabilities', 'OtherNonOperatingNonCurrentAssets'],
  ['Liabilities', 'Total liabilities', 'Liabilities'],
  ['CommonStocksIncludingAdditionalPaidInCapital', 'Common stock and additional paid-in capital', 'CommonEquity'],
  ['RetainedEarningsAccumulatedDeficit', 'Retained earnings/(Accumulated deficit)', 'RetainedEarnings'],
  ['AccumulatedOtherComprehensiveIncomeLossNetOfTax', 'Accumulated other comprehensive loss', 'AccumulatedOtherComprehensiveIncome'],
  ['StockholdersEquity', 'Total shareholders\' equity', 'AllEquityBalance'],
  ['LiabilitiesAndStockholdersEquity', 'Total liabilities and shareholders\' equity', 'LiabilitiesAndEquity']
];

const CASHFLOW_CONCEPTS: [string, string, string | null][] = [
  ['CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'Cash, cash equivalents, and restricted cash, beginning', 'CashAndCashEquivalents'],
  ['NetIncomeLoss', 'Net income', 'NetIncome'],
  ['DepreciationDepletionAndAmortization', 'Depreciation and amortization', 'DepreciationExpense'],
  ['ShareBasedCompensation', 'Share-based compensation expense', 'StockBasedCompensationExpense'],
  ['NetCashProvidedByUsedInOperatingActivities', 'Cash generated by operating activities', 'NetCashFromOperatingActivities'],
  ['PaymentsToAcquirePropertyPlantAndEquipment', 'Payments for property, plant and equipment', 'CapitalExpenses'],
  ['NetCashProvidedByUsedInInvestingActivities', 'Cash generated by investing activities', 'NetCashFromInvestingActivities'],
  ['PaymentsOfDividends', 'Payments for dividends', 'DistributionsToMinorityInterests'],
  ['PaymentsForRepurchaseOfCommonStock', 'Repurchases of common stock', 'EquityExpenseIncome(BuybackIssued)'],
  ['ProceedsFromIssuanceOfLongTermDebt', 'Proceeds from term debt', 'DebtProceeds'],
  ['RepaymentsOfLongTermDebt', 'Repayments of term debt', 'DebtRepayments'],
  ['NetCashProvidedByUsedInFinancingActivities', 'Cash used in financing activities', 'NetCashFromFinancingActivities'],
  ['CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect', 'Net change in cash', 'NetChangeInCash']
];

function parseSecStatement(facts: any, conceptsList: [string, string, string | null][]) {
  const usGaap = facts?.facts?.['us-gaap'] || {};
  
  let netIncomeData = usGaap['NetIncomeLoss']?.units?.USD || [];
  if (netIncomeData.length === 0) {
    netIncomeData = usGaap['Revenues']?.units?.USD || [];
  }
  if (netIncomeData.length === 0) {
    const units = usGaap['NetIncomeLoss']?.units || usGaap['Revenues']?.units || {};
    const keys = Object.keys(units);
    if (keys.length > 0) {
      netIncomeData = units[keys[0]] || [];
    }
  }

  const annualPoints = netIncomeData.filter((p: any) => p.form === '10-K' && p.fp === 'FY');

  const yearToPeriod: Record<number, string> = {};
  for (const p of annualPoints) {
    const fy = p.fy;
    const end = p.end;
    if (fy && end) {
      yearToPeriod[Number(fy)] = `${end} (FY)`;
    }
  }

  const sortedYears = Object.keys(yearToPeriod)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 3); // latest 3 years

  const periods = sortedYears.map(y => yearToPeriod[y]);

  const rows = [];
  for (const [conceptName, customLabel, stdConcept] of conceptsList) {
    const conceptData = usGaap[conceptName];
    if (!conceptData) continue;

    const units = conceptData.units || {};
    const unitKeys = Object.keys(units);
    if (unitKeys.length === 0) continue;

    const unitKey = units['USD'] ? 'USD' : unitKeys[0];
    const points = units[unitKey] || [];

    const pointsByYear: Record<number, number> = {};
    for (const p of points) {
      if (p.form === '10-K' && p.fp === 'FY' && p.fy !== undefined) {
        pointsByYear[Number(p.fy)] = p.val;
      }
    }

    const values = [];
    let hasAnyVal = false;
    for (const y of sortedYears) {
      const val = pointsByYear[y];
      if (val !== undefined && val !== null) {
        values.push(val);
        hasAnyVal = true;
      } else {
        values.push(null);
      }
    }

    if (hasAnyVal) {
      rows.push({
        concept: `us-gaap_${conceptName}`,
        label: customLabel,
        standard_concept: stdConcept,
        values: values
      });
    }
  }

  return {
    periods,
    rows
  };
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

// ─── XML Parsing Helpers ───────────────────────────────────────────────────────

function extractTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<([a-zA-Z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/([a-zA-Z0-9]+:)?${tag}>`, 'i');
  const match = regex.exec(xml);
  if (!match) return '';
  const inner = match[2].trim();
  const valMatch = /<value>([\s\S]*?)<\/value>/i.exec(inner);
  if (valMatch) return valMatch[1].trim();
  return inner;
}

function getRelationship(relBlock: string): string {
  if (!relBlock) return 'Insider';
  
  const officerTitle = extractTagContent(relBlock, 'officerTitle');
  if (officerTitle) return officerTitle;
  
  const isDirector = extractTagContent(relBlock, 'isDirector').toLowerCase();
  if (isDirector === '1' || isDirector === 'true') return 'Director';
  
  const isOfficer = extractTagContent(relBlock, 'isOfficer').toLowerCase();
  if (isOfficer === '1' || isOfficer === 'true') return 'Officer';
  
  const isTenPercent = extractTagContent(relBlock, 'isTenPercentOwner').toLowerCase();
  if (isTenPercent === '1' || isTenPercent === 'true') return '10% Owner';
  
  return 'Insider';
}

function parseFilingXml(xmlContent: string, cik: string, accNum: string, primaryDoc: string, filingDate: string): any[] {
  const accNumNoDashes = accNum.replace(/-/g, '');
  const indexUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNumNoDashes}/${accNum}-index.html`;

  let ownerName = extractTagContent(xmlContent, 'rptOwnerName') || 'Unknown';
  if (ownerName !== 'Unknown') {
    ownerName = ownerName.split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  }

  const relMatch = xmlContent.match(/<reportingOwnerRelationship>([\s\S]*?)<\/reportingOwnerRelationship>/i);
  const relationship = relMatch ? getRelationship(relMatch[1]) : 'Insider';

  const txRegex = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi;
  let match;
  const txs = [];
  while ((match = txRegex.exec(xmlContent)) !== null) {
    const txBlock = match[1];
    const title = extractTagContent(txBlock, 'securityTitle');
    const date = extractTagContent(txBlock, 'transactionDate') || filingDate;
    const code = extractTagContent(txBlock, 'transactionCode');
    const shares = parseFloat(extractTagContent(txBlock, 'transactionShares')) || 0;
    const price = parseFloat(extractTagContent(txBlock, 'transactionPricePerShare')) || 0;
    const remaining = parseFloat(extractTagContent(txBlock, 'sharesOwnedFollowingTransaction')) || 0;

    txs.push({
      owner: ownerName,
      relationship: relationship,
      security_title: title || 'Common Stock',
      date: date,
      code: code,
      shares: shares,
      price: price,
      value: shares * price,
      remaining: remaining,
      filing_url: indexUrl
    });
  }
  return txs;
}

// ─── 13F Holdings Helper ───────────────────────────────────────────────────────

async function parse13F(cik: string, accNum: string): Promise<any[]> {
  const accNumNoDashes = accNum.replace(/-/g, '');
  const dirUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNumNoDashes}/index.json`;
  
  const dirRes = await fetch(dirUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!dirRes.ok) return [];
  const dirData = await dirRes.json();
  const files = dirData.directory.item.map((i: any) => i.name);
  
  const xmlFile = files.find((f: string) => f.endsWith('.xml') && f !== 'primary_doc.xml');
  if (!xmlFile) return [];
  
  const fileUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNumNoDashes}/${xmlFile}`;
  const xmlRes = await fetch(fileUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!xmlRes.ok) return [];
  const xmlText = await xmlRes.text();
  
  const infoTableRegex = /<infoTable[\s\S]*?>([\s\S]*?)<\/infoTable>/gi;
  const holdings = [];
  let match;
  while ((match = infoTableRegex.exec(xmlText)) !== null) {
    const content = match[1];
    const issuer = extractTagContent(content, 'nameOfIssuer');
    const classVal = extractTagContent(content, 'titleOfClass');
    const cusip = extractTagContent(content, 'cusip');
    const value = parseFloat(extractTagContent(content, 'value')) || 0;
    const shares = parseFloat(extractTagContent(content, 'sshPrnamt')) || 0;
    const option = extractTagContent(content, 'putCall') || 'None';
    
    holdings.push({ issuer, classVal, cusip, value, shares, option });
  }
  return holdings;
}

// ─── 10-K Section Extraction ───────────────────────────────────────────────────

function extractSectionText(html: string, itemName: string): string[] {
  let text = html.replace(/<\/?(?:div|p|tr|h1|h2|h3|h4|h5|h6|br)[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' '); // Strip all other tags
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&#160;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#8220;/g, '"')
             .replace(/&#8221;/g, '"')
             .replace(/&#8217;/g, "'");
             
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const startThreshold = itemName === '1' ? Math.floor(lines.length * 0.05) : Math.floor(lines.length * 0.10);
  let startIdx = -1;
  let endIdx = -1;
  
  if (itemName === '1') {
    for (let i = startThreshold; i < lines.length; i++) {
      const line = lines[i];
      if (/^Item\s+1\b/i.test(line) && /Business/i.test(line)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx !== -1) {
      for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^Item\s+1A\b/i.test(line) || /^Item\s+1B\b/i.test(line) || /^Item\s+2\b/i.test(line)) {
          endIdx = i;
          break;
        }
      }
    }
  } else if (itemName === '1A') {
    for (let i = startThreshold; i < lines.length; i++) {
      const line = lines[i];
      if (/^Item\s+1A\b/i.test(line) && /Risk\s+Factors/i.test(line)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx !== -1) {
      for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^Item\s+1B\b/i.test(line) || /^Item\s+2\b/i.test(line)) {
          endIdx = i;
          break;
        }
      }
    }
  } else if (itemName === '7') {
    for (let i = startThreshold; i < lines.length; i++) {
      const line = lines[i];
      if (/^Item\s+7\b/i.test(line) && /Management/i.test(line) && /Discussion/i.test(line)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx !== -1) {
      for (let i = startIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^Item\s+7A\b/i.test(line) || /^Item\s+8\b/i.test(line)) {
          endIdx = i;
          break;
        }
      }
    }
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return lines.slice(startIdx + 1, endIdx);
  }
  return [];
}

// ─── LCS Paragraph Diff ───────────────────────────────────────────────────────

function diffParagraphs(prev: string[], latest: string[]): EdgarRiskDiffParagraph[] {
  const n = prev.length;
  const m = latest.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (prev[i - 1] === latest[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: EdgarRiskDiffParagraph[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && prev[i - 1] === latest[j - 1]) {
      result.push({ status: 'unchanged', text: prev[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ status: 'added', text: latest[j - 1] });
      j--;
    } else {
      result.push({ status: 'removed', text: prev[i - 1] });
      i--;
    }
  }
  return result.reverse();
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
        const cik = await getCik(sym);
        const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`SEC API returned status ${res.status}`);
        const facts = await res.json();
        
        return {
          symbol: sym,
          incomeStatement: mapStatement(parseSecStatement(facts, INCOME_CONCEPTS)),
          balanceSheet: mapStatement(parseSecStatement(facts, BALANCE_CONCEPTS)),
          cashFlow: mapStatement(parseSecStatement(facts, CASHFLOW_CONCEPTS)),
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
        const cik = await getCik(sym);
        const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`SEC API returned status ${res.status}`);
        const sub = await res.json();
        
        const recent = sub.filings.recent;
        const forms = recent.form;
        const accNums = recent.accessionNumber;
        const docs = recent.primaryDocument;
        const dates = recent.filingDate;
        
        const form4Indices: number[] = [];
        for (let i = 0; i < forms.length; i++) {
          if (forms[i] === '4') {
            form4Indices.push(i);
            if (form4Indices.length === 15) break;
          }
        }
        
        const rawTransactions: any[] = [];
        await Promise.all(
          form4Indices.map(async (idx) => {
            try {
              const accNum = accNums[idx];
              const accNumNoDashes = accNum.replace(/-/g, '');
              const docName = docs[idx];
              const xmlName = path.basename(docName);
              const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNumNoDashes}/${xmlName}`;
              
              const xmlRes = await fetch(xmlUrl, { headers: { 'User-Agent': USER_AGENT } });
              if (!xmlRes.ok) return;
              const xmlContent = await xmlRes.text();
              
              const parsed = parseFilingXml(xmlContent, cik, accNum, docName, dates[idx]);
              rawTransactions.push(...parsed);
            } catch (err) {
              console.warn(`[EDGAR] Failed to parse Form 4 index ${idx}:`, err);
            }
          })
        );
        
        // Sort rawTransactions by date descending
        rawTransactions.sort((a, b) => b.date.localeCompare(a.date));

        const transactions = rawTransactions.map((tx: any): EdgarInsider => {
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
        let cik = cikOrSymbol.trim();
        if (!/^\d+$/.test(cik)) {
          cik = await getCik(cik);
        } else {
          cik = cik.padStart(10, '0');
        }

        const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`SEC API returned status ${res.status}`);
        const sub = await res.json();
        
        const recent = sub.filings.recent;
        const forms = recent.form;
        const accNums = recent.accessionNumber;
        
        const indices: number[] = [];
        for (let i = 0; i < forms.length; i++) {
          if (forms[i] === '13F-HR') {
            indices.push(i);
            if (indices.length === 2) break;
          }
        }

        let managerName = 'Unknown Asset Manager';
        const q = cikOrSymbol.toLowerCase();
        if (q === '0001067983' || q.includes('berkshire') || q.includes('buffett')) managerName = 'Berkshire Hathaway Inc';
        else if (q === '0001166559' || q.includes('gates') || q.includes('foundation')) managerName = 'Bill & Melinda Gates Foundation Trust';
        else if (q === '0001029160' || q.includes('soros')) managerName = 'Soros Fund Management LLC';
        else managerName = key.length <= 5 ? `${key} Portfolio Advisor Group` : `${key} Capital Management LLC`;

        if (indices.length === 0) {
          return { managerName, portfolioDate: '2026-03-31', holdings: [] };
        }

        const latestHoldings = await parse13F(cik, accNums[indices[0]]);
        const prevHoldings = indices.length > 1 ? await parse13F(cik, accNums[indices[1]]) : [];

        const prevMap = new Map<string, any>();
        for (const h of prevHoldings) {
          const k = `${h.cusip.toUpperCase()}:${h.option.toUpperCase()}`;
          prevMap.set(k, h);
        }

        const holdingsList: EdgarHolding[] = [];
        for (const h of latestHoldings) {
          const k = `${h.cusip.toUpperCase()}:${h.option.toUpperCase()}`;
          const prev = prevMap.get(k);
          
          let ticker = h.cusip.toUpperCase();
          if (cusipToTickerMap[ticker]) {
            ticker = cusipToTickerMap[ticker];
          }

          let qoqChange = '0.0%';
          if (!prev) {
            qoqChange = 'New';
          } else {
            const sharesChange = h.shares - prev.shares;
            if (prev.shares > 0) {
              const pct = (sharesChange / prev.shares) * 100;
              if (pct > 0.05) {
                qoqChange = `+${pct.toFixed(1)}%`;
              } else if (pct < -0.05) {
                qoqChange = `${pct.toFixed(1)}%`;
              }
            }
          }

          holdingsList.push({
            ticker: ticker,
            name: h.issuer || 'Unknown Issuer',
            value: Math.round(h.value),
            shares: h.shares,
            option: h.option || 'None',
            qoqChange,
          });
        }

        holdingsList.sort((a, b) => b.value - a.value);
        return { managerName, portfolioDate: '2026-03-31', holdings: holdingsList };
      }
    );
  },

  getSection: async (symbol: string, item: string): Promise<EdgarSectionResponse> => {
    const sym = symbol.toUpperCase();
    const cleanItem = item.toUpperCase().replace('ITEM', '').trim();
    const finalItem = cleanItem === '1' ? '1' : cleanItem === '1A' ? '1A' : '7';
    
    return cachedFetch<EdgarSectionResponse>(
      `sec:${sym}:${finalItem}`,
      `section:${sym}:${finalItem}`,
      SQLITE_TTL.section,
      async () => {
        const cik = await getCik(sym);
        const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`SEC API returned status ${res.status}`);
        const sub = await res.json();
        
        const recent = sub.filings.recent;
        const forms = recent.form;
        const accNums = recent.accessionNumber;
        const docs = recent.primaryDocument;
        
        const idx = forms.indexOf('10-K');
        if (idx === -1) {
          throw new Error(`No 10-K filings found for ${sym}`);
        }
        
        const accNumNoDashes = accNums[idx].replace(/-/g, '');
        const primaryDoc = docs[idx];
        const docUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNumNoDashes}/${primaryDoc}`;
        
        const docRes = await fetch(docUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!docRes.ok) throw new Error(`Failed to fetch 10-K document for ${sym}`);
        const html = await docRes.text();
        
        const paragraphs = extractSectionText(html, finalItem);
        return {
          symbol: sym,
          section: finalItem,
          title: finalItem === '1' ? 'Item 1. Business' : finalItem === '1A' ? 'Item 1A. Risk Factors' : "Item 7. Management's Discussion and Analysis (MD&A)",
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
        const cik = await getCik(sym);
        const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) throw new Error(`SEC API returned status ${res.status}`);
        const sub = await res.json();
        
        const recent = sub.filings.recent;
        const forms = recent.form;
        const accNums = recent.accessionNumber;
        const docs = recent.primaryDocument;
        
        const indices: number[] = [];
        for (let i = 0; i < forms.length; i++) {
          if (forms[i] === '10-K') {
            indices.push(i);
            if (indices.length === 2) break;
          }
        }
        
        if (indices.length === 0) {
          return { symbol: sym, paragraphs: [] };
        }
        
        const getFilingParagraphs = async (idx: number) => {
          const accNum = accNums[idx];
          const accNumNoDashes = accNum.replace(/-/g, '');
          const docName = docs[idx];
          const docUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNumNoDashes}/${docName}`;
          const docRes = await fetch(docUrl, { headers: { 'User-Agent': USER_AGENT } });
          if (!docRes.ok) return [];
          const html = await docRes.text();
          return extractSectionText(html, '1A');
        };
        
        const latestParagraphs = await getFilingParagraphs(indices[0]);
        if (indices.length === 1) {
          return {
            symbol: sym,
            paragraphs: latestParagraphs.map(p => ({ status: 'unchanged' as const, text: p }))
          };
        }
        
        const prevParagraphs = await getFilingParagraphs(indices[1]);
        const paragraphs = diffParagraphs(prevParagraphs, latestParagraphs);
        return { symbol: sym, paragraphs };
      }
    );
  },
};

// ─── Background pre-fetch ────────────────────────────────────────────────────

export function prefetchEdgar(symbol: string): void {
  const sym = symbol.toUpperCase();

  if (memCache.get(`fin:${sym}`) !== undefined) return;

  const existing = sqliteGet(`financials:${sym}`, SQLITE_TTL.financials);
  if (existing !== null) return;

  if (inFlight.has(`fin:${sym}`)) return;

  console.log(`[EDGAR PREFETCH] Background warming cache for: ${sym}`);

  Promise.allSettled([
    edgarService.getFinancials(sym),
    edgarService.getInsiders(sym),
  ]).then((results) => {
    const ok = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[EDGAR PREFETCH] ${sym}: ${ok}/2 tasks completed successfully`);
  });
}
