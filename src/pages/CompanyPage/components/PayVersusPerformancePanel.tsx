import React from 'react';
import { HelpCircle, ExternalLink, AlertCircle } from 'lucide-react';

interface EdgarPvPFactValue {
  fy: number | null;
  fp: string | null;
  end: string | null;
  start: string | null;
  val: number;
  accn: string;
  form: string;
}

interface EdgarPvPConcept {
  tag: string;
  label: string;
  unit: string;
  values: EdgarPvPFactValue[];
}

interface EdgarPayVsPerformance {
  symbol: string;
  cik: string;
  available: boolean;
  reason?: string;
  concepts: EdgarPvPConcept[];
  sourceUrl: string;
}

interface PayVersusPerformancePanelProps {
  data: EdgarPayVsPerformance | null;
  isPending: boolean;
  isError: boolean;
  upperSymbol: string;
}

export const PayVersusPerformancePanel: React.FC<PayVersusPerformancePanelProps> = ({
  data,
  isPending,
  isError,
  upperSymbol,
}) => {
  if (isPending) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl border border-slate-200/60 w-full"></div>
        <div className="h-40 bg-slate-100 rounded-xl border border-slate-200/60 w-full"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 rounded-xl border border-rose-150 bg-rose-50/20 text-rose-900 text-xs flex items-center gap-2 font-mono">
        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
        <span>Could not load structured Pay versus Performance data for {upperSymbol}.</span>
      </div>
    );
  }

  if (!data.available) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-550 font-medium">
        <div className="flex items-center gap-2 text-slate-700">
          <AlertCircle className="h-4 w-4 text-slate-405 shrink-0" />
          <span className="font-bold">No structured PvP disclosure available</span>
        </div>
        <p className="text-[11px] leading-relaxed max-w-xl">
          {data.reason || `No 'ecd' taxonomy facts found. This company might be exempt (e.g. Foreign Private Issuer or Emerging Growth Company).`}
        </p>
        {data.sourceUrl && (
          <div className="pt-2">
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#059669] hover:underline text-[10.5px] font-bold"
            >
              <span>Verify Raw SEC Company Facts JSON</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // 1. Gather all unique years from all concepts, sorted descending
  const yearsSet = new Set<number>();
  data.concepts.forEach((concept) => {
    concept.values.forEach((v) => {
      if (typeof v.fy === 'number') {
        yearsSet.add(v.fy);
      }
    });
  });
  const years = Array.from(yearsSet).sort((a, b) => b - a);

  // 2. Format function depending on concept unit
  const formatVal = (val: number | null, unit: string) => {
    if (val === null || val === undefined) return '—';
    if (unit === 'USD') {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    if (unit === 'pure') {
      return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return `${val.toLocaleString()} (${unit})`;
  };

  // Helper to extract value for a concept and year
  const getValueForYear = (concept: EdgarPvPConcept, year: number) => {
    const matches = concept.values.filter((v) => v.fy === year);
    if (matches.length === 0) return null;
    // Prefer DEF 14A, fallback to others
    const def14aMatch = matches.find((v) => v.form === 'DEF 14A');
    const match = def14aMatch || matches[0];
    return match.val;
  };

  // 3. Remove concepts that have no values at all for our years list
  const activeConcepts = data.concepts.filter((concept) => {
    return years.some((yr) => getValueForYear(concept, yr) !== null);
  });

  if (activeConcepts.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center font-mono">
        Filer has ecd taxonomy data, but no entries could be aligned to a fiscal year.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl bg-white">
        <table className="min-w-full divide-y divide-[#E5E8EF] text-[13px] font-sans">
          <thead>
            <tr className="bg-[rgba(5,150,105,0.04)] text-[#059669] border-b border-[#E5E8EF] text-left text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-4 font-bold whitespace-nowrap">SEC Tagged Concept</th>
              {years.map((year) => (
                <th key={year} className="py-2.5 px-4 text-right font-bold whitespace-nowrap">
                  FY {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {activeConcepts.map((concept, idx) => {
              // Highlight PEO / Average NEO rows
              const isHighlight =
                concept.tag.toLowerCase().includes('peo') ||
                concept.tag.toLowerCase().includes('nonpeo');

              return (
                <tr
                  key={concept.tag}
                  className={`hover:bg-slate-50/50 transition ${
                    isHighlight ? 'bg-emerald-50/10 font-medium' : idx % 2 === 1 ? 'bg-slate-50/20' : 'bg-white'
                  }`}
                >
                  <td className="py-2.5 px-4 font-sans text-slate-800 whitespace-nowrap max-w-sm truncate" title={concept.label}>
                    <div className="font-semibold text-slate-900 leading-snug">{concept.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{concept.tag}</div>
                  </td>
                  {years.map((year) => {
                    const rawVal = getValueForYear(concept, year);
                    return (
                      <td key={year} className="py-2.5 px-4 text-right font-mono text-slate-900 whitespace-nowrap">
                        {formatVal(rawVal, concept.unit)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 text-[11px] text-slate-450 font-medium">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>This data is harvested live from the Inline XBRL tagged facts of the company's proxy statements.</span>
        </div>
        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#059669] hover:underline font-semibold"
          >
            <span>SEC Source facts.json</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
};
