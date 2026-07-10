# StockLens — Production Readiness Assessment

Scope: whole repository (Express/TS backend, React 19/Vite frontend, SQLite persistence, CI). Evaluated against "would I trust this running unattended, handling real traffic, for real money decisions" — not against "does it work on my machine."

## Overall Score: 6.3 / 10 — Strong hobby/portfolio project, not yet production-grade for multi-user deployment

This is a more sophisticated codebase than its size suggests — the caching waterfall, circuit breaker, clustering support, and the DCF subsystem's TTM blending / SEC cross-validation / synthetic credit ratings are genuinely advanced engineering for a project with zero paid data dependencies. The gap to "production grade" isn't raw capability, it's the boring stuff that doesn't show up in a demo: nobody has hardened the build pipeline against silent breakage, nobody has decided what happens to user data on redeploy, and there's no operational safety net (error tracking, security headers, dependency scanning) underneath a real logging/caching foundation that's otherwise solid.

---

## Scoring Matrix

| Category | Score | One-line verdict |
|---|---|---|
| Architecture & code organization | 7.5/10 | Clean layering, sensible folder structure, a couple of growing god-files |
| Security | 5/10 | Good CORS/rate-limit defaults, but no auth, no security headers, inconsistent input validation |
| Data reliability & resilience | 8/10 | Best-in-class for a free-data app: waterfall caching, circuit breaker, provenance tracking |
| Database & persistence | 5/10 | Tasteful SQLite use, but no migrations and no plan for ephemeral storage wiping user data |
| Observability & operations | 6.5/10 | Structured logging + health check exist; no error tracking, no graceful shutdown |
| Testing | 4/10 | 11 test files, no component tests, no coverage gate, mocks lag behind real code paths |
| CI/CD | 4/10 | Lints + tests + secret-scans on every push, but never runs the actual production build |
| Frontend quality | 7/10 | Modern stack, good chunking and error boundaries, but `strict: true` undercut by 269 `any`s |
| Documentation | 6/10 | Honest, well-written README; `.env.example` covers ~2 of 11 env vars actually read |
| Repo hygiene | 4/10 | Agent/session log artifacts and ad-hoc debug scripts committed at repo root |

---

## 1. Architecture & Code Organization — 7.5/10

**Good:**
- Clear separation: `server/routes` (HTTP), `server/services` (data/business logic), `server/middleware` (cross-cutting), mirrored on the frontend with `src/pages`, `src/components`, `src/hooks`, `src/utils`.
- The DCF feature correctly keeps valuation math (`src/utils/dcfCalculator.ts`) out of the route layer — `server/routes/dcf.ts` only sources and validates inputs, the frontend owns the calculation. That's the right boundary.
- `server/services/report/` cleanly isolates the heavyweight PDF/Word report generator from the lighter API routes.

**Weak spots:**
- `src/pages/CompanyPage/DCFCalculator.tsx` is ~1,400 lines — a god-component mixing data-fetching orchestration, four+ chart/table renderers, sensitivity-table math, and Monte Carlo wiring. It works, but it's unreviewable as a single unit and untestable as a component (see Testing).
- `server/routes/dcf.ts` does a lot of inline business logic (TTM blending, SEC divergence checks, synthetic rating lookup) directly in the route handler rather than in `server/services/`. Fine at current size (331 lines), but it's the same shape of problem as the frontend god-component starting to form.
- Possible drift risk: `server/services/fred.ts` and `server/services/report/data/fredService.ts` are separate files with overlapping purpose — worth confirming they don't diverge in behavior over time.

---

## 2. Security — 5/10

**Good:**
- CORS fails *closed* in production: if `CLIENT_URL` isn't set, `allowedOrigins = []` rather than defaulting open (`server.ts:47-55`). That's the right default.
- `express-rate-limit` on every mutating/expensive route, with an optional Redis-backed store for multi-instance deployments (`server/middleware/rateLimiter.ts`).
- Gitleaks runs in CI on every push/PR (`.github/workflows/ci.yml:17-20`).
- `app.set('trust proxy', 1)` is set correctly for a clustered/reverse-proxied deployment.

**Gaps:**
- **No authentication or authorization anywhere in the codebase** (confirmed: no `jsonwebtoken`, `passport`, `express-session`, `bcrypt`, or `Authorization` header handling in any server file). The watchlist (`server/routes/watchlist.ts`) is a single global SQLite table with no user scoping — every visitor shares one watchlist. This is consistent with the README's stated "single-process, single-user tool" framing, so it isn't a *bug*, but it hard-blocks calling this "production" in any multi-tenant/SaaS sense. If this is ever exposed publicly with the intent of multiple people using it, this is the first thing that needs to change.
- **No security headers middleware** — no `helmet`, no CSP, no `X-Frame-Options`, no HSTS. Trivial to add, currently absent.
- **Inconsistent input validation** — `zod` is a dependency but is only actually imported in 2 files (`server/services/yahoo.ts`, `server/routes/screener.ts`). Every other route does manual ad-hoc checks (e.g. `watchlist.ts:83`: `req.body.symbol ? req.body.symbol.toString().toUpperCase().trim() : ''`). Not unsafe today, but it means there's no consistent boundary contract across ~13 route groups.
- No dependency vulnerability scanning (no `npm audit` step, no Dependabot/Renovate config found under `.github/`). Gitleaks catches leaked secrets, not vulnerable package versions.
- No CSRF protection — lower severity since there's no session/cookie-based auth to exploit, but worth re-evaluating the moment auth is added.

---

## 3. Data Reliability & Resilience — 8/10

This is the strongest part of the codebase, and notably stronger than most side projects at this scale.

**Good:**
- Three-tier caching waterfall: in-memory (`node-cache`) or Redis if `REDIS_URL` is set → SQLite durable backup → live fetch (`server/services/cache.ts`). The SQLite backup tier means the app degrades gracefully (serves stale-but-real data) instead of failing outright when Yahoo/FRED/EDGAR are down.
- `opossum` circuit breaker wraps the Yahoo Finance client (`server/services/yahoo.ts`), preventing cascading failures/latency when the upstream is degraded.
- Route-level `Cache-Control` policy tuned per data volatility (quotes: 60s, EDGAR: 7 days immutable, screener: private 60s) — `server.ts:74-95`.
- The DCF subsystem specifically (per `advancedplan.md` follow-through) now does TTM quarter blending, SEC EDGAR cross-validation with a confidence score, peer-relative sanity checks, and a Damodaran synthetic credit rating — there is no paid data source that does this kind of internal consistency-checking for you; it had to be built, and it was.

**Gaps:**
- The circuit breaker is only applied to Yahoo. FRED and SEC EDGAR calls have no equivalent protection — a slow/hanging EDGAR response can still tie up a request without breaker-based fast-failure.
- Known existing bug (not yet fixed, flagged in prior review): `src/utils/monteCarlo.ts` calls `computeDCF()` with a parameter shape that doesn't match `DCFInputs` and omits the required `currentPrice` argument — every Monte Carlo iteration currently produces `NaN`. This is a resilience issue in the sense that the feature fails *silently* (no thrown error reaches the user) rather than loudly.

---

## 4. Database & Persistence — 5/10

**Good:**
- WAL mode + tuned pragmas (`cache_size`, `mmap_size`, `busy_timeout`) show real care for a single-file SQLite deployment (`server/services/db.ts:10-16`).
- Foreign keys enabled, sensible indexes on hot columns (`idx_stocks_sector`, `idx_quotes_symbol`, etc).
- Idempotent seeding (only seeds `stocks` table if empty) avoids duplicate-seed bugs on restart.

**Gaps:**
- **No migration framework.** Schema changes are handled by `CREATE TABLE IF NOT EXISTS` plus ad-hoc `try { db.exec('ALTER TABLE ...') } catch (_) {}` blocks (`db.ts:102-108`). This works today but doesn't scale past a couple more schema changes — there's no record of what changed when, no rollback path, and silently swallowing the `ALTER TABLE` error means a real failure (e.g. disk full, permissions) looks identical to "column already exists."
- **No backup/restore strategy** for the SQLite file. There's nothing in the repo (cron job, docs, deployment config) addressing what happens if `stocklens.db` is lost.
- **Cache data and user data share one file with no lifecycle distinction.** `watchlist` (real user data) lives in the same SQLite file as `quotes`/`cache_log`/`fundamentals` (pure cache, safe to lose). If this is deployed on ephemeral container storage — which is the default assumption on most PaaS/serverless platforms unless a volume is explicitly mounted — a redeploy silently wipes the user's watchlist along with the disposable cache, and nothing in the code or docs warns about this.

---

## 5. Observability & Operations — 6.5/10

**Good:**
- Structured logging via `pino` + `pino-http` request logging (`server.ts:39,61`).
- `/health` endpoint that actually checks DB connectivity (`SELECT 1`) rather than just returning 200 unconditionally, plus uptime/memory (`server.ts:64-72`).
- Native Node `cluster` support gated behind `CLUSTER=true`, with worker respawn on crash (`server.ts:158-166`) — more production-aware than most projects this size bother with.
- Staggered startup warmers (ratios warmer at +30s, EDGAR prefetch every 8s starting at +90s) to avoid a startup thundering-herd against free APIs that will rate-limit you.

**Gaps:**
- No error-tracking/APM integration anywhere (no Sentry/Bugsnag/Datadog in `package.json`). Errors go to `console.error` (e.g. `errorHandler.ts:9`) or pino logs and nowhere else — there's no way to get alerted when something breaks in production short of someone tailing logs.
- No graceful shutdown handling (`SIGTERM`/`SIGINT`) around `app.listen()` — in a rolling-deploy/container-orchestration environment, in-flight requests can be dropped on every deploy.
- `/health` only checks the local DB, not the health of upstream dependencies (Yahoo/FRED/EDGAR) — a "degraded but technically OK" state (all upstream APIs down, serving stale cache) reports the same `200 ok` as a fully healthy instance.
- Logging is inconsistent — pino is configured but plenty of services (`cache.ts`, `errorHandler.ts`, `db.ts`) still use raw `console.log`/`console.error`, so log output won't be uniformly structured/parseable in aggregation tools.

---

## 6. Testing — 4/10

- 11 test files total across the entire repo (`server/routes/__tests__` ×5, `server/services/__tests__` ×4, `src/utils/__tests__` ×1, plus `dcf.test.ts`).
- **No frontend component tests at all** — no React Testing Library, no `@testing-library/react` in dependencies. `DCFCalculator.tsx` at ~1,400 lines, with a hard-blocking financial-sector acknowledgement gate, provenance tooltips, sensitivity tables, and a Monte Carlo panel, has zero test coverage at the component level.
- No end-to-end tests (no Playwright/Cypress specs in the repo).
- `@vitest/coverage-v8` is installed but there's no `test:coverage` script and no coverage threshold enforced anywhere (not in `package.json`, not in CI) — meaning coverage is currently unmeasured, not just low.
- Existing mocks lag behind the real code paths they're supposed to be testing: `server/routes/__tests__/dcf.test.ts` never mocks `edgarService` or `fetchPeersForReport`, even though `dcf.ts` now calls both on every request — the SEC cross-validation and peer-comp logic added in the recent Phase 2/3 work runs against real (or accidentally-real) services in tests rather than controlled fixtures.

---

## 7. CI/CD — 4/10

Current pipeline (`.github/workflows/ci.yml`): checkout → setup-node@22 → `npm ci` → `npm run lint` (`tsc --noEmit`) → `npm test` (vitest) → Gitleaks secret scan.

That's a reasonable floor, but:
- **CI never runs `npm run build`.** The actual production artifact is `vite build` + an esbuild bundle to `dist/server.cjs`. `tsc --noEmit` does not catch every failure mode `vite build`/`esbuild` can hit (e.g. bundler-specific resolution errors, asset issues). A broken production build can currently merge to `master` with a fully green CI run.
- No CD — no deploy step, no Docker image build, no environment promotion. (This may be intentional if deployment is handled by an external platform, but nothing in the repo documents that.)
- No dependency-vulnerability scanning (`npm audit`, Snyk, or Dependabot) anywhere in `.github/`.
- Single Node version (22) tested — fine for an app this size, just noting there's no compatibility matrix.

---

## 8. Frontend Quality — 7/10

**Good:**
- React 19 + TanStack Query 5 + react-router 7 — current, well-supported stack.
- `vite.config.ts` manually chunks vendor bundles (`vendor-react`, `vendor-charts`, `vendor-query`, `vendor-motion`) — genuine attention to load performance, not the default.
- `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`) is used per-section with a `name` prop for scoped fallbacks — a good pattern for isolating failures (e.g. a broken chart shouldn't take down the whole company page).

**Gaps:**
- `tsconfig.json` sets `"strict": true`, but there are **269 occurrences of `: any`** across `server/` and `src/` — strict mode is real but its guarantees are widely opted out of in practice. Two confirmed concrete instances: `computeRevenueMarginSensitivityTable` in `DCFCalculator.tsx` types `baseInputs: any`, and the `DCFData` interface in `useDCFData.ts` is stale (missing `dataConfidence`, `peerMedianPE`, `companyEPS`, `syntheticRating`, `syntheticCostOfDebt`, `provenance` — all of which the backend now actually returns).
- No error reporting from `ErrorBoundary.componentDidCatch` beyond `console.error` — caught render errors are invisible in production unless someone is watching browser consoles.
- `DCFCalculator.tsx` (~1,400 lines) is overdue for decomposition into smaller, independently testable pieces (chart panel, sensitivity table, Monte Carlo panel, provenance tooltip are all already conceptually separable).

---

## 9. Documentation — 6/10

**Good:**
- The README is unusually honest for this kind of project — it explicitly states the "no fake data, show unavailable states" philosophy and backs it up with what's actually in the code (the caching waterfall, the SQLite backup tier). Architecture diagram and repo structure overview are accurate.

**Gaps:**
- `.env.example` lists exactly 2 variables (`APP_URL`, `FRED_API_KEY`). The code actually reads **11**: `CLIENT_URL`, `CLUSTER`, `FMP_API_KEY`, `FRED_API_KEY`, `GEMINI_API_KEY`/`GEMINI_API_KEYS`, `LOG_LEVEL`, `NODE_ENV`, `PORT`, `REDIS_URL`, `SQLITE_DB_PATH`. A new operator following the README's own "Environment Variables" section would not learn that Redis, clustering, CORS lockdown, or the Gemini-powered report generator exist or need configuration.
- No API documentation (no OpenAPI/Swagger spec) across the ~13 route groups — anyone integrating against this API has to read route source directly.
- No `CONTRIBUTING.md`, no architecture decision records for the more opinionated choices (why SQLite over Postgres, why no auth, why clustering is opt-in via env var).

---

## 10. Repo Hygiene — 4/10

- Three ad-hoc debug scripts are tracked in git at the repo root: `testLosers.ts`, `test_citadel.mjs`, `test_search.mjs`. These have the same "scratch script that should never have been committed" smell as the `scratch/` directory that was already cleaned up and gitignored — they just live one level up, untouched.
- **Agent/session operational artifacts are committed to the repository**: `.omx/logs/turns-2026-06-20.jsonl`, `.omx/logs/tmux-hook-2026-06-20.jsonl`, `.omx/state/*.json`, and `.omx/metrics.json` are all tracked in git. These are harness/session logs, not application code or configuration — they have no business in version control and will keep accumulating dated files indefinitely if left as-is.
- `.agents/skills/yahoo-finance2/SKILL.md` and the duplicate `agent/skills/yahoo-finance2/SKILL.md` are also tracked — worth confirming whether both copies are intentional or one is a stray duplicate.

---

## Critical / Priority Punch List

| Priority | Item | Why it matters | Effort |
|---|---|---|---|
| **P0** | Fix `monteCarlo.ts` → `computeDCF()` parameter mismatch | Feature is silently broken — every simulation returns `NaN` | Small |
| **P0** | Add `npm run build` to CI | The actual deployable artifact is currently unverified by CI | Tiny |
| **P0** | Decide & document SQLite persistence strategy (volume-mounted path vs. accepted ephemeral cache-only) | Currently a silent data-loss risk for the watchlist on every redeploy | Small (decision) + Medium (if volume needed) |
| **P1** | Add `helmet` (or equivalent) security headers middleware | Free, standard hardening currently entirely absent | Tiny |
| **P1** | Reconcile `.env.example`/README with the 11 env vars actually read | Onboarding/deployment correctness | Small |
| **P1** | Add `npm audit`/Dependabot to CI | No visibility into vulnerable transitive dependencies today | Small |
| **P1** | Mock `edgarService`/`fetchPeersForReport` in `dcf.test.ts` | Real code paths in the route are currently untested | Small |
| **P2** | Introduce a real migration tool (even a minimal numbered-SQL-file runner) for `db.ts` | Current `try/catch ALTER TABLE` pattern doesn't scale and masks real errors | Medium |
| **P2** | Add component tests for `DCFCalculator.tsx` (or split it first, then test the pieces) | Largest, most logic-dense component in the app has zero test coverage | Medium-Large |
| **P2** | Wire up `@vitest/coverage-v8` with a CI-enforced threshold | Coverage is currently unmeasured, not just low | Small |
| **P2** | Untrack `.omx/`, stray root scripts; gitignore going forward | Repo hygiene, avoids unbounded log accumulation in git history | Small |
| **P3** | Add error-tracking integration (Sentry or similar) on both server and `ErrorBoundary` | Currently no way to learn about production errors except log-tailing | Small-Medium |
| **P3** | Apply `zod` validation consistently across all routes, not just 2 | Removes ad-hoc validation drift across ~13 route groups | Medium |
| **P3** | Add a graceful shutdown handler (`SIGTERM`) around the HTTP server | Prevents dropped in-flight requests during rolling deploys | Small |

---

## Bottom Line

If the bar is "a personal research tool that handles real free-tier data sourcing with unusual care" — this clears it comfortably, and the DCF subsystem specifically (TTM blending, SEC cross-validation, synthetic credit ratings, Monte Carlo) is a clear step above typical side-project polish. If the bar is "production-grade," the blockers aren't the clever parts, they're the unglamorous ones: an unverified build artifact in CI, an undecided persistence/data-loss story, no security headers, no error visibility once deployed, and test coverage that doesn't reach the newest and most complex feature. None of the P0/P1 items are individually hard — most are hours, not days — which is the actual good news here.
