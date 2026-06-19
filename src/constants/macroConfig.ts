
export type MacroSeriesId = 
  | "FEDFUNDS"
  | "DGS10"
  | "DGS2"
  | "T10Y2Y"
  | "BAMLH0A0HYM2"
  | "CPIAUCSL"
  | "PCEPI"
  | "UNRATE"
  | "PAYEMS"
  | "GDPC1"
  | "ICSA";

export interface MacroSeriesConfig {
  id: MacroSeriesId;
  name: string;
  section: string;
  formatter: (val: number) => string;
}

export const MACRO_CONFIG: Record<MacroSeriesId, MacroSeriesConfig> = {
  FEDFUNDS: {
    id: "FEDFUNDS",
    name: "Federal Funds Rate",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
  },
  DGS10: {
    id: "DGS10",
    name: "10-Year Treasury Yield",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
  },
  DGS2: {
    id: "DGS2",
    name: "2-Year Treasury Yield",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
  },
  T10Y2Y: {
    id: "T10Y2Y",
    name: "Yield Curve Spread (10Y-2Y)",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
  },
  BAMLH0A0HYM2: {
    id: "BAMLH0A0HYM2",
    name: "High Yield Credit Spread",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
  },
  CPIAUCSL: {
    id: "CPIAUCSL",
    name: "Consumer Price Index",
    section: "Inflation & Growth",
    formatter: (val) => val.toFixed(2),
  },
  PCEPI: {
    id: "PCEPI",
    name: "PCE Price Index",
    section: "Inflation & Growth",
    formatter: (val) => val.toFixed(2),
  },
  UNRATE: {
    id: "UNRATE",
    name: "Unemployment Rate",
    section: "Labor Market",
    formatter: (val) => `${val.toFixed(1)}%`,
  },
  PAYEMS: {
    id: "PAYEMS",
    name: "Nonfarm Payrolls",
    section: "Labor Market",
    formatter: (val) => `${(val / 1000).toFixed(2)}M`,
  },
  GDPC1: {
    id: "GDPC1",
    name: "Real GDP",
    section: "Inflation & Growth",
    formatter: (val) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`,
  },
  ICSA: {
    id: "ICSA",
    name: "Initial Jobless Claims",
    section: "Labor Market",
    formatter: (val) => `${(val / 1000).toFixed(1)}K`,
  },
};
