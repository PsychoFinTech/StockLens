# StockLens

**Full-stack equities research dashboard** for quotes, charts, fundamentals, stock screening, SEC filings, congressional trading activity, and macro indicators.

StockLens is a single-process app built with **React, Express, TypeScript, and SQLite**. It prefers real data, caches aggressively, and shows honest unavailable states when live data cannot be fetched.

---

## Features

* **Watchlist dashboard** for tracking selected tickers
* **Company pages** with overview, charts, financial statements, ratios, analysis, and SEC data
* **Stock screener** with filters for exchange, sector, market cap, valuation, profitability, and leverage
* **Market dashboard** with indices, movers, breakouts, and sector performance
* **SEC tools** for insider trades, institutional holdings, proxy statements, and filing sections
* **Congressional trading** disclosures
* **Macro indicators** powered by FRED
* **Search** with fast autocomplete over the local stock index
* **Caching-first behavior** so the app remains usable when external APIs rate-limit or fail

---

## Why StockLens

Most retail investing dashboards either hide their data sources or quietly invent values when live APIs fail. StockLens does the opposite:

* it prefers **real data**,
* it **caches** results to reduce API pressure,
* and it shows **no-data / unavailable states** instead of fake placeholders.

### Design Philosophy
StockLens is strictly designed as a **single-process, single-user tool**. Authentication, user management, and multi-tenancy are explicitly out of scope. It is meant to be run locally or deployed for personal use.

That makes it better suited for research, debugging, and portfolio work.

---

## Data Sources

| Source                  | Used for                                                                            | Auth                                |
| ----------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| Yahoo Finance           | Quotes, historical candles, profiles, financial statements, peers, news             | None                                |
| SEC EDGAR               | 10-K / 10-Q sections, Form 4 insider trades, 13F holdings, DEF 14A proxy statements | None, compliant User-Agent required |
| Financial Modeling Prep | Congressional trading disclosures                                                   | API key                             |
| FRED                    | Macro indicators such as rates, CPI, unemployment, GDP                              | API key                             |

---

## Architecture

```text
React UI
   ↓
Express API
   ↓
Cache Layer
   ↓
SQLite Backup
   ↓
External Data Sources
```

### Repository structure

```text
/server
  /routes      API routes for quotes, charts, screener, market, news, search, watchlist, edgar, macro
  /services    Data fetching, caching, database helpers, cron jobs
  /middleware  Rate limiting and error handling

/src
  /pages       Main app pages
  /components  Shared UI components
  /hooks       React Query data hooks
  /utils       Formatters and helpers
```

### Storage

SQLite is used for:

* stock universe seed data
* cached quotes
* cached fundamentals
* watchlist data
* cache logs
* SEC filing cache

---

## Getting Started

### Prerequisites

* Node.js 22+ recommended
* npm
* Optional API keys for FRED and Financial Modeling Prep

### Install

```bash
npm install
cp .env.example .env
npm run dev
```

### Production build

```bash
npm run build
npm start
```

### Type checking

```bash
npm run lint
```

---

## Environment Variables

```env
FRED_API_KEY=
FMP_API_KEY=
PORT=3000
SQLITE_DB_PATH=./stocklens.db
```

Notes:

* The app runs without API keys, but FRED and congressional trading pages will show unavailable states.
* `SQLITE_DB_PATH` is optional and defaults to a local database file.

---

## Scripts

```bash
npm run dev      # Start the full-stack dev server
npm run build    # Build client and server for production
npm start        # Run the production server
npm run lint     # TypeScript type check
npm run clean    # Remove build artifacts
```

---

## Reliability Notes

StockLens uses a simple data waterfall:

1. in-memory cache for speed
2. SQLite backup for persistence
3. live fetch for fresh data
