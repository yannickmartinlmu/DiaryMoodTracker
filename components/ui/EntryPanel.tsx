"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiaryEntry, MoodScore, PhysicalActivity } from "@/lib/types";
import { moodToColor } from "@/lib/moodColors";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MoodDots({ value, onChange }: { value: number; onChange: (v: MoodScore) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score as MoodScore)}
          onMouseEnter={() => setHover(score)}
          onMouseLeave={() => setHover(0)}
          className="w-5 h-5 rounded-full border transition-all duration-100 hover:scale-110 focus:outline-none"
          style={{
            backgroundColor: score <= active ? moodToColor(score) : "transparent",
            borderColor: score <= active ? moodToColor(score) : "rgba(255,255,255,0.2)",
          }}
          aria-label={`Mood ${score}`}
        />
      ))}
    </div>
  );
}

function Stars({
  value,
  onChange,
  color = "rgba(255,255,255,0.85)",
}: {
  value: number;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  color?: string;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5] as const).map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? (0 as never) : i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={i <= active ? color : "none"}
              stroke={i <= active ? color : "rgba(255,255,255,0.2)"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none ${
            value === opt.value
              ? "bg-white/20 text-white"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SleepHours({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const hours = [4, 5, 6, 7, 8, 9, 10];
  return (
    <div className="flex gap-1.5">
      {hours.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onChange(h)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors focus:outline-none ${
            value === h
              ? "bg-white/20 text-white"
              : "bg-white/5 text-white/35 hover:bg-white/10 hover:text-white/70"
          }`}
        >
          {h}h
        </button>
      ))}
    </div>
  );
}

const PHYSICAL_OPTIONS: { value: PhysicalActivity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "walk", label: "Walk" },
  { value: "workout", label: "Workout" },
  { value: "intense", label: "Intense" },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-white/40 text-xs font-medium uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface EntryPanelProps {
  date: string | null;
  existingEntry: DiaryEntry | null;
  onSave: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function EntryPanel({ date, existingEntry, onSave, onDelete, onClose }: EntryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Partial<DiaryEntry>>({});

  // Reset form when the target date/entry changes
  useEffect(() => {
    setDraft(existingEntry ?? {});
  }, [date, existingEntry]);

  function set<K extends keyof DiaryEntry>(key: K, val: DiaryEntry[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  function handleSave() {
    if (!date) return;
    const now = new Date().toISOString();
    const entry: DiaryEntry = {
      id: existingEntry?.id ?? newId(),
      date,
      createdAt: existingEntry?.createdAt ?? now,
      updatedAt: now,
      ...draft,
    };
    onSave(entry);
    onClose();
  }

  function handleDelete() {
    if (existingEntry) onDelete(existingEntry.id);
    onClose();
  }

  const hasDetailData =
    draft.sleepHours !== undefined ||
    draft.sleepQuality !== undefined ||
    draft.energyLevel !== undefined ||
    draft.stressLevel !== undefined ||
    draft.mentalHealth !== undefined ||
    draft.physicalActivity !== undefined;

  return (
    <AnimatePresence>
      {date && (
        <>
          {/* Backdrop — only on mobile, transparent on desktop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 md:hidden"
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="absolute right-0 top-0 h-full w-80 bg-[hsl(220,20%,9%)] border-l border-white/8 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-shrink-0">
              <h2 className="text-white font-medium text-base leading-snug">
                {formatDate(date)}
              </h2>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white transition-colors text-2xl leading-none ml-3 flex-shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-5 min-h-0">

              {/* Mood */}
              <FieldRow label="Mood">
                <MoodDots
                  value={draft.moodScore ?? 0}
                  onChange={(v) => set("moodScore", v)}
                />
                {draft.moodScore !== undefined && (
                  <span className="text-xs" style={{ color: moodToColor(draft.moodScore) }}>
                    {draft.moodScore}/10
                  </span>
                )}
              </FieldRow>

              {/* Notes */}
              <FieldRow label="Notes">
                <textarea
                  value={draft.text ?? ""}
                  onChange={(e) => set("text", e.target.value || undefined)}
                  placeholder="How was your day?"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white/80 text-sm placeholder-white/20 resize-none focus:outline-none focus:border-white/25 transition-colors"
                />
              </FieldRow>

              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-2 text-white/35 hover:text-white/60 text-xs font-medium transition-colors self-start focus:outline-none"
              >
                <svg
                  width="12" height="12" viewBox="0 0 12 12"
                  style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                >
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {expanded ? "Fewer details" : `More details${hasDetailData ? " ·" : ""}`}
                {hasDetailData && !expanded && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />
                )}
              </button>

              {/* Expanded detail fields */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: expanded ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.25s ease",
                }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-4 pb-1">

                    {/* Sleep hours */}
                    <FieldRow label="Sleep">
                      <SleepHours
                        value={draft.sleepHours}
                        onChange={(v) => set("sleepHours", v)}
                      />
                    </FieldRow>

                    {/* Sleep quality */}
                    <FieldRow label="Sleep quality">
                      <Stars
                        value={draft.sleepQuality ?? 0}
                        onChange={(v) => set("sleepQuality", v)}
                        color="hsl(200, 70%, 65%)"
                      />
                    </FieldRow>

                    {/* Energy */}
                    <FieldRow label="Energy">
                      <Stars
                        value={draft.energyLevel ?? 0}
                        onChange={(v) => set("energyLevel", v)}
                        color="hsl(45, 85%, 60%)"
                      />
                    </FieldRow>

                    {/* Stress */}
                    <FieldRow label="Stress">
                      <Stars
                        value={draft.stressLevel ?? 0}
                        onChange={(v) => set("stressLevel", v)}
                        color="hsl(0, 65%, 55%)"
                      />
                    </FieldRow>

                    {/* Mental health */}
                    <FieldRow label="Mental health">
                      <Stars
                        value={draft.mentalHealth ?? 0}
                        onChange={(v) => set("mentalHealth", v)}
                        color="hsl(270, 60%, 70%)"
                      />
                    </FieldRow>

                    {/* Physical activity */}
                    <FieldRow label="Activity">
                      <PillGroup
                        options={PHYSICAL_OPTIONS}
                        value={draft.physicalActivity}
                        onChange={(v) => set("physicalActivity", v)}
                      />
                    </FieldRow>

                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 flex-shrink-0">
              {existingEntry ? (
                <button
                  onClick={handleDelete}
                  className="text-red-400/60 hover:text-red-400 text-sm transition-colors focus:outline-none"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg text-white/40 hover:text-white/70 text-sm transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors focus:outline-none"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
