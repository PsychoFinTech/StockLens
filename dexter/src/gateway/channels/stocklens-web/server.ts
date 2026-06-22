import express from 'express';
import { runAgentForMessage } from '../../agent-runner.js';

const app = express();
app.use(express.json());

// Internal-only auth: StockLens backend calls this with a shared secret,
// it is never exposed directly to the browser.
app.use((req, res, next) => {
  const internalKey = process.env.DEXTER_INTERNAL_KEY || 'default-internal-secret-for-dexter-stocklens';
  if (req.headers['x-internal-key'] !== internalKey) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

// POST /chat — SSE stream of agent events, ending with the final answer
app.post('/chat', async (req, res) => {
  const defaultModel = process.env.MODEL || 'gemma-4-31b-it';
  const { query, sessionKey, model = defaultModel, modelProvider = 'google' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const answer = await runAgentForMessage({
      sessionKey,
      query,
      model,
      modelProvider,
      channel: 'stocklens-web',
      onEvent: send,
    });
    res.write(`data: ${JSON.stringify({ type: 'done', answer })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`);
  } finally {
    res.end();
  }
});

const port = process.env.DEXTER_GATEWAY_PORT || 4100;
app.listen(port, () => {
  console.log(`[DEXTER GATEWAY] StockLens Web Channel listening on port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
