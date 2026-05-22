"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useAnimationFrame, animate,
} from "framer-motion";
import { YearData, ZoomState, DiaryEntry } from "@/lib/types";
import { VIZ, circlePoint, cameraTransform } from "./layout";
import { MonthNode } from "./MonthNode";
import { moodToColor } from "@/lib/moodColors";
import { RadarChart } from "./RadarChart";
import { METRICS, computeYearValues, computeMonthValues } from "@/lib/metrics";

interface ZoomableCanvasProps {
  data: YearData;
  zoomState: ZoomState;
  onMonthSelect: (month: number) => void;
  onDaySelect: (date: string) => void;
  onZoomOut: () => void;
  advancedMode: boolean;
  entries: DiaryEntry[];
  activeMetricIds: string[];
}

// restDelta=0.001 ensures the snap-to-final happens when t is within 0.1%
// of its target. At that point all three derived values (x, y, scale) are
// also within 0.1% of their targets, making the snap imperceptible.
const SPRING = { type: "spring", stiffness: 120, damping: 22, restDelta: 0.001 } as const;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function ZoomableCanvas({
  data,
  zoomState,
  onMonthSelect,
  onDaySelect,
  onZoomOut,
  advancedMode,
  entries,
  activeMetricIds,
}: ZoomableCanvasProps) {
  const { level, selectedMonth } = zoomState;
  const { vw, vh, yearRingR, monthR } = VIZ;

  // ── Camera target ─────────────────────────────────────────────────────────
  let camX = 0, camY = 0, camScale = 1;
  if (level !== "year" && selectedMonth !== null) {
    const pos = circlePoint(0, 0, yearRingR, selectedMonth, 12);
    const cam = cameraTransform(pos.x, pos.y, monthR, yearRingR);
    camX = cam.x;
    camY = cam.y;
    camScale = cam.scale;
  }

  // ── Single progress spring → SVG transform attribute ─────────────────────
  const t = useMotionValue(0);
  const fromRef = useRef({ x: 0, y: 0, scale: 1 });
  const toRef = useRef({ x: 0, y: 0, scale: 1 });
  const cameraRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const tv = t.get();
    fromRef.current = {
      x: lerp(fromRef.current.x, toRef.current.x, tv),
      y: lerp(fromRef.current.y, toRef.current.y, tv),
      scale: lerp(fromRef.current.scale, toRef.current.scale, tv),
    };
    toRef.current = { x: camX, y: camY, scale: camScale };
    t.jump(0);
    animate(t, 1, SPRING);
  }, [camX, camY, camScale]); // eslint-disable-line react-hooks/exhaustive-deps

  useAnimationFrame(() => {
    const tv = t.get();
    const x = lerp(fromRef.current.x, toRef.current.x, tv);
    const y = lerp(fromRef.current.y, toRef.current.y, tv);
    const s = lerp(fromRef.current.scale, toRef.current.scale, tv);
    cameraRef.current?.setAttribute(
      "transform",
      `translate(${x} ${y}) scale(${s})`
    );
  });

  // ── Render flags (declared early so memos below can reference them) ─────────
  const isZoomedIn = level !== "year";
  const yearLabelColor = moodToColor(data.averageMood);

  // ── Radar data ────────────────────────────────────────────────────────────
  const activeMetrics = useMemo(
    () => METRICS.filter((m) => activeMetricIds.includes(m.id)),
    [activeMetricIds]
  );

  const yearRadarLines = useMemo(() => {
    if (!advancedMode) return [];
    return activeMetrics.map((metric) => ({
      id: metric.id,
      color: metric.color,
      values: computeYearValues(entries, data.year, metric),
    }));
  }, [advancedMode, activeMetrics, entries, data.year]);

  const monthRadarLines = useMemo(() => {
    if (!advancedMode || selectedMonth === null) return [];
    return activeMetrics.map((metric) => ({
      id: metric.id,
      color: metric.color,
      values: computeMonthValues(entries, data.year, selectedMonth, metric),
    }));
  }, [advancedMode, activeMetrics, entries, data.year, selectedMonth]);

  // ── Legend data — average per metric for the current scope ────────────────
  const legendItems = useMemo(() => {
    if (!advancedMode) return [];
    const lines = isZoomedIn ? monthRadarLines : yearRadarLines;
    return lines.map((line) => {
      const defined = line.values.filter((v): v is number => v !== undefined);
      const avg = defined.length > 0 ? defined.reduce((a, b) => a + b) / defined.length : undefined;
      const metric = METRICS.find((m) => m.id === line.id)!;
      return { id: line.id, color: line.color, label: metric.label, avg, formatAvg: metric.formatAvg };
    });
  }, [advancedMode, isZoomedIn, yearRadarLines, monthRadarLines]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`${-vw / 2} ${-vh / 2} ${vw} ${vh}`}
        className="w-full h-full"
        overflow="hidden"
        aria-label="Mood tracker visualization"
      >
        <g ref={cameraRef}>
          {/* Year orbit ring */}
          <circle
            cx={0} cy={0} r={yearRingR}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}
          />

          {/* Year radar — visible in year view only */}
          {advancedMode && (
            <g style={{
              opacity: isZoomedIn ? 0 : 1,
              transition: "opacity 0.3s ease",
            }}>
              <RadarChart
                cx={0} cy={0}
                radius={yearRingR}
                count={12}
                lines={yearRadarLines}
                zeroFill
              />
            </g>
          )}

          {/* Year label + entry count */}
          <text
            x={0} y={0}
            textAnchor="middle" dominantBaseline="central"
            fill={yearLabelColor} fontSize={52} fontWeight={700}
            style={{
              userSelect: "none",
              opacity: isZoomedIn ? 0 : 0.9,
              transition: "opacity 0.3s",
            }}
          >
            {data.year}
          </text>
          <text
            x={0} y={38}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)" fontSize={14}
            style={{
              userSelect: "none",
              opacity: isZoomedIn ? 0 : 1,
              transition: "opacity 0.3s",
            }}
          >
            {data.totalEntries} {data.totalEntries === 1 ? "entry" : "entries"}
          </text>

          {/* Month nodes */}
          {data.months.map((month, i) => {
            const pos = circlePoint(0, 0, yearRingR, i, 12);
            return (
              <MonthNode
                key={month.month}
                month={month}
                cx={pos.x}
                cy={pos.y}
                isSelected={selectedMonth === i}
                isAnySelected={selectedMonth !== null}
                onSelect={() => onMonthSelect(i)}
                onDaySelect={onDaySelect}
                selectedDay={zoomState.selectedDay}
              />
            );
          })}

          {/* Month radar — visible when zoomed in */}
          {advancedMode && selectedMonth !== null && (() => {
            const pos = circlePoint(0, 0, yearRingR, selectedMonth, 12);
            // The camera scales monthR up to yearRingR, so SVG stroke units
            // need to shrink by the same ratio to stay visually consistent.
            const scaledStroke = 1.5 * (monthR / yearRingR);
            return (
              <g style={{
                opacity: isZoomedIn ? 1 : 0,
                transition: isZoomedIn
                  ? "opacity 0.25s ease 0.55s"
                  : "opacity 0.15s ease",
                pointerEvents: "none",
              }}>
                <RadarChart
                  cx={pos.x} cy={pos.y}
                  radius={monthR}
                  count={data.months[selectedMonth].days.length}
                  lines={monthRadarLines}
                  strokeWidth={scaledStroke}
                />
              </g>
            );
          })()}
        </g>
      </svg>

      {/* Legend */}
      {advancedMode && legendItems.length > 0 && (
        <div className="absolute bottom-6 left-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/8 px-3 py-2.5 flex flex-col gap-1.5 pointer-events-none">
          {legendItems.map(({ id, color, label, avg, formatAvg }) => (
            <div key={id} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-white/45 text-xs">{label}</span>
              </div>
              <span className="text-white/75 text-xs font-medium tabular-nums">
                {avg !== undefined ? formatAvg(avg) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isZoomedIn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={onZoomOut}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15 8H1M1 8l5-5M1 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to {level === "day" ? "month" : "year"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
