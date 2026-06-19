import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Import custom backend files
import searchRouter from './server/routes/search.js';
import quotesRouter from './server/routes/quotes.js';
import fundamentalsRouter from './server/routes/fundamentals.js';
import chartsRouter from './server/routes/charts.js';
import newsRouter from './server/routes/news.js';
import screenerRouter from './server/routes/screener.js';
import marketRouter from './server/routes/market.js';
import watchlistRouter from './server/routes/watchlist.js';
import edgarRouter from './server/routes/edgar.js';
import macroRouter from './server/routes/macro.js';

import { initCronJobs } from './server/services/cron.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { prefetchEdgar } from './server/services/edgar.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Let Express rate-limiter trust the reverse proxy headers
  app.set('trust proxy', 1);

  // Set up standard parsers
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  console.log('[SERVER] Mounting API endpoints...');
  app.use('/api/search', searchRouter);
  app.use('/api/quote', quotesRouter);
  app.use('/api', fundamentalsRouter); // mounts /profile, /financials, /ratios, /peers
  app.use('/api/edgar', edgarRouter);  // mounts /financials, /insiders, /holdings, /section, /risk-diff
  app.use('/api/chart', chartsRouter);
  app.use('/api/news', newsRouter);     // mounts /market, /:symbol
  app.use('/api/screener', screenerRouter);
  app.use('/api/market', marketRouter); // mounts /indices, /movers, /sectors
  app.use('/api/watchlist', watchlistRouter); // mounts /, /add, /:symbol
  app.use('/api/macro', macroRouter);

  // Initialize node-cron cache prewarming
  initCronJobs();

  // Development vs Production Hosting Mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SERVER] Bundling Vite Development Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    // Let Viteware handle static files and standard client routing
    app.use(vite.middlewares);
  } else {
    console.log('[SERVER] Launching Static Production File Server...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Wildcard fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Interceptor (must mount last)
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] StockLens is actively listening at http://localhost:${PORT}`);

    // Pre-warm EDGAR cache for top 25 most-visited stocks.
    // Starts 90s after boot (server is fully ready), staggered 8s apart.
    // After first run these are persisted in SQLite and will be instant on all future visits.
    const TOP_STOCKS = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
      'META', 'TSLA', 'JPM', 'V', 'JNJ',
      'WMT', 'XOM', 'NFLX', 'AMD', 'INTC',
      'BAC', 'DIS', 'GS', 'MA', 'PYPL',
      'QCOM', 'AVGO', 'CRM', 'ORCL', 'IBM'
    ];
    let warmIdx = 0;
    setTimeout(function warmNext() {
      if (warmIdx >= TOP_STOCKS.length) return;
      prefetchEdgar(TOP_STOCKS[warmIdx++]);
      setTimeout(warmNext, 8000); // 8s gap between each to be polite to SEC EDGAR
    }, 90000); // start 90s after server ready
  });
}

startServer().catch((error) => {
  console.error('[FATAL SERVER START ERROR]', error);
});
