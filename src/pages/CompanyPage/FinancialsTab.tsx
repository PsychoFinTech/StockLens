import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FinancialsTabProps {
  symbol: string;
  financials: any;
  isFinancialsPending: boolean;
  financialsErr: any;
  currencySuffixLabel: string;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({
  symbol,
  financials,
  isFinancialsPending,
  financialsErr,
  currencySuffixLabel,
}) => {
  const [activeStatementTab, setActiveStatementTab] = useState<'quarterly' | 'pnl' | 'balance' | 'cash'>('pnl');

  const hasData = financials && !isFinancialsPending && !financialsErr;

  // Map quarterly results
  const quarterlyResults = React.useMemo(() => {
    if (!hasData || !financials.quarterly || financials.quarterly.length === 0) return [];
    const periods = financials.quarterly.map((r: any) => r.quarter || r.date || '—');
    return [
      { particulars: "Revenue", periods, values: [financials.quarterly.map((r: any) => r.revenue ? r.revenue.toLocaleString() : '—')] },
      { particulars: "Net Profit / Net Income", periods, values: [financials.quarterly.map((r: any) => r.netIncome ? r.netIncome.toLocaleString() : '—')] },
      { particulars: "Adjusted EPS", periods, values: [financials.quarterly.map((r: any) => r.eps !== undefined && r.eps !== null ? r.eps.toFixed(2) : '—')] }
    ];
  }, [financials, hasData]);

  // Map P&L (Annual)
  const annualPnL = React.useMemo(() => {
    if (!hasData || !financials.incomeStatement || financials.incomeStatement.length === 0) return [];
    const periods = financials.incomeStatement.map((r: any) => String(r.year || r.date || '—'));
    return [
      { particulars: "Revenue", periods, values: [financials.incomeStatement.map((r: any) => r.revenue ? r.revenue.toLocaleString() : '—')] },
      { particulars: "Gross Profit", periods, values: [financials.incomeStatement.map((r: any) => r.grossProfit ? r.grossProfit.toLocaleString() : '—')] },
      { particulars: "Net Profit / Net Income", periods, values: [financials.incomeStatement.map((r: any) => r.netIncome ? r.netIncome.toLocaleString() : '—')] }
    ];
  }, [financials, hasData]);

  // Map Balance Sheet (Annual)
  const balanceSheet = React.useMemo(() => {
    if (!hasData || !financials.balanceSheet || financials.balanceSheet.length === 0) return [];
    const periods = financials.balanceSheet.map((r: any) => String(r.year || r.date || '—'));
    return [
      { particulars: "Total Assets", periods, values: [financials.balanceSheet.map((r: any) => r.assets ? r.assets.toLocaleString() : '—')] },
      { particulars: "Total Liabilities", periods, values: [financials.balanceSheet.map((r: any) => r.liabilities ? r.liabilities.toLocaleString() : '—')] },
      { particulars: "Shareholders' Equity", periods, values: [financials.balanceSheet.map((r: any) => r.equity ? r.equity.toLocaleString() : '—')] }
    ];
  }, [financials, hasData]);

  // Map Cash Flows (Annual)
  const cashFlows = React.useMemo(() => {
    if (!hasData || !financials.cashFlow || financials.cashFlow.length === 0) return [];
    const periods = financials.cashFlow.map((r: any) => String(r.year || r.date || '—'));
    return [
      { particulars: "Operating Cash Flow", periods, values: [financials.cashFlow.map((r: any) => r.operating ? r.operating.toLocaleString() : '—')] },
      { particulars: "Investing Cash Flow", periods, values: [financials.cashFlow.map((r: any) => r.investing ? r.investing.toLocaleString() : '—')] },
      { particulars: "Financing Cash Flow", periods, values: [financials.cashFlow.map((r: any) => r.financing ? r.financing.toLocaleString() : '—')] }
    ];
  }, [financials, hasData]);

  if (isFinancialsPending) {
    return (
      <div id="financials" className="bg-white border border-[#E5E8EF] rounded-xl p-8 text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mx-auto"></div>
        <p className="font-mono text-xs text-slate-400">Loading financial statements...</p>
      </div>
    );
  }

  if (financialsErr) {
    return (
      <div id="financials" className="bg-white border border-[#E5E8EF] rounded-xl p-8 text-center text-slate-400 font-mono text-xs">
        Failed to load financials data.
      </div>
    );
  }

  const currentStatementData = 
    activeStatementTab === 'quarterly' ? quarterlyResults :
    activeStatementTab === 'pnl' ? annualPnL :
    activeStatementTab === 'balance' ? balanceSheet :
    cashFlows;

  return (
    <div id="financials" className="space-y-6 scroll-mt-20">
      <div id="statements-sect" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
              Financial Results & Statements
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-1">All historical variables and details are formatted in consolidated millions/crores.</p>
          </div>

          {/* Tab buttons switcher - styled as pill toggles */}
          <div className="flex bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0 gap-1">
            {[
              { id: 'quarterly', label: 'Quarterly Result' },
              { id: 'pnl', label: 'Profit & Loss' },
              { id: 'balance', label: 'Balance Sheet' },
              { id: 'cash', label: 'Cash Flows' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatementTab(tab.id as any)}
                className={`flex-1 lg:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeStatementTab === tab.id 
                    ? 'bg-[#059669] text-white shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Render Zone */}
        {currentStatementData.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            {activeStatementTab === 'quarterly' 
              ? 'Quarterly data unavailable for this company' 
              : 'Annual financial statement data unavailable for this company'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
              <thead>
                <tr className="bg-[rgba(5,150,105,0.06)] text-[#059669] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold text-left whitespace-nowrap">Particulars</th>
                  {currentStatementData[0]?.periods.map((period: string, i: number) => (
                    <th key={i} className="text-right py-3.5 px-4 font-bold pl-4 whitespace-nowrap">{period}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentStatementData.map((row: any, rIdx: number) => {
                  const isBoldRow = ['Revenue', 'Gross Profit', 'Net Profit / Net Income', 'Total Assets', 'Total Liabilities', 'Shareholders\' Equity', 'Operating Cash Flow'].includes(row.particulars);
                  const isEven = rIdx % 2 === 1;
                  return (
                    <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[rgba(5,150,105,0.06)]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                        <span>{row.particulars}</span>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-655 cursor-pointer shrink-0" />
                      </td>
                      {row.values[0]?.map((value: any, vIdx: number) => (
                        <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium whitespace-nowrap">{value}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
