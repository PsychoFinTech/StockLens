import React from 'react';
import { EnrichedTrade } from '../../utils/congressHelpers.js';
import { CommitteeTag } from './CommitteeTag.jsx';
import { RelevanceBadge } from './RelevanceBadge.jsx';

interface CongressTradeRowProps {
  trade: EnrichedTrade;
}

export const CongressTradeRow: React.FC<CongressTradeRowProps> = ({ trade }) => {
  const isPurchase = trade.type && trade.type.toLowerCase().includes('purchase');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
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

  const renderLagBadge = (days: number) => {
    if (days <= 30) {
      return <span className="text-[#6b7280]">Filed in {days}d</span>;
    } else if (days <= 44) {
      return <span className="text-[#f59e0b] font-medium">Filed in {days}d</span>;
    } else {
      return <span className="text-[#ef4444] font-semibold">Filed in {days}d ⚠</span>;
    }
  };

  return (
    <a
      href={trade.ptr_link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-gray-100 hover:bg-[#f8f9fa] transition-colors gap-3 cursor-pointer no-underline block"
    >
      <div className="flex items-start gap-3 w-full md:w-auto">
        {/* Left Badge */}
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white font-sans text-xs font-bold ${
          isPurchase ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
        }`}>
          {isPurchase ? 'P' : 'S'}
        </div>

        {/* Senator Info & Committee Tags */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#111827] font-sans text-sm">{trade.senator}</span>
            {trade.owner && trade.owner !== 'Self' && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-sans text-[10px] font-medium">
                {trade.owner}
              </span>
            )}
          </div>

          {/* Committee Tags */}
          {trade.committees && trade.committees.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-gray-400 text-[11px] mr-0.5">🏛</span>
              {trade.committees.map((comm, idx) => (
                <CommitteeTag key={idx} label={comm} />
              ))}
            </div>
          )}

          {/* Relevance Badge */}
          {trade.isRelevant && (
            <div className="mt-0.5">
              <RelevanceBadge />
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Amount & Date */}
      <div className="flex md:flex-col justify-between items-baseline md:items-end w-full md:w-auto shrink-0 md:text-right font-sans text-xs mt-1 md:mt-0 pl-11 md:pl-0">
        <span className="font-bold text-[#111827] text-sm md:text-xs order-2 md:order-1">{trade.amount}</span>
        <div className="flex items-center gap-2 text-[#6b7280] order-1 md:order-2 md:mt-1">
          <span>{formatDate(trade.transaction_date)}</span>
          <span className="text-gray-250">•</span>
          {renderLagBadge(trade.lagDays)}
        </div>
      </div>
    </a>
  );
};
