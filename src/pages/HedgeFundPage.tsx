import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';
import { Briefcase, Loader2, Target, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import { formatPrice } from '../utils/formatters.js';
import { SearchBar } from '../components/SearchBar.jsx';

interface AgentResult {
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string[];
}

interface StockEvaluationResult {
  symbol: string;
  price: number;
  agents: {
    benGraham: AgentResult;
    billAckman: AgentResult;
    cathieWood: AgentResult;
    charlieMunger: AgentResult;
    philFisher: AgentResult;
    stanDruckenmiller: AgentResult;
    warrenBuffett: AgentResult;
  };
}

interface PortfolioDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity: number;
  reasoning: string[];
  allocationAmount: number;
}

interface HedgeFundResult {
  decisions: Record<string, PortfolioDecision>;
  evaluations: Record<string, StockEvaluationResult>;
  summary: string[];
}

export const HedgeFundPage: React.FC = () => {
  const [tickers, setTickers] = useState<string[]>(['AAPL', 'TSLA', 'NVDA']);
  const [cashInput, setCashInput] = useState(100000);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  const mutation = useMutation<HedgeFundResult, Error, { tickers: string[]; cash: number }>({
    mutationFn: async (payload) => {
      const resp = await apiClient.post<HedgeFundResult>('/hedge-fund/run', payload);
      return resp.data;
    }
  });

  const handleRun = () => {
    if (tickers.length === 0) return;
    mutation.mutate({ tickers, cash: cashInput });
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'bullish') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    if (signal === 'bearish') return <XCircle className="h-5 w-5 text-rose-500" />;
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  const getSignalColor = (signal: string) => {
    if (signal === 'bullish') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (signal === 'bearish') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-indigo-600" />
            <h1 className="font-sans text-3xl font-black bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">AI Hedge Fund Engine</h1>
          </div>
          <p className="font-sans text-sm text-gray-500 max-w-2xl">
            Evaluate a basket of stocks using the deterministic logic of 7 legendary investors.
            Simulate a portfolio allocation based on conviction and risk management rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6 relative z-50">
          <div className="border border-white/50 rounded-3xl bg-white/95 backdrop-blur-xl shadow-xl shadow-indigo-500/10 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              Engine Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tickers to Evaluate (max 10)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tickers.map((ticker) => (
                    <div key={ticker} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-sm font-bold font-mono shadow-sm transition-all hover:shadow-md">
                      {ticker}
                      <button 
                        onClick={() => setTickers(tickers.filter(t => t !== ticker))}
                        className="hover:bg-indigo-200 text-indigo-500 hover:text-indigo-800 rounded-full p-0.5 ml-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {tickers.length === 0 && (
                    <span className="text-sm text-gray-500 italic py-1.5">No tickers added yet.</span>
                  )}
                </div>
                {tickers.length < 10 && (
                  <SearchBar 
                    placeholder="Search to add ticker..." 
                    onSelect={(sym) => {
                      if (!tickers.includes(sym.toUpperCase())) {
                        setTickers([...tickers, sym.toUpperCase()]);
                      }
                    }} 
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Starting Cash Balance ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    value={cashInput}
                    onChange={(e) => setCashInput(Number(e.target.value))}
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>
              <button
                onClick={handleRun}
                disabled={mutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    Run Hedge Fund Engine
                  </>
                )}
              </button>
            </div>
          </div>

          {mutation.data && (
            <div className="border border-white/50 rounded-3xl bg-white/95 backdrop-blur-xl shadow-xl shadow-indigo-500/10 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-500" />
                Portfolio Summary
              </h2>
              <ul className="space-y-3">
                {mutation.data.summary.map((text, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {mutation.isError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Failed to run engine. Ensure tickers are valid.
            </div>
          )}

          {!mutation.data && !mutation.isPending && !mutation.isError && (
            <div className="border border-dashed border-white/80 rounded-3xl p-12 text-center bg-white/50 backdrop-blur-xl shadow-xl shadow-indigo-500/5 flex flex-col items-center justify-center text-gray-500 h-full min-h-[300px]">
              <Target className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Allocate</h3>
              <p className="max-w-md mx-auto text-sm">
                Enter your target tickers and cash balance, then run the engine to see what the legends think.
              </p>
            </div>
          )}

          {mutation.data && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2">Analysis Results</h2>
              
              {Object.entries(mutation.data.decisions).map(([symbol, decision]) => {
                const evalData = mutation.data.evaluations[symbol];
                const isExpanded = expandedStock === symbol;

                return (
                  <div key={symbol} className="border border-white/50 rounded-3xl bg-white/95 backdrop-blur-xl shadow-xl shadow-indigo-500/10 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-1">
                    {/* Header Row */}
                    <div 
                      className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedStock(isExpanded ? null : symbol)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 text-center py-2 rounded-lg font-black text-lg ${decision.action === 'BUY' ? 'bg-emerald-100 text-emerald-800' : decision.action === 'SELL' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'}`}>
                          {decision.action}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                            {symbol}
                            <span className="text-sm font-medium text-gray-500 font-mono">
                              {evalData ? formatPrice(evalData.price, 'USD') : ''}
                            </span>
                          </h3>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            {decision.quantity > 0 ? (
                              <span className="font-semibold text-indigo-600">
                                Allocated {decision.quantity} shares ({formatPrice(decision.allocationAmount, 'USD')})
                              </span>
                            ) : (
                              <span>No allocation</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 max-w-sm text-xs text-gray-600">
                        <ul className="space-y-1">
                          {decision.reasoning.map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && evalData && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Individual Agent Scorecards</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(evalData.agents).map(([agentName, result]) => (
                            <div key={agentName} className={`p-4 rounded-2xl border ${getSignalColor(result.signal)} shadow-sm backdrop-blur-md`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold capitalize">{agentName.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white/50">{result.confidence.toFixed(0)}% Conviction</span>
                                  {getSignalIcon(result.signal)}
                                </div>
                              </div>
                              <ul className="text-xs space-y-1 mt-2">
                                {result.reasoning.map((r, i) => (
                                  <li key={i} className={r.startsWith('✅') ? 'text-emerald-700' : r.startsWith('❌') ? 'text-rose-700' : ''}>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
