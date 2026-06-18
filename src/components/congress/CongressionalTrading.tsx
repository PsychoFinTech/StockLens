import React, { useState } from 'react';
import { useCongressData } from '../../hooks/useCongressData.js';
import { CongressSummaryBar } from './CongressSummaryBar.jsx';
import { CongressTradeRow } from './CongressTradeRow.jsx';

interface CongressionalTradingProps {
  ticker: string;
}

export const CongressionalTrading: React.FC<CongressionalTradingProps> = ({ ticker }) => {
  const { trades, isLoading, isError, refetch } = useCongressData(ticker);
  const [showAll, setShowAll] = useState<boolean>(false);

  // Derive stats
  const totalTrades = trades.length;
  const purchases = trades.filter(t => t.type && t.type.toLowerCase().includes('purchase')).length;
  const sales = totalTrades - purchases;
  const mostRecentTradeDate = totalTrades > 0 ? trades[0].transaction_date : null;

  // Render 3 pulsing skeleton rows inside card
  const renderLoading = () => {
    return (
      <div className="space-y-4">
        {/* Skeletons for summary bar */}
        <div className="h-24 bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 animate-pulse flex justify-between">
          <div className="h-12 w-20 bg-gray-100 rounded"></div>
          <div className="h-12 w-20 bg-gray-100 rounded"></div>
          <div className="h-12 w-20 bg-gray-100 rounded"></div>
          <div className="h-12 w-20 bg-gray-100 rounded"></div>
        </div>
        {/* Skeletons for trade list card */}
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center animate-pulse border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 shrink-0"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded"></div>
                  <div className="h-3 w-48 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-24 bg-gray-100 rounded"></div>
                <div className="h-3 w-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render error retry card
  const renderError = () => {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 text-center space-y-4">
        <div className="text-[#ef4444] text-3xl font-bold">⚠</div>
        <div className="space-y-1">
          <h4 className="font-bold text-[#111827] font-sans text-md">Could not load congressional data</h4>
          <p className="text-gray-500 font-sans text-xs">There was an issue fetching the latest disclosure data. Please try again.</p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#059669] text-white font-sans text-xs font-semibold rounded-lg hover:bg-[#059669]/90 transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  };

  // Render centered empty state
  const renderEmpty = () => {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-12 text-center space-y-2">
        <div className="text-3xl">🏛️</div>
        <h4 className="font-bold text-[#111827] font-sans text-sm mt-2">No Senate trades found for {ticker}</h4>
        <p className="text-gray-500 font-sans text-xs max-w-sm mx-auto leading-relaxed">
          Senators are required to disclose trades within 45 days
        </p>
      </div>
    );
  };

  if (isLoading) return renderLoading();
  if (isError) return renderError();
  if (totalTrades === 0) return renderEmpty();

  const visibleTrades = showAll ? trades : trades.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold font-sans text-[#111827] tracking-tight">🏛️ Congressional Trading</h3>
        <p className="text-[#6b7280] font-sans text-xs font-normal">
          U.S. Senate STOCK Act disclosures · Data: Financial Modeling Prep
        </p>
      </div>

      {/* Stats summary bar */}
      <CongressSummaryBar
        totalTrades={totalTrades}
        purchases={purchases}
        sales={sales}
        mostRecentTradeDate={mostRecentTradeDate}
      />

      {/* Trades card list */}
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex flex-col">
          {visibleTrades.map((trade, idx) => (
            <CongressTradeRow key={idx} trade={trade} />
          ))}
        </div>

        {/* Show More toggle */}
        {totalTrades > 5 && (
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold font-sans text-[#059669] hover:text-[#059669]/90 transition cursor-pointer"
            >
              {showAll ? 'Show less' : `Show all ${totalTrades} trades`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
