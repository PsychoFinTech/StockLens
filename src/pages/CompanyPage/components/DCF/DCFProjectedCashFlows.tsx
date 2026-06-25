import React from 'react';
import { formatMarketCap, formatPercentChange } from '../../../../utils/formatters.js';

interface DCFProjectedCashFlowsProps {
  dcfResult: any;
  exchange: string;
  symbol: string;
}

export const DCFProjectedCashFlows: React.FC<DCFProjectedCashFlowsProps> = ({ dcfResult, exchange, symbol }) => {
  if (!dcfResult) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
        Projected Free Cash Flows
      </h4>
      <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl">
        <table className="min-w-full divide-y divide-[#E5E8EF] text-xs font-sans text-slate-700 bg-white">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E5E8EF] text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-left">
              <th className="py-2.5 px-4">Year</th>
              <th className="text-right py-2.5 px-4">Revenue</th>
              <th className="text-right py-2.5 px-4">Revenue Growth</th>
              <th className="text-right py-2.5 px-4">FCF Margin</th>
              <th className="text-right py-2.5 px-4">Projected FCF</th>
              <th className="text-right py-2.5 px-4">Discounted FCF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EF]">
            {dcfResult.projectedYears.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                <td className="py-2.5 px-4 font-mono font-bold text-slate-600">Year {idx + 1} ({item.year})</td>
                <td className="text-right py-2.5 px-4 font-mono">{formatMarketCap(item.revenue, exchange, symbol)}</td>
                <td className="text-right py-2.5 px-4 font-mono font-semibold text-slate-600">{formatPercentChange(item.growthRate * 100)}</td>
                <td className="text-right py-2.5 px-4 font-mono text-slate-600">{(item.fcfMargin * 100).toFixed(1)}%</td>
                <td className="text-right py-2.5 px-4 font-mono">{formatMarketCap(item.fcf, exchange, symbol)}</td>
                <td className="text-right py-2.5 px-4 font-mono font-semibold text-[#1A6EFF]">
                  {formatMarketCap(item.discountedFcf, exchange, symbol)}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50/60 font-bold border-t border-[#E5E8EF]">
              <td className="py-2.5 px-4 text-slate-800">Terminal Value (TV)</td>
              <td className="text-right py-2.5 px-4 font-mono text-slate-400">—</td>
              <td className="text-right py-2.5 px-4 font-mono text-slate-400">—</td>
              <td className="text-right py-2.5 px-4 font-mono text-slate-400">—</td>
              <td className="text-right py-2.5 px-4 font-mono">{formatMarketCap(dcfResult.terminalValue, exchange, symbol)}</td>
              <td className="text-right py-2.5 px-4 font-mono text-[#1A6EFF]">
                {formatMarketCap(dcfResult.pvTerminalValue, exchange, symbol)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
