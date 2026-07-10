# DCF Calculator Feature — Implementation Plan

## Overview

Add an interactive Discounted Cash Flow (DCF) intrinsic-value calculator to StockLens's CompanyPage. The calculator auto-populates inputs from existing free data sources (Yahoo Finance + FRED), lets users override every assumption, and produces a fair-value estimate with sensitivity analysis — all computed client-side with no paid API dependencies.

---

## 1. Data Sources (all free, already in the codebase)

### Yahoo Finance (via `yahoo-finance2` — `server/services/yahoo.ts`)

| Data point | Where it lives today | Yahoo module |
|---|---|---|
| Free Cash Flow (historical, 3-5yr) | `getFinancials()` → `cashflowStatementHistory` | `cashflowStatementHistory` |
| Revenue & Net Income (historical) | `getFinancials()` → `incomeStatementHistory` | `incomeStatementHistory` |
| Total Debt, Cash & Equivalents | `getBasicFinancials()` → `metric.totalDebt`, `metric.totalCash` | `financialData` |
| Shares Outstanding | `getBasicFinancials()` → `metric.sharesOutstanding` | `defaultKeyStatistics` |
| Current Price | `getQuote()` → `price` | `quote` |
| Beta | **NEW** — add to `getBasicFinancials()` | `defaultKeyStatistics.beta` |
| EPS (TTM) | `getBasicFinancials()` → `metric.epsBasicExclExtraItemsTTM` | `defaultKeyStatistics` |
| Revenue Growth (YoY) | `getBasicFinancials()` → `metric.revenueGrowth` | `financialData` |
| Analyst Growth Estimate (5yr) | **NEW** — `earningsTrend` module | `earningsTrend` (contains `+1y`, `+5y` growth) |
| WACC components (D/E, interest) | debt from `financialData`, interest expense from income statement | existing modules |
| CapEx (historical) | `getFinancials()` → `cashflowStatementHistory` → `capitalExpenditures` | `cashflowStatementHistory` |

### FRED API (`server/services/fred.ts`)

| Data point | Series ID | Purpose |
|---|---|---|
| Risk-Free Rate (10-Year Treasury) | `DGS10` | Already in `ALLOWED_SERIES` — used for WACC calculation |

### Derived (computed server-side or client-side)

| Data point | Derivation |
|---|---|
| FCF CAGR (3yr, 5yr) | Computed from historical FCF array |
| WACC | `(E/V) * Re + (D/V) * Rd * (1 - Tc)` where `Re = Rf + β(Rm - Rf)` |
| Terminal Value | `FCF_n * (1 + g) / (WACC - g)` |
| Intrinsic Value per Share | `(PV of projected FCFs + PV of Terminal Value - Net Debt) / Shares Outstanding` |

---

## 2. Backend Changes

### 2a. New route: `server/routes/dcf.ts`

Single endpoint: `GET /api/dcf/:symbol`

Aggregates all DCF inputs into one response to minimize frontend round-trips:

```ts
interface DCFInputsResponse {
  symbol: string;
  companyName: string;
  currentPrice: number;
  sharesOutstanding: number;
  
  // Historical FCF (oldest → newest, up to 5 years)
  historicalFCF: { year: number; value: number }[];
  
  // Historical Revenue (for growth-rate derivation)
  historicalRevenue: { year: number; value: number }[];
  
  // Balance sheet snapshot (latest)
  totalDebt: number | null;
  cashAndEquivalents: number | null;
  
  // WACC building blocks
  beta: number | null;             // from Yahoo defaultKeyStatistics
  riskFreeRate: number | null;     // 10yr Treasury from FRED DGS10
  marketCap: number | null;
  interestExpense: number | null;  // from income statement
  taxRate: number | null;          // effectiveTaxRate or incomeTaxExpense/pretaxIncome
  
  // Analyst consensus (optional, may be null)
  analystGrowthEstimate5yr: number | null;  // from earningsTrend
  
  // Metadata
  currency: string;                // USD, INR, etc.
  lastFiscalYear: number;
  dataFreshness: string;           // ISO timestamp
}
```

**Implementation details:**
- Reuse existing `yahooService.getFinancials()`, `yahooService.getBasicFinancials()`, `yahooService.getQuote()`, and `fredService.getSeries('DGS10')`.
- Add `earningsTrend` to the `quoteSummary` modules list in a new `yahooService.getGrowthEstimates()` method (or extend `getBasicFinancials`).
- Extract `beta` from `defaultKeyStatistics.beta` (the module is already fetched in `getBasicFinancials`, just not mapped).
- Extract `interestExpense` and `effectiveTaxRate` from the income statement (already fetched, just unmapped fields).
- Cache with same TTL as fundamentals (`CACHE_TTLS.FUNDAMENTALS`).
- Apply existing circuit-breaker and deduplication patterns.

### 2b. Extend `server/services/yahoo.ts`

Add to the `getBasicFinancials()` mapped output:
```ts
beta: ks.beta || null,
interestExpense: null,       // populated from incomeStatement if available
effectiveTaxRate: null,       // populated from financialData
```

Add a new method or extend `getFinancials()` to include `earningsTrend`:
```ts
getGrowthEstimates: async (symbol: string) => {
  const result = await quoteSummaryBreaker.fire(symbol, {
    modules: ['earningsTrend']
  });
  // Extract the +5y annual growth estimate
  const trends = result?.earningsTrend?.trend || [];
  const fiveYear = trends.find(t => t.period === '+5y');
  return {
    growthEstimate5yr: fiveYear?.growth || null
  };
}
```

### 2c. Register the route

In `server.ts`, add:
```ts
import dcfRouter from './server/routes/dcf.js';
// ...
app.use('/api', dcfRouter);
```

---

## 3. Frontend Changes

### 3a. New component: `src/pages/CompanyPage/DCFCalculator.tsx`

This is the main interactive panel. It renders inside the AnalysisTab (or as its own sub-tab).

**Layout (single scrollable card):**

```
┌─────────────────────────────────────────────────────────┐
│  DCF Intrinsic Value Calculator                         │
│  ─────────────────────────────────────────────────────── │
│                                                         │
│  RESULT BANNER                                          │
│  Fair Value: $185.42   Current: $348.16   ▼ 47% Overval │
│                                                         │
│  ─── ASSUMPTIONS (editable) ────────────────────────── │
│                                                         │
│  Growth & Projections                                   │
│  ┌──────────────────┬─────────────┬───────────────────┐ │
│  │ Revenue Growth %  │ [  12.5 ]  │ Auto: 14.5% CAGR  │ │
│  │ FCF Margin %      │ [  18.2 ]  │ Auto: from hist.   │ │
│  │ Projection Years  │ [  5   ]   │ 5-10 years         │ │
│  │ Terminal Growth %  │ [  2.5 ]  │ GDP proxy          │ │
│  └──────────────────┴─────────────┴───────────────────┘ │
│                                                         │
│  Discount Rate (WACC)                                   │
│  ┌──────────────────┬─────────────┬───────────────────┐ │
│  │ Risk-Free Rate %  │ [  4.25 ]  │ Auto: 10yr Treas.  │ │
│  │ Equity Risk Prem  │ [  5.50 ]  │ Default: 5.5%      │ │
│  │ Beta              │ [  1.08 ]  │ Auto: Yahoo         │ │
│  │ Cost of Debt %    │ [  3.80 ]  │ Auto: intExp/debt   │ │
│  │ Tax Rate %        │ [  21.0 ]  │ Auto: eff. tax rate │ │
│  │ → Computed WACC   │    10.2%   │                     │ │
│  └──────────────────┴─────────────┴───────────────────┘ │
│                                                         │
│  ─── PROJECTED FREE CASH FLOWS ────────────────────── │
│                                                         │
│  Year │ Revenue    │ FCF         │ Discounted FCF       │
│  2026 │ $453.2B    │ $82.5B      │ $74.9B               │
│  2027 │ $509.8B    │ $92.8B      │ $76.4B               │
│  ...  │ ...        │ ...         │ ...                   │
│  TV   │            │ $2,140.5B   │ $1,297.3B            │
│                                                         │
│  ─── VALUATION BRIDGE ──────────────────────────────── │
│                                                         │
│  PV of Projected FCFs     $398.2B                       │
│  + PV of Terminal Value   $1,297.3B                     │
│  = Enterprise Value       $1,695.5B                     │
│  − Net Debt               ($36.7B)                      │
│  = Equity Value           $1,658.8B                     │
│  ÷ Shares Outstanding     12.16B                        │
│  = Fair Value / Share     $136.38                       │
│                                                         │
│  ─── SENSITIVITY TABLE ─────────────────────────────── │
│                                                         │
│  WACC ↓ \ Terminal Growth → │  1.5%  │  2.5%  │  3.5%  │
│  ────────────────────────────┼────────┼────────┼────────│
│   8.0%                       │ $198   │ $245   │ $322   │
│   9.0%                       │ $168   │ $201   │ $252   │
│  10.0%                       │ $145   │ $170   │ $205   │
│  11.0%                       │ $127   │ $146   │ $172   │
│  12.0%                       │ $113   │ $128   │ $148   │
│                                                         │
│  [Reset to Defaults]                                    │
└─────────────────────────────────────────────────────────┘
```

### 3b. Core computation logic: `src/utils/dcfCalculator.ts`

Pure functions, no side effects, fully testable:

```ts
interface DCFInputs {
  // Growth
  revenueGrowthRate: number;    // decimal (0.125 = 12.5%)
  fcfMargin: number;            // decimal
  projectionYears: number;      // 5-10
  terminalGrowthRate: number;   // decimal (0.025 = 2.5%)
  
  // WACC components
  riskFreeRate: number;
  equityRiskPremium: number;
  beta: number;
  costOfDebt: number;
  taxRate: number;
  marketCap: number;
  totalDebt: number;
  
  // Valuation
  latestRevenue: number;
  cashAndEquivalents: number;
  sharesOutstanding: number;
}

interface DCFResult {
  wacc: number;
  costOfEquity: number;
  projectedYears: {
    year: number;
    revenue: number;
    fcf: number;
    discountedFcf: number;
  }[];
  terminalValue: number;
  pvTerminalValue: number;
  pvFcfSum: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  fairValuePerShare: number;
  
  // Margin of safety
  currentPrice: number;
  upsidePercent: number;
}

function computeWACC(inputs: DCFInputs): number;
function computeDCF(inputs: DCFInputs, currentPrice: number): DCFResult;
function computeSensitivityTable(
  baseInputs: DCFInputs,
  currentPrice: number,
  waccRange: number[],
  terminalGrowthRange: number[]
): number[][];
```

### 3c. Auto-populate defaults

When the `/api/dcf/:symbol` response arrives, derive intelligent defaults:

| Assumption | Auto-population logic |
|---|---|
| Revenue Growth % | 3-year revenue CAGR from historical data. Cap at 30% for sanity. |
| FCF Margin % | Average FCF/Revenue over last 3 years. Floor at 0%. |
| Projection Years | Default 5. |
| Terminal Growth % | FRED GDP growth (GDPC1 latest YoY) capped at 3%. Default 2.5%. |
| Risk-Free Rate | Latest FRED DGS10 observation. |
| Equity Risk Premium | Hardcoded 5.5% (Damodaran long-run average). |
| Beta | Yahoo `defaultKeyStatistics.beta`. Fallback 1.0. |
| Cost of Debt | `interestExpense / totalDebt`. Fallback to risk-free + 1.5%. |
| Tax Rate | `effectiveTaxRate` from Yahoo. Fallback 21% (US statutory). |

### 3d. React Query hook: `src/pages/CompanyPage/hooks/useDCFData.ts`

```ts
export function useDCFData(symbol: string) {
  return useQuery({
    queryKey: ['dcf-inputs', symbol],
    queryFn: () => apiClient.get(`/api/dcf/${symbol}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!symbol
  });
}
```

### 3e. Integration into CompanyPage

Add "DCF Calculator" as a collapsible section within `AnalysisTab.tsx`, placed after the peer comparison grid. It appears as a card with a "Calculate Intrinsic Value" button that expands into the full calculator panel on click. This avoids a new top-level tab while keeping it discoverable.

---

## 4. Edge Cases & Guardrails

| Scenario | Handling |
|---|---|
| Negative FCF (all historical years) | Show a warning banner: "This company has negative free cash flow — DCF may not be meaningful." Still allow computation. |
| Financial-sector stocks (banks, insurers) | Show a warning: "DCF is less reliable for financial institutions — consider Dividend Discount or Excess Return models." |
| No analyst growth estimate available | Fall back to revenue CAGR. If that's also unavailable, default to GDP growth rate. |
| WACC < Terminal Growth Rate | Block computation, show error: "Terminal growth rate must be below the discount rate." |
| Shares outstanding = 0 or null | Show error: "Cannot compute per-share value — shares outstanding data unavailable." |
| Indian stocks (INR) | Use INR formatting; use India 10-year govt bond yield (hardcoded ~7.1% or add RBI series) instead of US Treasury for risk-free rate. |
| Missing Beta | Default to 1.0 with a note. |
| Extremely high growth rate entered (>50%) | Show amber warning but allow it — user override is king. |

---

## 5. Testing

### Unit tests (`server/routes/__tests__/dcf.test.ts`)

- Verify `/api/dcf/AAPL` returns all required fields with correct types.
- Verify fallback behavior when Yahoo modules return partial data.
- Verify FRED rate is fetched and included.

### Computation tests (`src/utils/__tests__/dcfCalculator.test.ts`)

- Known-answer test: given fixed inputs, verify WACC, PV of FCFs, terminal value, and fair value match hand-calculated values.
- Edge: WACC = terminal growth → should throw/return error.
- Edge: negative FCF → should still compute (negative fair value is valid).
- Sensitivity table dimensions match input ranges.

### Integration test

- Mount `DCFCalculator` with mocked API data, verify all fields render.
- Change an input slider, verify the result updates reactively.

---

## 6. File Manifest

```
NEW FILES:
  server/routes/dcf.ts                              — API endpoint
  src/pages/CompanyPage/DCFCalculator.tsx            — Main UI component
  src/pages/CompanyPage/hooks/useDCFData.ts          — React Query hook
  src/utils/dcfCalculator.ts                         — Pure computation logic
  server/routes/__tests__/dcf.test.ts                — Backend tests
  src/utils/__tests__/dcfCalculator.test.ts          — Computation tests

MODIFIED FILES:
  server.ts                                          — Register dcfRouter
  server/services/yahoo.ts                           — Add beta mapping, getGrowthEstimates()
  src/pages/CompanyPage/AnalysisTab.tsx              — Add DCFCalculator section
```

---

## 7. Implementation Order

1. **`src/utils/dcfCalculator.ts`** — Pure math, zero dependencies. Write and unit-test first.
2. **`server/services/yahoo.ts`** — Add beta + earningsTrend extraction.
3. **`server/routes/dcf.ts`** — Wire the aggregation endpoint.
4. **`server.ts`** — Register the route.
5. **`src/pages/CompanyPage/hooks/useDCFData.ts`** — Hook for the new endpoint.
6. **`src/pages/CompanyPage/DCFCalculator.tsx`** — Build the UI panel.
7. **`src/pages/CompanyPage/AnalysisTab.tsx`** — Mount the calculator.
8. **Tests** — Backend + computation + smoke.

---

## 8. Non-Goals (explicitly out of scope)

- **Multi-stage DCF** (different growth rates for stages 1/2/3) — keep it single-stage for v1; can be added later.
- **Monte Carlo simulation** — interesting but adds complexity without proportional user value in v1.
- **Saving/exporting DCF scenarios** — no persistence layer needed; ephemeral calculations are fine.
- **Comparing DCF across multiple tickers** — the existing `/compare` page can eventually link to per-stock DCFs, but not in this PR.
