export type MoodScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PhysicalActivity = "none" | "walk" | "workout" | "intense";
export type SocialActivity = "none" | "little" | "some" | "lots";

export interface DiaryEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  text?: string;
  moodScore?: MoodScore;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  // Detailed wellness fields (all optional)
  sleepHours?: number;          // 4–10
  sleepQuality?: 1|2|3|4|5;
  energyLevel?: 1|2|3|4|5;
  stressLevel?: 1|2|3|4|5;
  mentalHealth?: 1|2|3|4|5;
  physicalActivity?: PhysicalActivity;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  hasEntry: boolean;
  moodScore?: MoodScore;
}

export interface MonthData {
  year: number;
  month: number; // 0-indexed
  days: DayData[];
  averageMood?: number;
  entryCount: number;
}

export interface YearData {
  year: number;
  months: MonthData[];
  averageMood?: number;
  totalEntries: number;
}

// Zoom navigation state
export type ZoomLevel = "year" | "month" | "day";

export interface ZoomState {
  level: ZoomLevel;
  selectedMonth: number | null; // 0-indexed
  selectedDay: string | null;   // YYYY-MM-DD
}
