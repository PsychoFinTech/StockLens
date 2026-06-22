import express from 'express';
import { runAgentForMessage } from '../../agent-runner.js';

// ── Boot-time env validation ──────────────────────────────────────────────────
// Fail fast with a clear message rather than hanging silently on the first request.
const MODEL_PROVIDER = process.env.MODEL_PROVIDER || 'google';
const PROVIDER_KEY_MAP: Record<string, string> = {
  google: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};
const requiredKey = PROVIDER_KEY_MAP[MODEL_PROVIDER] ?? `${MODEL_PROVIDER.toUpperCase()}_API_KEY`;
if (!process.env[requiredKey] && !(MODEL_PROVIDER === 'google' && process.env.GEMINI_API_KEYS)) {
  console.error(
    `[DEXTER GATEWAY] FATAL: MODEL_PROVIDER is "${MODEL_PROVIDER}" but ${requiredKey} is not set.\n` +
    `Set it in your .env file and restart the gateway.`
  );
  process.exit(1);
}

const AGENT_TIMEOUT_MS = 90_000; // 90 s — long enough for multi-tool chains, short enough to not hang forever

const app = express();
app.use(express.json());

// ── Internal-only auth ────────────────────────────────────────────────────────
// StockLens backend calls this with a shared secret; never exposed directly to the browser.
const INTERNAL_KEY = process.env.DEXTER_INTERNAL_KEY || 'default-internal-secret-for-dexter-stocklens';
app.use((req, res, next) => {
  if (req.path === '/health') return next(); // health check is unauthenticated
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── POST /chat — SSE stream of agent events ───────────────────────────────────
app.post('/chat', async (req, res) => {
  const { query, sessionKey, model, modelProvider } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Missing or empty "query" field.' });
  }

  const resolvedModel    = model    || process.env.MODEL    || 'gemma-4-31b-it';
  const resolvedProvider = modelProvider || MODEL_PROVIDER;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: object) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Agent timeout — avoids an indefinite SSE connection if the model stalls.
  const timeoutId = setTimeout(() => {
    send({ type: 'error', message: 'Agent timed out after 90 seconds.' });
    res.end();
  }, AGENT_TIMEOUT_MS);

  try {
    const answer = await runAgentForMessage({
      sessionKey,
      query,
      model: resolvedModel,
      modelProvider: resolvedProvider,
      channel: 'stocklens-web',
      onEvent: send,
    });
    clearTimeout(timeoutId);
    send({ type: 'done', answer });
  } catch (err) {
    clearTimeout(timeoutId);
    send({ type: 'error', message: String(err) });
  } finally {
    res.end();
  }
});

// ── Start with port-in-use detection ─────────────────────────────────────────
const PORT = Number(process.env.DEXTER_GATEWAY_PORT ?? 4100);
const server = app.listen(PORT);

server.on('listening', () => {
  console.log(`[DEXTER GATEWAY] StockLens Web Channel listening on port ${PORT}`);
  console.log(`[DEXTER GATEWAY] Provider: ${MODEL_PROVIDER} | Model: ${process.env.MODEL ?? 'gemma-4-31b-it'}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[DEXTER GATEWAY] FATAL: Port ${PORT} is already in use. Kill the other process or set DEXTER_GATEWAY_PORT.`);
  } else {
    console.error('[DEXTER GATEWAY] FATAL:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[DEXTER GATEWAY] UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[DEXTER GATEWAY] UNHANDLED REJECTION:', reason);
});
