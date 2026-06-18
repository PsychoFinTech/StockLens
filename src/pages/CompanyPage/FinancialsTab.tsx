import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FinancialsTabProps {
  detailData: any;
  currencySuffixLabel: string;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({
  detailData,
  currencySuffixLabel,
}) => {
  const [activeStatementTab, setActiveStatementTab] = useState<'quarterly' | 'pnl' | 'balance' | 'cash' | 'corpAction'>('quarterly');
  const [activeCorpActionSubTab, setActiveCorpActionSubTab] = useState<'dividend' | 'bonus' | 'rights' | 'splits'>('dividend');

  return (
    <div id="financials" className="space-y-6 scroll-mt-20">
      <div id="statements-sect" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
              Financial Results & Statements
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-1">All historical variables and details are formatted in consolidated cr.</p>
          </div>

          {/* Tab buttons switcher - styled as pill toggles */}
          <div className="flex bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0 gap-1">
            {[
              { id: 'quarterly', label: 'Quarterly Result' },
              { id: 'pnl', label: 'Profit & Loss' },
              { id: 'balance', label: 'Balance Sheet' },
              { id: 'cash', label: 'Cash Flows' },
              { id: 'corpAction', label: 'Corp. Actions' }
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

        {/* Table Render Zone with alternating rows and no vertical borders */}
        {activeStatementTab === 'quarterly' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                <thead>
                  <tr className="bg-[rgba(5,150,105,0.06)] text-[#059669] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                    {detailData.quarterlyResults[0]?.periods.map((period: string, i: number) => (
                      <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {detailData.quarterlyResults.map((row: any, rIdx: number) => {
                    const isBoldRow = ['Net Sales', 'Revenue', 'Gross Profit', 'Operating Profit', 'Operating Profit (EBITDA)', 'Profit After Tax', 'Net Profit / Net Income', 'Total Income'].includes(row.particulars);
                    const isEven = rIdx % 2 === 1;
                    return (
                      <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[rgba(5,150,105,0.06)]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                          <span>{row.particulars}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                        </td>
                        {row.values[0]?.map((value: any, vIdx: number) => (
                          <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStatementTab === 'pnl' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                <thead>
                  <tr className="bg-[rgba(5,150,105,0.06)] text-[#059669] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                    {detailData.annualPnL[0]?.periods.map((period: string, i: number) => (
                      <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {detailData.annualPnL.map((row: any, rIdx: number) => {
                    const isBoldRow = ['Net Sales', 'Revenue', 'Gross Profit', 'Operating Profit', 'Operating Profit (EBITDA)', 'Net Profit', 'Net Profit / Net Income', 'Total Revenue'].includes(row.particulars);
                    const isEven = rIdx % 2 === 1;
                    return (
                      <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[rgba(5,150,105,0.06)]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                          <span>{row.particulars}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                        </td>
                        {row.values[0]?.map((value: any, vIdx: number) => (
                          <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStatementTab === 'balance' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                <thead>
                  <tr className="bg-[rgba(5,150,105,0.06)] text-[#059669] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                    {detailData.balanceSheet[0]?.periods.map((period: string, i: number) => (
                      <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {detailData.balanceSheet.map((row: any, rIdx: number) => {
                    const isBoldRow = ['Total Reserves', 'Total Shareholders\' Equity', 'Total Debt (Borrowings)', 'Total Liabilities', 'Total Assets'].includes(row.particulars);
                    const isEven = rIdx % 2 === 1;
                    return (
                      <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[rgba(5,150,105,0.06)]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                          <span>{row.particulars}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                        </td>
                        {row.values[0]?.map((value: any, vIdx: number) => (
                          <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStatementTab === 'cash' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                <thead>
                  <tr className="bg-[rgba(5,150,105,0.06)] text-[#059669] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                    {detailData.cashFlows[0]?.periods.map((period: string, i: number) => (
                      <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {detailData.cashFlows.map((row: any, rIdx: number) => {
                    const isBoldRow = ['Operating Cash Flow', 'Net Cash Flow', 'Free Cash Flow (FCF)'].includes(row.particulars);
                    const isEven = rIdx % 2 === 1;
                    return (
                      <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[rgba(5,150,105,0.06)]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                          <span>{row.particulars}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                        </td>
                        {row.values[0]?.map((value: any, vIdx: number) => (
                          <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStatementTab === 'corpAction' && (
          <div className="space-y-5">
            {/* Sub-tabs switchers */}
            <div className="flex bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] max-w-sm gap-1">
              {[
                { id: 'dividend', label: 'Dividend' },
                { id: 'bonus', label: 'Bonus' },
                { id: 'rights', label: 'Rights' },
                { id: 'splits', label: 'Splits' }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveCorpActionSubTab(subTab.id as any)}
                  className={`flex-1 px-3 py-1.5 font-sans text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    activeCorpActionSubTab === subTab.id 
                      ? 'bg-[#059669] text-white shadow-sm font-bold' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {activeCorpActionSubTab === 'dividend' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                  <thead>
                    <tr className="text-slate-500 font-bold text-left border-b border-[#E5E8EF] text-[11.5px] uppercase tracking-wider">
                      <th className="py-2 font-bold text-left">EX DATE</th>
                      <th className="py-2 font-bold">RECORD DATE</th>
                      <th className="py-2 text-center font-bold">DIVIDEND %</th>
                      <th className="py-2 text-right font-bold">
                        AMOUNT <span className="text-[#94A3B8] text-[9.5px] font-normal lowercase normal-case ml-0.5">{currencySuffixLabel}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {detailData.corporateActions.dividend.length > 0 ? (
                      detailData.corporateActions.dividend.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-2.5 font-bold text-slate-950">{row.exDate}</td>
                          <td className="py-2.5 text-slate-600">{row.recordDate}</td>
                          <td className="py-2.5 text-center font-semibold text-slate-800">{row.divPct}%</td>
                          <td className="py-2.5 text-right font-bold text-[#16A34A] font-mono">{row.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">No recent dividends reported.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeCorpActionSubTab === 'bonus' && (
              <div className="overflow-x-auto animate-in fade-in duration-100">
                <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                  <thead>
                    <tr className="text-slate-500 font-bold text-left border-b border-[#E5E8EF] text-[11.5px] uppercase tracking-wider">
                      <th className="py-2 font-bold text-left">EX DATE</th>
                      <th className="py-2 text-right font-bold">RATIO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {detailData.corporateActions.bonus.length > 0 ? (
                      detailData.corporateActions.bonus.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-2.5 font-bold text-slate-950">{row.exDate}</td>
                          <td className="py-2.5 text-right font-bold text-[#16A34A]">{row.ratio}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-slate-400">No recent bonus declarations.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeCorpActionSubTab === 'rights' && (
              <div className="overflow-x-auto animate-in fade-in duration-100">
                <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                  <thead>
                    <tr className="text-slate-500 font-bold text-left border-b border-[#E5E8EF] text-[11.5px] uppercase tracking-wider">
                      <th className="py-2 font-bold text-left">EX DATE</th>
                      <th className="py-2 text-center font-bold">RATIO</th>
                      <th className="py-2 text-right font-bold">PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {detailData.corporateActions.rights.length > 0 ? (
                      detailData.corporateActions.rights.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-2.5 font-semibold text-slate-950">{row.exDate}</td>
                          <td className="py-2.5 text-center font-bold text-slate-800">{row.ratio}</td>
                          <td className="py-2.5 text-right font-bold text-[#059669] font-mono">₹ {row.price}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-400">No active rights operations.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeCorpActionSubTab === 'splits' && (
              <div className="py-4 text-center text-slate-400 text-xs font-mono animate-in fade-in duration-100">
                No stock split data reported for this asset.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
