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
  <div className="p-8 mt-20 flex justify-center w-full">
    <div className="animate-pulse flex items-center gap-2 text-indigo-500 font-semibold font-mono">
      <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>
      <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      Loading view...
    </div>
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
          <main className="flex-1">
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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
              <p className="font-semibold text-gray-400">
                StockLens Equities Analysis Engine © {new Date().getFullYear()}
              </p>
              <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-gray-400">
                Data provided with waterfall fallbacks via Finnhub Core API, Yahoo Scraper summaries, and Alpha Vantage backups. Seeded with 200+ major multi-region indices and equities.
              </p>
            </div>
          </footer>

          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
