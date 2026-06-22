
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
  | "ICSA"
  | "M2SL"
  | "RSAFS"
  | "HOUST"
  | "UMCSENT";

export interface MacroSeriesConfig {
  id: MacroSeriesId;
  name: string;
  section: string;
  formatter: (val: number) => string;
  interpretation?: string;
}

export const MACRO_CONFIG: Record<MacroSeriesId, MacroSeriesConfig> = {
  FEDFUNDS: {
    id: "FEDFUNDS",
    name: "Federal Funds Rate",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
    interpretation: "The Fed's target interest rate. ⬆️ Rising rates increase borrowing costs and pressure stock valuations (especially tech/growth). ⬇️ Falling rates stimulate the economy and are generally bullish for stocks.",
  },
  DGS10: {
    id: "DGS10",
    name: "10-Year Treasury Yield",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
    interpretation: "The benchmark for mortgages and corporate debt. ⬆️ A rising 10-year yield often hurts tech/growth stocks and real estate. ⬇️ A falling yield eases financial conditions.",
  },
  DGS2: {
    id: "DGS2",
    name: "2-Year Treasury Yield",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
    interpretation: "Highly sensitive to near-term Fed policy. ⬆️ Indicates expectations of Fed rate hikes. ⬇️ Indicates the market expects the Fed to cut rates soon.",
  },
  T10Y2Y: {
    id: "T10Y2Y",
    name: "Yield Curve Spread (10Y-2Y)",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
    interpretation: "The difference between 10Y and 2Y yields. ⬇️ If negative (inverted), it historically signals an impending recession. ⬆️ If rising (steepening) after an inversion, it often means the recession has arrived or Fed cuts have begun.",
  },
  BAMLH0A0HYM2: {
    id: "BAMLH0A0HYM2",
    name: "High Yield Credit Spread",
    section: "Rates & Yields",
    formatter: (val) => `${val.toFixed(2)}%`,
    interpretation: "The extra yield demanded to hold risky 'junk' bonds. ⬆️ A rising spread signals financial stress and fear of corporate defaults (bearish). ⬇️ A falling spread shows market confidence (bullish).",
  },
  CPIAUCSL: {
    id: "CPIAUCSL",
    name: "Consumer Price Index",
    section: "Inflation & Growth",
    formatter: (val) => val.toFixed(2),
    interpretation: "A broad measure of inflation. ⬆️ High/rising CPI forces the Fed to hike rates (bearish). ⬇️ Falling CPI allows the Fed to ease policy, supporting asset prices.",
  },
  PCEPI: {
    id: "PCEPI",
    name: "PCE Price Index",
    section: "Inflation & Growth",
    formatter: (val) => val.toFixed(2),
    interpretation: "The Fed's preferred inflation gauge. ⬆️ Persistent increases mean higher rates for longer. ⬇️ Approaching the 2% target gives the Fed a green light to cut rates.",
  },
  UNRATE: {
    id: "UNRATE",
    name: "Unemployment Rate",
    section: "Labor Market",
    formatter: (val) => `${val.toFixed(1)}%`,
    interpretation: "The percentage of the labor force out of work. ⬆️ Rapid increases (Sahm Rule) signal a recession, forcing Fed cuts. ⬇️ Very low rates signal a strong economy but risk wage inflation.",
  },
  PAYEMS: {
    id: "PAYEMS",
    name: "Nonfarm Payrolls",
    section: "Labor Market",
    formatter: (val) => `${(val / 1000).toFixed(2)}M`,
    interpretation: "Total US jobs added. ⬆️ Strong prints signal robust economic growth (bullish), but if too hot, can trigger inflation fears. ⬇️ Weak prints fuel recession fears.",
  },
  GDPC1: {
    id: "GDPC1",
    name: "Real GDP",
    section: "Inflation & Growth",
    formatter: (val) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`,
    interpretation: "The total value of goods and services produced. ⬆️ Rising GDP indicates a healthy, expanding economy (bullish). ⬇️ Two consecutive negative quarters define a technical recession.",
  },
  ICSA: {
    id: "ICSA",
    name: "Initial Jobless Claims",
    section: "Labor Market",
    formatter: (val) => `${(val / 1000).toFixed(1)}K`,
    interpretation: "Weekly count of newly unemployed filing for benefits. ⬆️ A leading indicator: sudden spikes warn of impending layoffs and economic slowdown. ⬇️ Steady low numbers confirm a tight labor market.",
  },
  M2SL: {
    id: "M2SL",
    name: "M2 Money Supply",
    section: "Inflation & Growth",
    formatter: (val) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`,
    interpretation: "Total money circulating in the economy. ⬆️ Rapid growth fuels asset bubbles and inflation (Bullish for stocks short-term). ⬇️ Shrinking M2 drains liquidity, tightening financial conditions.",
  },
  RSAFS: {
    id: "RSAFS",
    name: "Retail Sales",
    section: "Consumer & Housing",
    formatter: (val) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`,
    interpretation: "Total consumer spending at stores. ⬆️ Strong sales indicate a healthy consumer (Bullish for economy). ⬇️ Dropping sales signal a consumer pullback, hurting corporate earnings.",
  },
  HOUST: {
    id: "HOUST",
    name: "Housing Starts",
    section: "Consumer & Housing",
    formatter: (val) => `${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`,
    interpretation: "New residential construction projects. ⬆️ Housing leads the economy; rising starts indicate economic strength and job creation. ⬇️ Falling starts often precede recessions.",
  },
  UMCSENT: {
    id: "UMCSENT",
    name: "Consumer Sentiment",
    section: "Consumer & Housing",
    formatter: (val) => val.toFixed(1),
    interpretation: "University of Michigan survey on consumer confidence. ⬆️ Confident consumers spend more money. ⬇️ Pessimistic consumers save money, slowing down economic growth.",
  },
};
