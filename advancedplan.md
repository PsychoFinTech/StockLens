# DCF Calculator — Path to Production-Grade (Free Data Only)

## 1. Current State Rating

Verified against the code as of commit `c29887f` (route bugs from the last two
review rounds — case-sensitive extraction after case-insensitive lookup, and
the dropped `ordinarySharesNumber` fallback for shares outstanding — are both
confirmed fixed in this commit).

| Area | Score | Notes |
|---|---|---|
| Data pipeline correctness (`server/routes/dcf.ts`) | 8/10 | Field-casing helper (`getField`) now applied consistently end-to-end; debt/cash/shares fallbacks restored; cache bypass (`?refresh=true`) in place. |
| Valuation engine (`src/utils/dcfCalculator.ts`) | 8.5/10 | CAPM/WACC, 2-stage growth decay, FCF-margin interpolation, sensitivity grids are all sound and unit-tested. |
| UI/UX & feature depth (`DCFCalculator.tsx`) | 8/10 | Bear/base/bull scenarios, dual sensitivity grids, CSV export, 52-week overlay, several warning banners (low/high WACC, atypical tax rate, zero revenue, financial-sector). |
| Test coverage quality | 4/10 | Route tests fully mock `yahooService`; the `basicFinancials` mock always provides `totalDebt`/`totalCash`/`sharesOutstanding` directly, so the timeSeries **fallback branch never actually executes in any test** — this is exactly why the last two regressions (casing bug, dropped shares fallback) shipped past "39 passing tests" twice. |
| Production safeguards (validation, provenance, edge cases) | 4/10 | Financial-sector and terminal-growth warnings exist but are soft/cosmetic, not gates; no cross-source validation; no TTM data; risk-free rate for India is a hardcoded constant. |
| Repo hygiene | 3/10 | `scratch/*.ts` API-probing scripts and `test_report.docx`/`test_report.pdf` binaries are committed to the repo. |

**Overall: ~7/10 — a strong prosumer-grade DCF tool, not yet "professional/production-grade."**
The math and UI are genuinely solid. What's missing is exactly what separates a
portfolio feature from a tool you'd trust unsupervised: input verification,
edge-case gating, and tests that can actually catch a future regression.

The good news: this repo already contains two unused-by-DCF services that make
the two highest-leverage upgrades cheap rather than speculative (see Phase 0).

## 2. Guiding Constraint

Free data only, no new paid vendor:
- **Yahoo Finance** (`yahoo-finance2`) — already the primary source.
- **FRED** (`fredService`) — already used for `DGS10`.
- **SEC EDGAR XBRL** (`data.sec.gov`, no key, requires `User-Agent` header) — already integrated in `server/services/edgar.ts`, just not connected to the DCF route.
- Existing in-repo peer comps (`server/services/report/data/peerService.ts`) — built for the equity-research-report feature, reusable here.

## 3. Phase 0 — Quick Wins (reuse what already exists)

These are the highest ROI items because the hard part (the data client) is
already built and tested elsewhere in the repo for the report-generator
feature; this is wiring, not new infrastructure.

1. **SEC cross-validation.** `edgarService.getFinancials(symbol)` (`server/services/edgar.ts:783`) already returns parsed XBRL income statement, balance sheet, and cash flow line items (`Revenues`, `NetIncomeLoss`, `NetCashProvidedByUsedInOperatingActivities`, `PaymentsToAcquirePropertyPlantAndEquipment`, cash concepts) with SQLite-backed caching. Call it alongside `yahooService.getFundamentalsTimeSeries()` in `/api/dcf/:symbol`, compute SEC-implied FCF (`OperatingCF − CapEx`) and Revenue, and diff against the Yahoo-derived figures. Surface a `dataConfidence: 'high' | 'medium' | 'low'` field when the two sources agree within ~5% / diverge / SEC data unavailable (non-US filer). This single change addresses the biggest credibility gap: right now every number is single-sourced.
2. **Peer-relative sanity check.** `fetchPeersForReport(symbol)` (`server/services/report/data/peerService.ts`) already resolves peers (Yahoo → hardcoded competitor map → sector/industry SQLite fallback) and returns their P/E and EV/EBITDA. Add a peer-median-implied valuation alongside the DCF intrinsic value in the UI, with a callout if they diverge by more than ~40% ("DCF says $X, peers imply $Y — investigate growth/margin assumptions"). This catches DCF outputs that are mechanically correct but assumption-driven nonsense.
3. **Fix the test gap that let two regressions through twice.** In `dcf.test.ts`, the `basicFinancials.metric` mock always supplies `totalDebt`/`totalCash`/`sharesOutstanding`, so the `?? timeSeries-fallback` branch in `dcf.ts` is never exercised. Add a test case with `basicFinancials.metric = {}` so the fallback path actually runs and is asserted — this is the test that would have caught both prior bugs on the first pass instead of needing two more review rounds.
4. **Repo hygiene.** `git rm --cached` the `scratch/testYahoo.ts`, `scratch/testDcfRoute.ts`, `scratch/fetch_amat_fundamentals.ts` probing scripts and `test_report.docx`/`test_report.pdf`; add `scratch/` and `test_report.*` to `.gitignore`. Shipping ad-hoc debug scripts and generated binary reports in the main tree reads as unfinished, not professional.

## 4. Phase 1 — Data Integrity & Provenance

- **TTM blending.** `fundamentalsTimeSeries` is annual-only, so fundamentals can lag up to ~12 months after fiscal year-end. Pull the latest quarterly statement (already available via Yahoo's `quoteSummary` cashflow/income modules) and blend trailing four quarters for FCF/Revenue, falling back to the latest annual figure when quarterly data is missing.
- **Provenance metadata.** Extend the DCF payload with a `sources` map (e.g. `{ totalDebt: { source: 'yahoo.basicFinancials', asOf: '...' }, ... }`) so the UI — and any future auditor — can see exactly where each number came from and how stale it is. This is what makes a tool feel "professional" rather than a black box.
- **Replace the hardcoded India risk-free rate.** `0.071` is currently a fixed constant in `dcf.ts`. FRED carries `INDIRLTLT01STM` (OECD long-term India 10Y rate) for free — fetch it the same way `DGS10` is fetched for the US, and keep the hardcoded value only as a last-resort fallback if that series request fails.

## 5. Phase 2 — Valuation Methodology Robustness

- **Harden the DCF-applicability gate.** A financial-sector warning already exists in `DCFCalculator.tsx` (string-matching `profile.industry` for "bank"/"insurance"), and the terminal growth default is already capped near GDP via `Math.min(riskFreeRate, 0.03)`. Both are currently *soft, cosmetic* — the user can ignore the banner and the terminal-growth field has no enforced ceiling once edited. Upgrade to: (a) a more reliable sector check (Yahoo profile `sector`/`industry` plus a small SIC-code table from the existing EDGAR submissions data, not substring matching), and (b) a hard validation warning (not just a banner) when terminal growth is edited above ~4-5% or below the risk-free rate.
- **Synthetic credit rating for cost of debt.** Raw `interestExpense / totalDebt` is noisy for companies with little or refinanced-mid-year debt. Use Damodaran's published interest-coverage-ratio → synthetic rating → default spread table (free, static, periodically refreshed) as a sanity bound or blended estimate for cost of debt instead of trusting the raw ratio alone.
- **Monte Carlo sensitivity.** The existing bear/base/bull scenarios and WACC×growth / growth×margin grids are good fixed-point views. Add an opt-in Monte Carlo mode: sample beta, revenue growth, FCF margin, and WACC from simple normal distributions around the point estimates (computed client-side, no new dependency needed) and show a fair-value distribution/histogram instead of three fixed scenarios. This is the single biggest "feels professional" upgrade for a tool aimed at serious users.

## 6. Phase 3 — Testing & Verification Infrastructure

- Replace hand-typed mock fixtures with **recorded real response cassettes** (e.g. `msw`) captured from live Yahoo/SEC calls, refreshed periodically — keeps tests fast and offline while actually validating real API shapes, unlike today's mocks which encode the test author's assumptions about the shape.
- Add a **golden-master test**: a known symbol's full DCF output (WACC, intrinsic value, sensitivity grid) checked against expected values, so any unintended math drift is caught.
- Add a separate, not-run-on-every-PR **live contract test** that hits real Yahoo/SEC endpoints for 3-5 symbols and asserts the expected fields still exist — this is what catches upstream API drift (the actual root cause of all three bugs fixed across this feature so far) before it reaches users.

## 7. Phase 4 — Operational Resilience

Already solid and worth preserving as-is: `opossum` circuit breakers around Yahoo calls, request-coalescing dedup, `NodeCache`/Redis tiered caching, SQLite durable backups. Two additions:
- **Scheduled background refresh** (cron) for frequently-viewed symbols so the first user request after a 24h TTL expiry isn't a cold, rate-limited round-trip to Yahoo.
- **Staleness banner** in the UI driven by the existing `dataFreshness` field — if `>24h` old, tell the user instead of silently serving it.

## 8. Phase 5 — Professional Polish

- **Citations footer**: "Data: Yahoo Finance, FRED, SEC EDGAR — as of \<timestamp\>" on every DCF view.
- **Extend the existing report generator** (`server/services/report/output/pdfGenerator.ts` / `wordGenerator.ts`, already built for the equity-research-report feature) to include a DCF section in the exported PDF/Word report, instead of only having the DCF Calculator's standalone CSV export.

## 9. Suggested Order

| Priority | Item | Why first/last |
|---|---|---|
| P0 | SEC cross-validation wiring (4.1) | Existing service, highest credibility gain, low effort |
| P0 | Test gap fix (4.3) | Prevents a 4th regression round on this same feature |
| P0 | Repo hygiene (4.4) | Trivial, but currently the most visible "unprofessional" signal |
| P1 | Peer-relative cross-check (4.2) | Existing service, second-highest credibility gain |
| P1 | Hardened DCF-applicability gate + India risk-free rate fix | Closes known correctness edge cases |
| P2 | TTM blending, provenance metadata | Meaningful but more invasive data-layer change |
| P2 | Monte Carlo sensitivity | High user-facing payoff, self-contained, no new dependency |
| P3 | Synthetic credit rating, cassette-based tests, scheduled refresh, report export | Polish once the above is stable |
