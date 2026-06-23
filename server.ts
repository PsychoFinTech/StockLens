import cluster from 'cluster';
import os from 'os';
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import compression from 'compression';
import pino from 'pino';
import pinoHttp from 'pino-http';

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
import hedgefundRouter from './server/routes/hedgefund.js';
import db from './server/services/db.js';

import { initCronJobs } from './server/services/cron.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { prefetchEdgar } from './server/services/edgar.js';
import { warmAllRatios } from './server/services/ratiosWarmer.js';

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.set('trust proxy', 1);

  let allowedOrigins: boolean | string[] = true;
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CLIENT_URL) {
      console.warn('[SECURITY] No CLIENT_URL provided in production. CORS is heavily restricted.');
      allowedOrigins = [];
    } else {
      allowedOrigins = [process.env.CLIENT_URL];
    }
  }
  app.use(cors({ origin: allowedOrigins }));
  
  app.use(compression({ threshold: 1024 }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  // Health endpoint
  app.get('/health', (req, res) => {
    const dbOk = (() => { try { db.prepare('SELECT 1').get(); return true; } catch { return false; } })();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });

  // Global cache headers middleware
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    
    // Quotes: short TTL
    if (req.path.startsWith('/api/quote') || req.path.startsWith('/api/market')) {
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
    // Edgar: immutable
    else if (req.path.startsWith('/api/edgar')) {
      res.set('Cache-Control', 'public, max-age=604800, immutable');
    }
    // Screener: private, very short
    else if (req.path.startsWith('/api/screener')) {
      res.set('Cache-Control', 'private, max-age=60');
    }
    // Fundamentals/Charts: long TTL
    else if (req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
    next();
  });

  app.use('/api/search', searchRouter);
  app.use('/api/quote', quotesRouter);
  app.use('/api', fundamentalsRouter); 
  app.use('/api/edgar', edgarRouter);
  app.use('/api/chart', chartsRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/screener', screenerRouter);
  app.use('/api/market', marketRouter);
  app.use('/api/watchlist', watchlistRouter);
  app.use('/api/macro', macroRouter);
  app.use('/api/hedge-fund', hedgefundRouter);

  // Only init cron in worker 1 (or standalone)
  if (!cluster.isWorker || cluster.worker?.id === 1) {
    initCronJobs();
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[SERVER] Worker ${process.pid} listening at http://localhost:${PORT}`);

    if (!cluster.isWorker || cluster.worker?.id === 1) {
      setTimeout(() => {
        warmAllRatios().catch((err) => logger.error({ err }, '[STARTUP RATIOS WARMER ERROR]'));
      }, 30000);

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
        setTimeout(warmNext, 8000);
      }, 90000);
    }
  });
}

// Clustering setup
if (process.env.NODE_ENV === 'production' && cluster.isPrimary && process.env.CLUSTER === 'true') {
  const numCPUs = os.cpus().length;
  // Fallback to console.log since logger might not be fully configured in primary yet
  console.log(`[CLUSTER] Primary ${process.pid} spawning ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.warn(`[CLUSTER] Worker ${worker.process.pid} died. Respawning...`);
    cluster.fork();
  });
} else {
  startServer().catch((error) => {
    console.error('[FATAL SERVER START ERROR]', error);
  });
}
