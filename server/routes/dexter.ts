import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const GATEWAY_URL   = process.env.DEXTER_GATEWAY_URL ?? 'http://127.0.0.1:4100';
const INTERNAL_KEY  = process.env.DEXTER_INTERNAL_KEY ?? 'default-internal-secret-for-dexter-stocklens';
const PROXY_TIMEOUT = 15_000; // 15 s — if the gateway hasn't responded at all by now, it's not running

router.post('/chat', apiLimiter, async (req, res, next) => {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

  try {
    const upstream = await fetch(`${GATEWAY_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_KEY,
      },
      body:   JSON.stringify(req.body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!upstream.body) {
      res.end();
      return;
    }

    for await (const chunk of upstream.body as any) {
      res.write(chunk);
    }
    res.end();

  } catch (err: any) {
    clearTimeout(timeoutId);

    const isAborted   = err?.name === 'AbortError';
    const isRefused   = err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED';

    if (isAborted) {
      return res.status(504).json({
        error: 'Dexter gateway did not respond within 15 seconds. It may be starting up — try again shortly.',
      });
    }

    if (isRefused) {
      return res.status(503).json({
        error: `Dexter gateway is not running. Start it with: npm run dexter:gateway`,
      });
    }

    // Unexpected error — let the global Express error handler deal with it
    next(err);
  }
});

export default router;
