import React from 'react';
import { formatMarketCap, formatShares, formatPrice } from '../../../../utils/formatters.js';

interface DCFValuationBridgeProps {
  dcfResult: any;
  cashAndEquivalents: number;
  totalDebt: number;
  sharesOutstanding: number;
  exchange: string;
  symbol: string;
}

export const DCFValuationBridge: React.FC<DCFValuationBridgeProps> = ({ 
  dcfResult, 
  cashAndEquivalents, 
  totalDebt, 
  sharesOutstanding, 
  exchange, 
  symbol 
}) => {
  if (!dcfResult) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
        Valuation Bridge
      </h4>
      <div className="bg-[#F8F9FB] border border-[#E5E8EF] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-sans">
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-medium text-slate-600 flex items-center gap-1.5">
            PV of Projected Cash Flows
            <span className="text-[10px] text-slate-400">({(100 - (dcfResult.pvTerminalValue / dcfResult.enterpriseValue * 100)).toFixed(1)}% of EV)</span>
          </span>
          <span className="font-mono font-bold text-slate-900">{formatMarketCap(dcfResult.pvFcfSum, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-medium text-slate-600 flex items-center gap-1.5">
            PV of Terminal Value
            <span className="text-[10px] text-slate-400 font-bold">({(dcfResult.pvTerminalValue / dcfResult.enterpriseValue * 100).toFixed(1)}% of EV)</span>
          </span>
          <span className="font-mono font-bold text-slate-900">{formatMarketCap(dcfResult.pvTerminalValue, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-bold text-[#059669]">Enterprise Value (EV)</span>
          <span className="font-mono font-extrabold text-[#059669]">{formatMarketCap(dcfResult.enterpriseValue, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-medium text-slate-600">Cash & Equivalents (+)</span>
          <span className="font-mono font-bold text-slate-900">{formatMarketCap(cashAndEquivalents, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-medium text-slate-600">Total Debt (−)</span>
          <span className="font-mono font-bold text-slate-900">{formatMarketCap(totalDebt, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-medium text-slate-600">Net Debt</span>
          <span className="font-mono font-bold text-slate-900">{formatMarketCap(dcfResult.netDebt, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-bold text-slate-800">Equity Value</span>
          <span className="font-mono font-extrabold text-slate-900">{formatMarketCap(dcfResult.equityValue, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
          <span className="font-medium text-slate-600">Shares Outstanding</span>
          <span className="font-mono font-bold text-slate-900">{formatShares(sharesOutstanding, exchange, symbol)}</span>
        </div>
        <div className="flex justify-between items-center py-2.5 col-span-1 md:col-span-2 border-t border-slate-200 mt-1">
          <span className="font-black text-sm text-slate-900">Intrinsic Value / Share</span>
          <span className="font-mono font-black text-lg text-[#059669]">
            {formatPrice(dcfResult.fairValuePerShare, exchange, symbol)}
          </span>
        </div>
      </div>
    </div>
  );
};
