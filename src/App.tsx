import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header.jsx';
import { Ticker } from './components/Ticker.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

// Lazy loaded heavy routes to split the bundle and improve TTI
const WatchlistPage = React.lazy(() => import('./pages/WatchlistPage.jsx').then(m => ({ default: m.WatchlistPage })));
const ScreenerPage = React.lazy(() => import('./pages/ScreenerPage.jsx').then(m => ({ default: m.ScreenerPage })));
const MarketDashboardPage = React.lazy(() => import('./pages/MarketDashboardPage.jsx').then(m => ({ default: m.MarketDashboardPage })));
const ComparePage = React.lazy(() => import('./pages/ComparePage.jsx').then(m => ({ default: m.ComparePage })));
const HedgeFundPage = React.lazy(() => import('./pages/HedgeFundPage.jsx').then(m => ({ default: m.HedgeFundPage })));
const CompanyPage = React.lazy(() => import('./pages/CompanyPage/index.jsx').then(m => ({ default: m.CompanyPage })));
const MacroIndicatorsPage = React.lazy(() => import('./pages/MacroIndicatorsPage.jsx').then(m => ({ default: m.MacroIndicatorsPage })));

// 1. Initialize TanStack Query engine
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000 // 1 minute default stale threshold
    }
  }
});

const RouteLoader = () => (
  <div className="p-8 mt-24 flex flex-col items-center justify-center w-full gap-4">
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></div>
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.12s' }}></div>
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.24s' }}></div>
    </div>
    <span className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400">Loading view</span>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="relative min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-emerald-50 selection:bg-emerald-150 selection:text-emerald-900">
          <div className="fixed inset-0 bg-white/40 backdrop-blur-[100px] pointer-events-none z-0" />
          
          <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* Header block */}
          <ErrorBoundary name="Header">
            <Header />
          </ErrorBoundary>

          {/* Indices ticker widget */}
          <ErrorBoundary name="Global Ticker">
            <Ticker />
          </ErrorBoundary>

          {/* Main workspace routing content */}
          <main className="flex-1 animate-fade-in">
            <ErrorBoundary name="Page Content">
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<WatchlistPage />} />
                  <Route path="/screener" element={<ScreenerPage />} />
                  <Route path="/hedge-fund" element={<HedgeFundPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/market" element={<MarketDashboardPage />} />
                  <Route path="/macro" element={<MacroIndicatorsPage />} />
                  <Route path="/company/:symbol" element={<CompanyPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>

          {/* Humble architectural Footer */}
          <footer className="border-t border-gray-150 bg-white/70 py-6 text-center text-xs text-gray-400 font-mono mt-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2.5">
              <p className="font-semibold text-gray-400">
                StockLens Equities Analysis Engine © {new Date().getFullYear()}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-wider text-gray-400">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-150 bg-white/60 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Yahoo Finance · Primary
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-150 bg-white/60 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Alpha Vantage · Fallback
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-150 bg-white/60 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Durable Cache
                </span>
              </div>
              <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-gray-400">
                Live market data served through an automatic waterfall — Yahoo Finance first, Alpha Vantage as fallback, then a durable local cache. Seeded with 200+ major multi-region indices and equities.
              </p>
            </div>
          </footer>

          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
