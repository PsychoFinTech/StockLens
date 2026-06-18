export type TimeRange = "1M" | "6M" | "1Y" | "5Y" | "10Y" | "Max";

export interface Observation {
  date: string;
  value: number;
}

export const filterByRange = (observations: Observation[], range: TimeRange): Observation[] => {
  if (observations.length === 0 || range === "Max") return observations;

  const latest = new Date(observations[observations.length - 1].date);
  const cutoff = new Date(latest);

  switch (range) {
    case "1M":
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case "6M":
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    case "1Y":
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
    case "5Y":
      cutoff.setFullYear(cutoff.getFullYear() - 5);
      break;
    case "10Y":
      cutoff.setFullYear(cutoff.getFullYear() - 10);
      break;
  }

  return observations.filter((o) => new Date(o.date) >= cutoff);
};

export const calcSpread = (dgs10: Observation[], dgs2: Observation[]): Observation[] => {
  const dgs2Map = new Map<string, number>();
  for (const obs of dgs2) {
    dgs2Map.set(obs.date, obs.value);
  }

  const spread: Observation[] = [];
  for (const obs of dgs10) {
    const dgs2Val = dgs2Map.get(obs.date);
    if (dgs2Val !== undefined) {
      spread.push({
        date: obs.date,
        value: Number((obs.value - dgs2Val).toFixed(2)),
      });
    }
  }

  return spread;
};

export const formatSpreadValue = (val: number): string => {
  const sign = val >= 0 ? "+" : "−"; // Note: using actual minus sign as requested "−"
  return `${sign}${Math.abs(val).toFixed(2)}%`;
};
