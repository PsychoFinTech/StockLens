import React from "react";
import { useFredSeries } from "../hooks/useFredSeries";
import { MACRO_CONFIG, MacroSeriesId } from "../constants/macroConfig";
import { calcSpread } from "../utils/macroHelpers";
import { HeroSpreadCard } from "../components/macro/HeroSpreadCard";
import { MacroRegimeCard } from "../components/macro/MacroRegimeCard";
import { IndicatorCard } from "../components/macro/IndicatorCard";
import { MacroSkeleton } from "../components/macro/MacroSkeleton";
import { Globe } from "lucide-react";

const ALL_SERIES: MacroSeriesId[] = [
  "FEDFUNDS",
  "DGS10",
  "DGS2",
  "T10Y2Y",
  "BAMLH0A0HYM2",
  "CPIAUCSL",
  "PCEPI",
  "UNRATE",
  "PAYEMS",
  "GDPC1",
  "ICSA",
  "M2SL",
  "RSAFS",
  "HOUST",
  "UMCSENT"
];

export const MacroIndicatorsPage: React.FC = () => {
  const { data, loading, errors, refetch } = useFredSeries(ALL_SERIES);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
            📊 Macro Indicators
          </h1>
          <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
            <p>Key U.S. economic data · Source: Federal Reserve (FRED)</p>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <MacroSkeleton />
      </div>
    );
  }

  // Calculate yield curve spread if both DGS10 and DGS2 are loaded
  const dgs10 = data?.DGS10 || [];
  const dgs2 = data?.DGS2 || [];
  const spreadData = dgs10.length > 0 && dgs2.length > 0 ? calcSpread(dgs10, dgs2) : [];

  const SectionHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <h3 className="font-bold font-sans text-gray-900 mb-4 flex items-center gap-2 text-lg">
      {icon && <span>{icon}</span>} {title}
    </h3>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-black flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
          📊 Macro Indicators
        </h1>
        <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
          <p>Key U.S. economic data · Source: Federal Reserve (FRED)</p>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* HERO CARD */}
      {spreadData.length > 0 && <HeroSpreadCard spreadData={spreadData} />}

      {/* MACRO REGIME IDENTIFIER */}
      <MacroRegimeCard 
        t10y2y={data?.T10Y2Y || []}
        unrate={data?.UNRATE || []}
        baml={data?.BAMLH0A0HYM2 || []}
        cpi={data?.CPIAUCSL || []}
      />

      {/* INDICATOR CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        
        {/* Section A */}
        <div className="p-6 border border-white/50 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5">
          <SectionHeader title="Rates & Yields" icon="📈" />
          <div className="grid grid-cols-1 gap-4">
            {(["FEDFUNDS", "DGS10", "DGS2", "T10Y2Y", "BAMLH0A0HYM2"] as MacroSeriesId[]).map((id) => (
              <IndicatorCard
                key={id}
                config={MACRO_CONFIG[id]}
                observations={data?.[id] || []}
                error={errors[id]}
                onRetry={() => refetch(id)}
              />
            ))}
          </div>
        </div>

        {/* Section B & C Column */}
        <div className="space-y-10">
          <div className="p-6 border border-white/50 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5">
            <SectionHeader title="Inflation & Growth" icon="💹" />
            <div className="grid grid-cols-1 gap-4">
              {(["CPIAUCSL", "PCEPI", "GDPC1", "M2SL"] as MacroSeriesId[]).map((id) => (
                <IndicatorCard
                  key={id}
                  config={MACRO_CONFIG[id]}
                  observations={data?.[id] || []}
                  error={errors[id]}
                  onRetry={() => refetch(id)}
                />
              ))}
            </div>
          </div>

          <div className="p-6 border border-white/50 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5">
            <SectionHeader title="Labor Market" icon="👷" />
            <div className="grid grid-cols-1 gap-4">
              {(["UNRATE", "PAYEMS", "ICSA"] as MacroSeriesId[]).map((id) => (
                <IndicatorCard
                  key={id}
                  config={MACRO_CONFIG[id]}
                  observations={data?.[id] || []}
                  error={errors[id]}
                  onRetry={() => refetch(id)}
                />
              ))}
            </div>
          </div>

          <div className="p-6 border border-white/50 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5">
            <SectionHeader title="Consumer & Housing" icon="🛍️" />
            <div className="grid grid-cols-1 gap-4">
              {(["RSAFS", "HOUST", "UMCSENT"] as MacroSeriesId[]).map((id) => (
                <IndicatorCard
                  key={id}
                  config={MACRO_CONFIG[id]}
                  observations={data?.[id] || []}
                  error={errors[id]}
                  onRetry={() => refetch(id)}
                />
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
