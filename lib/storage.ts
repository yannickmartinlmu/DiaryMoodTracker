import { DiaryEntry } from "./types";

const KEY = "diary_entries";

export function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

export function persistEntry(entry: DiaryEntry): void {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function removeEntry(id: string): void {
  const entries = loadEntries().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(entries));
}
