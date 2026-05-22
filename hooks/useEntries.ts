"use client";

import { useState, useCallback, useEffect } from "react";
import { DiaryEntry } from "@/lib/types";
import { loadEntries, persistEntry, removeEntry } from "@/lib/storage";
import { mockEntries } from "@/lib/mockData";

export function useEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    let stored = loadEntries();
    if (stored.length === 0) {
      mockEntries.forEach(persistEntry);
      stored = loadEntries();
    }
    setEntries(stored);
  }, []);

  const refresh = () => setEntries(loadEntries());

  const saveEntry = useCallback((entry: DiaryEntry) => {
    persistEntry(entry);
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteEntry = useCallback((id: string) => {
    removeEntry(id);
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getByDate = useCallback(
    (date: string) => entries.find((e) => e.date === date) ?? null,
    [entries]
  );

  return { entries, saveEntry, deleteEntry, getByDate };
}
