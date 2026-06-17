import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Label
} from 'recharts';
import { formatPrice } from '../utils/formatters.js';
import { ShieldAlert, RefreshCw, Plus, Check, TrendingUp, TrendingDown } from 'lucide-react';

interface ChartPoint {
  date: string;
  timestamp: number;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

interface ChartProps {
  symbol: string;
  exchange?: string;
  livePrice?: number;
}

const PERIOD_TABS = [
  { label: '1D', value: '1D', labelText: 'past day' },
  { label: '5D', value: '5D', labelText: 'past 5 days' },
  { label: '1M', value: '1M', labelText: 'past month' },
  { label: '6M', value: '6M', labelText: 'past 6 months' },
  { label: 'YTD', value: 'YTD', labelText: 'year to date' },
  { label: '1Y', value: '1Y', labelText: 'past year' },
  { label: '5Y', value: '5Y', labelText: 'past 5 years' },
  { label: 'Max', value: 'MAX', labelText: 'all time' }
];

const intervalMap: Record<string, string> = {
  '1D': '5min',
  '5D': '15min',
  '1M': '1day',
  '6M': '1day',
  'YTD': '1day',
  '1Y': '1week',
  '5Y': '1month',
  'Max': '1month'
};

export const ChartPreview: React.FC<ChartProps> = ({ symbol, exchange = 'US', livePrice }) => {
  const [selectedTab, setSelectedTab] = useState('1Y');
  const [isFollowing, setIsFollowing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  const activePeriod = PERIOD_TABS.find(t => t.label === selectedTab) || PERIOD_TABS[5];
  const queryPeriod = activePeriod.value;
  const intervalQueryParam = intervalMap[selectedTab] || '1day';

  // Query chart with timeframe-specific cached entries
  const { data: chartData, isPending, isError, refetch } = useQuery<ChartPoint[]>({
    queryKey: ['chart', symbol, queryPeriod, intervalQueryParam],
    queryFn: async () => {
      const resp = await apiClient.get(`/chart/${encodeURIComponent(symbol)}?period=${queryPeriod}&interval=${intervalQueryParam}`);
      return resp.data || [];
    },
    staleTime: 60000 
  });

  const handleTimeframeChange = (tf: string) => {
    setSelectedTab(tf);
    setHoveredPoint(null);
  };

  const getCurveType = (tab: string): 'linear' | 'monotone' | 'basis' => {
    if (tab === '1D' || tab === '5D') return 'linear';
    if (tab === '1M' || tab === '6M' || tab === 'YTD') return 'monotone';
    return 'basis'; 
  };

  const firstPoint = chartData?.[0];
  const lastPoint = chartData?.[chartData.length - 1];
  
  const initialPrice = firstPoint?.close ?? 0;
  const currentPrice = lastPoint?.close ?? 0;
  
  const activePriceVal = hoveredPoint ? hoveredPoint.close : currentPrice;
  const priceDiff = activePriceVal - initialPrice;
  const priceDiffPct = initialPrice > 0 ? (priceDiff / initialPrice) * 100 : 0;
  const isUp = priceDiff >= 0;

  // Determine the reference line price - dynamically sourced from livePrice prop, falling back to current price
  const referencePrice = livePrice || currentPrice || 0;

  let yMin: number | 'auto' = 'auto';
  let yMax: number | 'auto' = 'auto';
  if (chartData && chartData.length > 0) {
    const closes = chartData.map(d => d.close);
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const spread = maxClose - minClose;
    const padding = spread * 0.12 || minClose * 0.04 || 1; 
    yMin = Math.max(0, Math.floor(minClose - padding));
    yMax = Math.ceil(maxClose + padding);
  }

  const getCurrencyCode = (ex: string) => {
    const uppercaseEx = (ex || '').toUpperCase();
    if (uppercaseEx.includes('NSE') || uppercaseEx.includes('BSE') || uppercaseEx.includes('INDIA')) {
      return 'INR';
    }
    if (uppercaseEx.includes('NYSE') || uppercaseEx.includes('NASDAQ') || uppercaseEx.includes('US') || uppercaseEx.includes('OTC')) {
      return 'USD';
    }
    if (uppercaseEx.includes('LSE') || uppercaseEx.includes('LONDON')) {
      return 'GBP';
    }
    return 'USD';
  };
  const currencyCode = getCurrencyCode(exchange);

  const renderStatusText = () => {
    if (hoveredPoint) {
      return (
        <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 transition-all duration-150">
          Viewing point: {hoveredPoint.date}
        </span>
      );
    }
    if (lastPoint) {
      return (
        <span className="text-[11px] font-semibold text-slate-500">
          Last updated: <span className="text-slate-800 font-bold">{lastPoint.date}</span> · Real-time Feeds
        </span>
      );
    }
    return <span className="text-[11px] font-semibold text-slate-500">Market closed · Feeds active</span>;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-[#E5E8EF] bg-white px-3.5 py-2.5 shadow-sm font-sans text-xs flex flex-col gap-0.5 pointer-events-none select-none min-w-[130px]">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Price</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatPrice(data.close, exchange)} {currencyCode}
          </span>
          <div className="h-px bg-slate-100 my-1.5" />
          <span className="text-[10px] text-slate-700 font-semibold">{data.date}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-[#E5E8EF] bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-6 font-sans relative overflow-hidden">
      
      {/* Decorative top-right accent glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full filter blur-[85px] opacity-[0.05] transition-colors duration-500 pointer-events-none bg-[#1A6EFF]" />

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-sans tabular-nums leading-none">
              {activePriceVal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono bg-slate-50 px-2 py-0.5 rounded border border-[#E5E8EF]">
              {currencyCode}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.75 rounded-full transition-colors duration-300 ${
              isUp 
                ? 'bg-emerald-50 text-[#16A34A] border border-[#16A34A]/15' 
                : 'bg-rose-50 text-[#DC2626] border border-[#DC2626]/15'
            }`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isUp ? '+' : ''}{priceDiffPct.toFixed(2)}%
            </div>
            <span className={`text-xs font-bold transition-colors duration-300 ${isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {isUp ? '+' : ''}{priceDiff.toFixed(2)} {activePeriod.labelText}
            </span>
          </div>

          <div className="mt-2.5 h-5 flex items-center">
            {renderStatusText()}
          </div>
        </div>

        {/* Track stock button */}
        <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-5 py-2 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 transition-all duration-200 select-none border active:scale-[0.98] ${
            isFollowing 
              ? 'bg-[#1A6EFF]/10 text-[#1A6EFF] border-[#1A6EFF]/20 hover:bg-[#1A6EFF]/20' 
              : 'bg-[#1A6EFF] border-[#1A6EFF] text-white hover:bg-[#1A6EFF]/90 shadow-sm'
          }`}
        >
          {isFollowing ? (
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Watching</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Track stock</span>
            </span>
          )}
        </button>
      </div>

      {/* Pill switcher for timeframes */}
      <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center overflow-x-auto scrollbar-none w-full z-10">
        <div className="flex items-center w-full justify-between sm:justify-start gap-1">
          {PERIOD_TABS.map((p) => {
            const isActive = selectedTab === p.label;
            return (
              <button
                key={p.label}
                onClick={() => handleTimeframeChange(p.label)}
                className={`font-sans text-[11px] font-bold transition-all duration-200 py-1.5 px-3.5 rounded-lg select-none uppercase tracking-wider text-center ${
                  isActive 
                    ? 'bg-[#1A6EFF] text-white shadow-sm font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-64 sm:h-[290px] w-full mt-2 z-10">
        {isPending ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/20 gap-3 border border-dashed border-[#E5E8EF] rounded-xl">
            <RefreshCw className="h-7 w-7 animate-spin text-slate-400" />
            <p className="font-mono text-xs text-slate-400 font-medium">Refining market feeds...</p>
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50/20 text-rose-800 gap-2 border border-dashed border-rose-200/70 rounded-xl px-6 py-8 text-center">
            <ShieldAlert className="h-6 w-6 text-rose-500" />
            <span className="font-sans font-bold text-xs text-slate-800">Connection Interrupted</span>
            <button 
              onClick={() => refetch()} 
              className="mt-2.5 px-4 py-1.5 bg-[#1A6EFF] text-white rounded-lg text-[11px] font-bold transition active:scale-[0.98]"
            >
              Reload candle
            </button>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <div className="h-full w-full animate-in fade-in duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 12, right: 8, left: -24, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    setHoveredPoint(e.activePayload[0].payload as ChartPoint);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                }}
              >
                <defs>
                  <linearGradient id="gradientTrendBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor="#1A6EFF" 
                      stopOpacity={0.15} 
                    />
                    <stop 
                      offset="95%" 
                      stopColor="#1A6EFF" 
                      stopOpacity={0.00} 
                    />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} opacity={0.65} />
                
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontFamily="Inter, sans-serif"
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  dy={10}
                  minTickGap={45}
                />
                
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontFamily="Inter, sans-serif"
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${Number(val).toFixed(0)}`}
                  domain={[yMin, yMax]}
                  dx={-6}
                />
                
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} 
                />

                {/* Horizontal reference line dynamically sourced from the livePrice prop */}
                {referencePrice > 0 && (
                  <ReferenceLine 
                    y={referencePrice} 
                    stroke="#1A6EFF" 
                    strokeDasharray="3 3" 
                    strokeWidth={1.5}
                  >
                    <Label 
                      value={`Current: ${formatPrice(referencePrice, exchange)}`} 
                      position="insideTopRight" 
                      fill="#1A6EFF" 
                      fontSize={10} 
                      fontWeight={600} 
                      fontFamily="Inter, sans-serif"
                      dy={-6}
                      dx={-10}
                    />
                  </ReferenceLine>
                )}
                
                <Area 
                  type={getCurveType(selectedTab)} 
                  dataKey="close" 
                  stroke="#1A6EFF" 
                  strokeWidth={2.0}
                  fillOpacity={1} 
                  fill="url(#gradientTrendBlue)" 
                  activeDot={{ r: 5, stroke: '#1A6EFF', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/20 gap-2 border border-dashed border-[#E5E8EF] rounded-xl">
            <span className="font-sans font-semibold text-slate-400 text-xs">No historical market points yet</span>
          </div>
        )}
      </div>

    </div>
  );
};
