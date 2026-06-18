export const FRED_API_KEY = "620b1ae0e8cceb701d836654f66e0871";

export type MacroSeriesId = 
  | "FEDFUNDS"
  | "DGS10"
  | "DGS2"
  | "CPIAUCSL"
  | "UNRATE"
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
  CPIAUCSL: {
    id: "CPIAUCSL",
    name: "Consumer Price Index",
    section: "Inflation & Growth",
    formatter: (val) => val.toFixed(2),
  },
  UNRATE: {
    id: "UNRATE",
    name: "Unemployment Rate",
    section: "Labor Market",
    formatter: (val) => `${val.toFixed(1)}%`,
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
