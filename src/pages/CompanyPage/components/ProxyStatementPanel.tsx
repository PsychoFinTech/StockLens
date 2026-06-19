import React, { useState } from 'react';
import { Calendar, DollarSign, Users, Award, Shield, FileText, ExternalLink, AlertCircle, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { formatDate } from '../../../utils/formatters.js';

interface Executive {
  name: string;
  title: string;
  salary: number | null;
  bonus: number | null;
  stockAwards: number | null;
  optionAwards: number | null;
  nonEquityIncentive: number | null;
  otherCompensation: number | null;
  total: number | null;
}

interface Director {
  name: string;
  independent: boolean | null;
  committees: string[];
  feesEarned: number | null;
  stockAwards: number | null;
  total: number | null;
}

interface AuditFeeYear {
  year: string;
  auditFee: number | null;
  auditRelatedFee: number | null;
  taxFee: number | null;
  allOtherFee: number | null;
  total: number | null;
}

interface ShareholderProposal {
  item: string;
  description: string;
  boardRecommendation: string | null;
}

interface ProxyData {
  symbol: string;
  filedDate: string;
  periodOfReport: string;
  secUrl: string;
  annualMeeting: {
    meetingDate: string | null;
    recordDate: string | null;
    meetingType: 'virtual' | 'in-person' | 'hybrid' | null;
    location: string | null;
  };
  executiveCompensation: {
    year: string;
    executives: Executive[];
  }[];
  boardOfDirectors: {
    directors: Director[];
  };
  auditFees: AuditFeeYear[];
  shareholderProposals: ShareholderProposal[];
}

interface ProxyStatementPanelProps {
  data: ProxyData | null;
  isPending: boolean;
  isError: boolean;
  upperSymbol: string;
}

// Formatting Helper
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
};

export const ProxyStatementPanel: React.FC<ProxyStatementPanelProps> = ({
  data,
  isPending,
  isError,
  upperSymbol
}) => {
  const [selectedCompYear, setSelectedCompYear] = useState<string>('');

  if (isPending) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-20 bg-slate-100 rounded-xl border border-slate-200/60 p-5 flex flex-col justify-center space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>

        {/* Info Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 border border-slate-200/60 rounded-xl p-4 space-y-3">
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              <div className="h-5 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 border border-slate-200/60 rounded-xl p-5"></div>
          <div className="h-80 bg-slate-100 border border-slate-200/60 rounded-xl p-5"></div>
        </div>
      </div>
    );
  }

  const isInvalidData = !data || typeof data !== 'object' || typeof data.annualMeeting !== 'object';
  if (isError || isInvalidData) {
    return (
      <div className="bg-red-50/50 border border-red-200 rounded-xl p-6 text-center space-y-4 max-w-2xl mx-auto my-8">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-800">Proxy Statement Unavailable</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            We couldn't retrieve the DEF 14A proxy statement for {upperSymbol}. This typically happens for non-US listings, recently listed firms, or when SEC EDGAR experiences connection timeouts.
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`https://www.sec.gov/edgar/searchedgar/companysearch`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
          >
            <span>Search SEC EDGAR</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Set default selected year if not set
  const compYears = data?.executiveCompensation || [];
  const activeYear = selectedCompYear || (compYears[0]?.year || '');
  const activeExecutives = compYears.find(y => y.year === activeYear)?.executives || [];
  const directors = data?.boardOfDirectors?.directors || [];
  const auditFees = data?.auditFees || [];
  const shareholderProposals = data?.shareholderProposals || [];
  const annualMeeting = data?.annualMeeting || { meetingDate: null, recordDate: null, meetingType: null, location: null };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* ─── HEADER BANNER ─── */}
      <div className="bg-slate-50 border border-[#E5E8EF] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#059669] text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">DEF 14A</span>
            <h4 className="text-sm font-bold text-slate-900">Annual Meeting & Proxy Statement Details</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Period of Report: FY {data.periodOfReport} • Filed on {formatDate(data.filedDate)}
          </p>
        </div>
        <a
          href={data.secUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5E8EF] hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition"
        >
          <span>View on SEC.gov</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#059669]" />
        </a>
      </div>

      {/* ─── ANNUAL MEETING DETAILS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Meeting Date Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-4 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="p-3 bg-emerald-50 rounded-xl text-[#059669] shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meeting Date</span>
            <div className="text-xs font-bold text-slate-800">
              {annualMeeting.meetingDate || 'To Be Announced'}
            </div>
          </div>
        </div>

        {/* Record Date Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-4 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record Date</span>
            <div className="text-xs font-bold text-slate-800">
              {annualMeeting.recordDate || 'Not Specified'}
            </div>
          </div>
        </div>

        {/* Meeting Type Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-4 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format / Type</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-800 capitalize">
                {annualMeeting.meetingType || 'virtual'} Meeting
              </span>
              <span className="bg-purple-100/60 text-purple-700 text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase">
                {annualMeeting.meetingType || 'virtual'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT PANEL GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Executive Compensation Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-3">
            <div>
              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="h-4.5 w-4.5 text-[#059669]" />
                <span>Executive Compensation (NEO Pay)</span>
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Summary Compensation Table (SCT) details</p>
            </div>
            
            {/* Year Selector */}
            {compYears.length > 1 && (
              <div className="flex bg-slate-50 border border-[#E5E8EF] p-0.5 rounded-lg text-[10px]">
                {compYears.map(y => (
                  <button
                    key={y.year}
                    onClick={() => setSelectedCompYear(y.year)}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      activeYear === y.year
                        ? 'bg-white text-[#059669] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {y.year}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 flex-1 overflow-x-auto">
            {activeExecutives.length > 0 ? (
              <div className="min-w-full space-y-4">
                {activeExecutives.map((exec, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex justify-between items-center gap-4 hover:border-emerald-150 hover:bg-emerald-50/5 transition duration-150">
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="text-xs font-bold text-slate-800">{exec.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">{exec.title}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-xs font-extrabold text-[#059669]">{formatCurrency(exec.total)}</div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        Base: {formatCurrency(exec.salary)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No executive compensation records parsed for FY {activeYear}.
              </div>
            )}
          </div>
        </div>

        {/* Board of Directors Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-[#059669]" />
              <span>Board of Directors & Compensation</span>
            </h5>
            <p className="text-[10px] text-slate-400 mt-0.5">Independent non-employee director profiles</p>
          </div>

          <div className="p-5 flex-1 max-h-[350px] overflow-y-auto scrollbar-thin">
            {directors.length > 0 ? (
              <div className="space-y-3.5">
                {directors.map((dir, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{dir.name}</span>
                        {dir.independent && (
                          <span className="bg-emerald-50 text-[#059669] text-[8.5px] px-1 rounded-sm font-bold uppercase font-sans">
                            Ind
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap text-[9px] text-slate-400">
                        <span>Board Member</span>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-xs font-bold text-slate-700">{formatCurrency(dir.total)}</div>
                      <div className="text-[9px] text-slate-400">
                        Fees: {formatCurrency(dir.feesEarned)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No non-employee director compensation records parsed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW: AUDIT FEES & BALLOT PROPOSALS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Audit Fees Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div>
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-[#059669]" />
              <span>Independent Auditor Fees</span>
            </h5>
            <p className="text-[10px] text-slate-400 mt-0.5">Fees paid to auditor for professional services</p>
          </div>

          {auditFees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs font-sans text-slate-650">
                <thead>
                  <tr className="border-b border-[#E5E8EF]">
                    <th className="text-left pb-2 font-bold text-slate-400 uppercase tracking-wide">Category</th>
                    {auditFees.map(af => (
                      <th key={af.year} className="text-right pb-2 font-bold text-slate-800">{af.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  <tr>
                    <td className="py-2.5 text-slate-700">Audit Fees</td>
                    {auditFees.map(af => (
                      <td key={af.year} className="text-right py-2.5 font-bold text-slate-900">{formatCurrency(af.auditFee)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">Audit-Related Fees</td>
                    {auditFees.map(af => (
                      <td key={af.year} className="text-right py-2.5 text-slate-600">{formatCurrency(af.auditRelatedFee)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">Tax Fees</td>
                    {auditFees.map(af => (
                      <td key={af.year} className="text-right py-2.5 text-slate-600">{formatCurrency(af.taxFee)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">All Other Fees</td>
                    {auditFees.map(af => (
                      <td key={af.year} className="text-right py-2.5 text-slate-600">{formatCurrency(af.allOtherFee)}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-100 font-bold bg-slate-50/40">
                    <td className="py-2.5 text-slate-900 font-extrabold">Total Fees</td>
                    {auditFees.map(af => (
                      <td key={af.year} className="text-right py-2.5 font-extrabold text-[#059669]">{formatCurrency(af.total)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No auditor fees records parsed.
            </div>
          )}
        </div>

        {/* Shareholder Proposals / Ballot Card */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div>
            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-[#059669]" />
              <span>Ballot Items & Shareholder Proposals</span>
            </h5>
            <p className="text-[10px] text-slate-400 mt-0.5">Annual meeting items & board recommendation cards</p>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto scrollbar-thin">
            {shareholderProposals.length > 0 ? (
              shareholderProposals.map((proposal, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/20 flex gap-3 items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800">{proposal.item}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {proposal.description}
                    </div>
                  </div>
                  
                  {/* Board recommendation badge */}
                  {proposal.boardRecommendation ? (
                    <div className="shrink-0 flex items-center gap-1 mt-0.5">
                      {proposal.boardRecommendation === 'FOR' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#059669] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          <CheckCircle className="h-3 w-3" />
                          <span>FOR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          <XCircle className="h-3 w-3" />
                          <span>AGAINST</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0">
                      <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                        No Rec
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No shareholder proposals parsed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
