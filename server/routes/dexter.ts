import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/chat', apiLimiter, async (req, res, next) => {
  try {
    const upstream = await fetch(`${process.env.DEXTER_GATEWAY_URL || 'http://127.0.0.1:4100'}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.DEXTER_INTERNAL_KEY || 'default-internal-secret-for-dexter-stocklens',
      },
      body: JSON.stringify(req.body),
    });
    
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
  } catch (error) {
    next(error);
  }
});

export default router;
