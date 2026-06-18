import React from 'react';

interface CongressSummaryBarProps {
  totalTrades: number;
  purchases: number;
  sales: number;
  mostRecentTradeDate: string | null;
}

export const CongressSummaryBar: React.FC<CongressSummaryBarProps> = ({
  totalTrades,
  purchases,
  sales,
  mostRecentTradeDate
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-150">
        <div className="flex flex-col">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider">Total Trades</span>
          <span className="text-xl font-bold font-sans text-[#111827] mt-1">{totalTrades}</span>
        </div>
        <div className="flex flex-col pt-4 sm:pt-0 sm:pl-6">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider">Purchases</span>
          <span className="text-xl font-bold font-sans text-[#22c55e] mt-1">{purchases}</span>
        </div>
        <div className="flex flex-col pt-4 sm:pt-0 sm:pl-6">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider">Sales</span>
          <span className="text-xl font-bold font-sans text-[#ef4444] mt-1">{sales}</span>
        </div>
        <div className="flex flex-col pt-4 sm:pt-0 sm:pl-6">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider">Most Recent Trade</span>
          <span className="text-xl font-bold font-sans text-[#111827] mt-1">{formatDate(mostRecentTradeDate)}</span>
        </div>
      </div>
    </div>
  );
};
