import { useState, useEffect } from "react";
import { MacroSeriesId } from "../constants/macroConfig";
import { Observation } from "../utils/macroHelpers";

export type FredSeriesResult = {
  id: MacroSeriesId;
  observations: Observation[];
  error?: string;
};

export const useFredSeries = (seriesIds: MacroSeriesId[]) => {
  const [data, setData] = useState<Record<MacroSeriesId, Observation[]> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<MacroSeriesId, boolean>>({} as any);

  const fetchSeries = async (id: MacroSeriesId): Promise<FredSeriesResult> => {
    try {
      const url = `/api/macro/${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const json = await response.json();
      
      const observations: Observation[] = json.observations
        .filter((obs: any) => obs.value !== ".")
        .map((obs: any) => ({
          date: obs.date,
          value: parseFloat(obs.value),
        }));
        
      return { id, observations };
    } catch (err: any) {
      return { id, observations: [], error: err.message };
    }
  };

  const loadAll = async () => {
    setLoading(true);
    const promises = seriesIds.map((id) => fetchSeries(id));
    const results = await Promise.allSettled(promises);

    const newData: Record<string, Observation[]> = {};
    const newErrors: Record<string, boolean> = {};

    results.forEach((res, index) => {
      const id = seriesIds[index];
      if (res.status === "fulfilled") {
        if (res.value.error) {
          newErrors[id] = true;
        } else {
          newData[id] = res.value.observations;
        }
      } else {
        newErrors[id] = true;
      }
    });

    setData((prev) => ({ ...prev, ...newData }) as any);
    setErrors(newErrors as any);
    setLoading(false);
  };

  const refetch = async (id: MacroSeriesId) => {
    setErrors((prev) => ({ ...prev, [id]: false }));
    const result = await fetchSeries(id);
    if (result.error) {
      setErrors((prev) => ({ ...prev, [id]: true }));
    } else {
      setData((prev) => ({ ...prev, [id]: result.observations } as any));
    }
  };

  useEffect(() => {
    loadAll();
  }, [seriesIds.join(',')]); // Refetch when seriesIds changes

  return { data, loading, errors, refetch };
};
