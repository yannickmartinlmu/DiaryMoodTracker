import { DiaryEntry, DayData, MonthData, YearData, MoodScore, PhysicalActivity } from "./types";

const CURRENT_YEAR = 2026;

// ── Seeded PRNG — gives deterministic mock data on every page load ────────────
function makePrng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ── Entry generator ───────────────────────────────────────────────────────────

export type MoodBias = "positive" | "neutral" | "negative";

function biased(min: number, max: number, bias: MoodBias | undefined, rand: () => number): number {
  const r = rand();
  // pow(r, 0.35) skews toward 1 (high); 1-pow(r,0.35) skews toward 0 (low)
  const t = bias === "positive" ? Math.pow(r, 0.35)
           : bias === "negative" ? 1 - Math.pow(r, 0.35)
           : r;
  return Math.round(min + (max - min) * t);
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/**
 * Generate a random diary entry for a given date.
 * `bias` skews all scores toward positive, neutral, or negative.
 * `rand` lets you inject a seeded PRNG for determinism; defaults to Math.random.
 */
export function generateEntry(
  date: string,
  bias?: MoodBias,
  text?: string,
  rand: () => number = Math.random
): DiaryEntry {
  const mood = biased(1, 10, bias, rand) as MoodScore;
  // Stress is naturally inversely correlated with mood
  const stressBias: MoodBias | undefined =
    bias === "positive" ? "negative" : bias === "negative" ? "positive" : undefined;

  return {
    id: `mock-${date}`,
    date,
    moodScore: mood,
    ...(text ? { text } : {}),
    createdAt: `${date}T${String(20 + Math.floor(rand() * 3)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00Z`,
    sleepHours: pick([5, 6, 6, 7, 7, 7, 8, 8, 8, 9] as const, rand),
    sleepQuality: biased(1, 5, bias, rand) as 1 | 2 | 3 | 4 | 5,
    energyLevel: biased(1, 5, bias, rand) as 1 | 2 | 3 | 4 | 5,
    stressLevel: biased(1, 5, stressBias, rand) as 1 | 2 | 3 | 4 | 5,
    mentalHealth: biased(1, 5, bias, rand) as 1 | 2 | 3 | 4 | 5,
    physicalActivity: pick<PhysicalActivity>(
      ["none", "none", "walk", "walk", "workout", "intense"],
      rand
    ),
  };
}

// ── Dense dataset — almost every day Jan–May 2026 ────────────────────────────
// Using a seeded PRNG so the data is identical on every page load.

const _rand = makePrng(42);

// A handful of days left blank to feel like a real diary.
const SKIP_DAYS = new Set([
  "2026-01-04", "2026-01-13", "2026-01-24",
  "2026-02-03", "2026-02-17",
  "2026-03-06", "2026-03-19",
  "2026-04-03", "2026-04-24",
  "2026-05-08", "2026-05-17", "2026-05-20",
]);

// Handwritten notes for flavour — only a subset of days.
const NOTES: Record<string, string> = {
  "2026-01-02": "Back to reality after the holidays. The flat feels quiet.",
  "2026-01-08": "Slow morning. Got a walk in, which helped.",
  "2026-01-15": "Decent day. Meal prepped for the week.",
  "2026-01-22": "Finally some sunlight. Went for a long walk.",
  "2026-01-29": "Tired. Slept poorly again.",
  "2026-02-07": "Had lunch with an old friend. Really needed that.",
  "2026-02-14": "Valentine's day. Cozy evening in.",
  "2026-02-21": "Good workout. Energy has been better this week.",
  "2026-02-28": "Finished the book. Satisfying.",
  "2026-03-01": "Noticed the days getting longer.",
  "2026-03-11": "Spring is almost here. Mood lifted noticeably.",
  "2026-03-20": "First day of spring. Went outside without a jacket.",
  "2026-03-22": "Really solid day.",
  "2026-03-28": "Great run this morning. Everything clicked.",
  "2026-04-04": "Feeling motivated. Got ahead on some work.",
  "2026-04-10": "Dinner with friends. Laughed a lot.",
  "2026-04-16": "Long bike ride. Legs are tired but mind is clear.",
  "2026-04-19": "A bit anxious about some things, but managing.",
  "2026-04-22": "Productive from start to finish.",
  "2026-05-01": "May already. Time is flying.",
  "2026-05-07": "Bit of a slump mid-week.",
  "2026-05-10": "Productive week overall.",
  "2026-05-16": "Beautiful day. Sat outside most of the afternoon.",
  "2026-05-21": "Building something cool. Excited about it.",
  "2026-05-22": "Decent day. Hopeful.",
};

// Mood bias smoothly shifts from negative (Jan) to positive (May).
function dayBias(month: number): MoodBias {
  const r = _rand();
  // month 0=Jan … 4=May; thresholds shift the distribution progressively
  const negThresh = [0.65, 0.35, 0.15, 0.07, 0.04][month] ?? 0;
  const posThresh = [0.80, 0.60, 0.55, 0.40, 0.22][month] ?? 0;
  if (r < negThresh) return "negative";
  if (r < posThresh) return "neutral";
  return "positive";
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMockEntries(): DiaryEntry[] {
  const entries: DiaryEntry[] = [];
  // Jan (0) through May (4), up to the 22nd of May
  for (let m = 0; m <= 4; m++) {
    const totalDays = m < 4
      ? new Date(CURRENT_YEAR, m + 1, 0).getDate()
      : 22; // stop at May 22
    for (let d = 1; d <= totalDays; d++) {
      const date = isoDate(CURRENT_YEAR, m, d);
      if (SKIP_DAYS.has(date)) continue;
      entries.push(generateEntry(date, dayBias(m), NOTES[date], _rand));
    }
  }
  return entries;
}

export const mockEntries: DiaryEntry[] = buildMockEntries();

// ── Year data builder ─────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function buildMonthData(year: number, month: number, entries: DiaryEntry[]): MonthData {
  const numDays = daysInMonth(year, month);
  const monthStr = String(month + 1).padStart(2, "0");

  const days: DayData[] = Array.from({ length: numDays }, (_, i) => {
    const day = i + 1;
    const date = `${year}-${monthStr}-${String(day).padStart(2, "0")}`;
    const entry = entries.find((e) => e.date === date);
    return { date, dayOfMonth: day, hasEntry: !!entry, moodScore: entry?.moodScore };
  });

  const scoredDays = days.filter((d) => d.moodScore !== undefined);
  const averageMood =
    scoredDays.length > 0
      ? scoredDays.reduce((sum, d) => sum + (d.moodScore ?? 0), 0) / scoredDays.length
      : undefined;

  return { year, month, days, averageMood, entryCount: scoredDays.length };
}

export function buildYearData(
  year: number = CURRENT_YEAR,
  entries: DiaryEntry[] = mockEntries
): YearData {
  const months = Array.from({ length: 12 }, (_, i) => buildMonthData(year, i, entries));

  const allScored = months.flatMap((m) => m.days).filter((d) => d.moodScore !== undefined);
  const averageMood =
    allScored.length > 0
      ? allScored.reduce((sum, d) => sum + (d.moodScore ?? 0), 0) / allScored.length
      : undefined;

  return { year, months, averageMood, totalEntries: entries.length };
}

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
