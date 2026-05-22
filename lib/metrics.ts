import { DiaryEntry, PhysicalActivity } from "./types";

export interface Metric {
  id: string;
  label: string;
  color: string;
  // Returns a 0–1 normalized value, or undefined if the field is missing
  extract: (entry: DiaryEntry) => number | undefined;
  // Converts a normalized average back to a human-readable string
  formatAvg: (normalized: number) => string;
}

const ACTIVITY_SCORE: Record<PhysicalActivity, number> = {
  none: 0,
  walk: 0.33,
  workout: 0.67,
  intense: 1,
};

export const METRICS: readonly Metric[] = [
  {
    id: "mood",
    label: "Mood",
    color: "hsl(160, 55%, 55%)",
    extract: (e) => (e.moodScore !== undefined ? e.moodScore / 10 : undefined),
    formatAvg: (n) => `${(n * 10).toFixed(1)} / 10`,
  },
  {
    id: "sleep",
    label: "Sleep",
    color: "hsl(205, 65%, 60%)",
    // 4h → 0, 10h → 1
    extract: (e) => (e.sleepHours !== undefined ? Math.min(1, (e.sleepHours - 4) / 6) : undefined),
    formatAvg: (n) => `${(4 + n * 6).toFixed(1)}h`,
  },
  {
    id: "sleepQuality",
    label: "Sleep Quality",
    color: "hsl(235, 55%, 68%)",
    extract: (e) => (e.sleepQuality !== undefined ? e.sleepQuality / 5 : undefined),
    formatAvg: (n) => `${(n * 5).toFixed(1)} / 5★`,
  },
  {
    id: "energy",
    label: "Energy",
    color: "hsl(45, 80%, 58%)",
    extract: (e) => (e.energyLevel !== undefined ? e.energyLevel / 5 : undefined),
    formatAvg: (n) => `${(n * 5).toFixed(1)} / 5★`,
  },
  {
    id: "stress",
    label: "Low Stress",
    color: "hsl(10, 62%, 60%)",
    // Inverted: low stress → large on chart. Display as the actual stress level.
    extract: (e) => (e.stressLevel !== undefined ? (6 - e.stressLevel) / 5 : undefined),
    formatAvg: (n) => `lvl ${(6 - n * 5).toFixed(1)} / 5`,
  },
  {
    id: "mental",
    label: "Mental Health",
    color: "hsl(280, 48%, 65%)",
    extract: (e) => (e.mentalHealth !== undefined ? e.mentalHealth / 5 : undefined),
    formatAvg: (n) => `${(n * 5).toFixed(1)} / 5★`,
  },
  {
    id: "activity",
    label: "Activity",
    color: "hsl(25, 72%, 58%)",
    extract: (e) =>
      e.physicalActivity !== undefined ? ACTIVITY_SCORE[e.physicalActivity] : undefined,
    formatAvg: (n) =>
      n < 0.17 ? "None" : n < 0.5 ? "Walk" : n < 0.84 ? "Workout" : "Intense",
  },
] as const;

// Average of a metric across a set of entries (undefined if no data)
function average(entries: DiaryEntry[], metric: Metric): number | undefined {
  const vals = entries.map(metric.extract).filter((v): v is number => v !== undefined);
  return vals.length > 0 ? vals.reduce((a, b) => a + b) / vals.length : undefined;
}

// 12 values (one per month) for the year radar
export function computeYearValues(
  entries: DiaryEntry[],
  year: number,
  metric: Metric
): (number | undefined)[] {
  return Array.from({ length: 12 }, (_, m) => {
    const prefix = `${year}-${String(m + 1).padStart(2, "0")}`;
    return average(
      entries.filter((e) => e.date.startsWith(prefix)),
      metric
    );
  });
}

// N values (one per day) for the month radar
export function computeMonthValues(
  entries: DiaryEntry[],
  year: number,
  month: number,
  metric: Metric
): (number | undefined)[] {
  const days = new Date(year, month + 1, 0).getDate();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return Array.from({ length: days }, (_, d) => {
    const date = `${prefix}-${String(d + 1).padStart(2, "0")}`;
    const entry = entries.find((e) => e.date === date);
    return entry ? metric.extract(entry) : undefined;
  });
}
