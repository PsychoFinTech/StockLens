import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header.jsx';
import { Ticker } from './components/Ticker.jsx';
import { WatchlistPage } from './pages/WatchlistPage.jsx';
import { ScreenerPage } from './pages/ScreenerPage.jsx';
import { MarketDashboardPage } from './pages/MarketDashboardPage.jsx';
import { ComparePage } from './pages/ComparePage.jsx';
import { CompanyPage } from './pages/CompanyPage/index.jsx';
import { MacroIndicatorsPage } from './pages/MacroIndicatorsPage.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50/50 flex flex-col selection:bg-emerald-150 selection:text-emerald-900">
          
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
              <Routes>
                <Route path="/" element={<WatchlistPage />} />
                <Route path="/screener" element={<ScreenerPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/market" element={<MarketDashboardPage />} />
                <Route path="/macro" element={<MacroIndicatorsPage />} />
                <Route path="/company/:symbol" element={<CompanyPage />} />
              </Routes>
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}
