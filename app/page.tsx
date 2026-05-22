"use client";

import { useMemo, useState, useCallback } from "react";
import { ZoomableCanvas } from "@/components/visualization/ZoomableCanvas";
import { EntryPanel } from "@/components/ui/EntryPanel";
import { useZoom } from "@/hooks/useZoom";
import { useEntries } from "@/hooks/useEntries";
import { buildYearData, MONTH_NAMES_FULL } from "@/lib/mockData";
import { METRICS } from "@/lib/metrics";

const YEAR = 2026;
type AppMode = "zen" | "advanced";

export default function HomePage() {
  const { entries, saveEntry, deleteEntry } = useEntries();
  const yearData = useMemo(() => buildYearData(YEAR, entries), [entries]);
  const getByDate = (date: string) => entries.find((e) => e.date === date) ?? null;

  const { state: zoom, zoomToMonth, zoomToDay, zoomOut } = useZoom();
  const [panelDate, setPanelDate] = useState<string | null>(null);

  const [mode, setMode] = useState<AppMode>("zen");
  const [activeMetricIds, setActiveMetricIds] = useState<string[]>(
    METRICS.map((m) => m.id)
  );
  const [hoveredMetricId, setHoveredMetricId] = useState<string | null>(null);

  // While hovering a pill, isolate that single metric in the chart.
  const effectiveMetricIds = hoveredMetricId ? [hoveredMetricId] : activeMetricIds;

  const allSelected = activeMetricIds.length === METRICS.length;

  const toggleMetric = useCallback((id: string) => {
    setActiveMetricIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    setActiveMetricIds(allSelected ? [] : METRICS.map((m) => m.id));
  }, [allSelected]);

  function handleDaySelect(date: string) {
    zoomToDay(date);
    setPanelDate(date);
  }

  function handleZoomOut() {
    zoomOut();
    if (zoom.level === "day") setPanelDate(null);
  }

  function handlePanelClose() {
    const wasForSelectedDay = zoom.level === "day" && zoom.selectedDay === panelDate;
    setPanelDate(null);
    if (wasForSelectedDay) zoomOut();
  }

  function handleFAB() {
    const today = new Date().toISOString().slice(0, 10);
    setPanelDate(today);
  }

  const selectedMonthName =
    zoom.selectedMonth !== null ? MONTH_NAMES_FULL[zoom.selectedMonth] : null;

  return (
    <main className="relative flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-base tracking-wide">
            {selectedMonthName ?? String(yearData.year)}
          </h1>
          {zoom.level === "day" && zoom.selectedDay && (
            <span className="text-white/40 text-sm">/ {zoom.selectedDay.slice(8)}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-white/30 text-sm hidden sm:block">
            {yearData.totalEntries} {yearData.totalEntries === 1 ? "entry" : "entries"} ·{" "}
            avg {yearData.averageMood?.toFixed(1) ?? "—"}/10
          </span>

          {/* Zen / Advanced toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-medium">
            {(["zen", "advanced"] as AppMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 capitalize transition-colors focus:outline-none ${
                  mode === m
                    ? "bg-white/15 text-white"
                    : "text-white/35 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Metric toggles — only in advanced mode, slides in/out */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: mode === "advanced" ? "1fr" : "0fr",
          transition: "grid-template-rows 0.2s ease",
        }}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/8 flex-wrap">
            {/* Select / deselect all */}
            <button
              onClick={toggleAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white/35 hover:text-white/60 border border-white/10 hover:border-white/20 transition-all cursor-pointer focus:outline-none"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>

            <div className="w-px h-4 bg-white/10 flex-shrink-0" />

            {METRICS.map((metric) => {
              const active = activeMetricIds.includes(metric.id);
              return (
                <button
                  key={metric.id}
                  onClick={() => toggleMetric(metric.id)}
                  onMouseEnter={() => setHoveredMetricId(metric.id)}
                  onMouseLeave={() => setHoveredMetricId(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer focus:outline-none"
                  style={{
                    backgroundColor: active ? `${metric.color}22` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? metric.color + "66" : "rgba(255,255,255,0.08)"}`,
                    color: active ? metric.color : "rgba(255,255,255,0.3)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? metric.color : "rgba(255,255,255,0.2)" }}
                  />
                  {metric.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visualization area */}
      <div className="relative flex-1 min-h-0">
        <ZoomableCanvas
          data={yearData}
          zoomState={zoom}
          onMonthSelect={zoomToMonth}
          onDaySelect={handleDaySelect}
          onZoomOut={handleZoomOut}
          advancedMode={mode === "advanced"}
          entries={entries}
          activeMetricIds={effectiveMetricIds}
        />

        <EntryPanel
          date={panelDate}
          existingEntry={panelDate ? getByDate(panelDate) : null}
          onSave={saveEntry}
          onDelete={deleteEntry}
          onClose={handlePanelClose}
        />

        {/* FAB — hidden while panel is open */}
        {!panelDate && (
          <button
            onClick={handleFAB}
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white/10 hover:bg-white/18 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 shadow-lg focus:outline-none"
            aria-label="Add entry"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </main>
  );
}
