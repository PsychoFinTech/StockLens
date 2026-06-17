# StockLens — Equities Analysis & Charting Engine

**StockLens** is a production-grade, highly-performant global equities research, charting, and stock screening platform inspired by Finology Ticker. Powered by a hybrid full-stack TypeScript architecture, it features a lightning-fast SQLite local store mapped with progressive waterfalled API resolvers for Finnhub, Yahoo, and Alpha Vantage, maintaining robust uptime under free API key usage.

---

## 🎨 Visual Identity & Aesthetic Principles

- **Swiss Slate Theme**: Styled with a minimal, high-contrast light layout, using generous negative space, soft gray borders (`border-gray-150`), and solid dark text pairing elegantly with an active emerald brand accent color.
- **Aesthetic Pairings**: Prominent use of the robust `Inter` sans-serif typeface for readable content paired with `JetBrains Mono` for precise multi-market numbers, percentage symbols, and trading indicators.
- **Responsive Touch Design**: Optimized for standard desktop views as well as narrow mobile screens, providing custom horizontal scroll indicators and at least `44px` touch target bounding boxes.

---

## 🚀 Core Features

### 💻 Hybrid Data Integration (Waterfall Engine)
- **Level 1**: Fetches live equity prices & charts from **Finnhub Core API**.
- **Level 2**: Pulls comparative valuation metrics & financials using scraper layers from **Yahoo Finance**.
- **Level 3**: Integrates global data backups on smaller equities using **Alpha Vantage**.
- **Local Persistence Backup**: Persists quote changes in an active `better-sqlite3` database, providing instant fallback response buffers if live keys hit rate-limits.

### ⭐ Structured Watchlist Layout
- **Trading Dashboard**: Curated root hub landing view displaying a live grid of starred assets alongside corporate market news bulletins.
- **Instant Seeding**: Includes quick-add indicators to let first-time users seed MSFT, TSLA, AAPL, NVDA, and RELIANCE in a single click.

### 🔍 Auto-Complete Search
- Instantly matches search inputs against indexed local SQLite stock tables with rapid, low-latency, and progressive Finnhub global searches.

### 📊 Advanced Multi-Filter Screener
- **Sector Heatmap cards**: Features an interactive heatmap sector selector at the top; clicking blocks applies immediate sector filtering to the main tabular results.
- **Advanced Selectors**: Filter securities by Exchange (NASDAQ, NYSE, NSE, LSE, XETRA, TSE) or category, with responsive client-side pagination and column sorting.

---

## 🛠️ Architecture and Setup

### Directory Layout
- `/server/routes/` - Standard Express routers: screener, market, search, charts, watchlist, news.
- `/server/services/` - Core database setups, caches, cron schedulers, and API proxies.
- `/src/components/` - Highly cohesive widgets: Chart, Table, StockCard, Ticker, SearchBar, Skeleton.
- `/src/pages/` - Views: Watchlist Hub, Screener, Markets, Company Analytics.

### Running Development Server
```bash
npm run dev
```

### Building for Production hosting
```bash
npm run build
```
This produces client static layers and bundles the backend server into a single portable ESM/CJS asset inside `/dist`.
