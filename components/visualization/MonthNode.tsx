"use client";

import { useState } from "react";
import { MonthData } from "@/lib/types";
import { moodToColor, averageMoodToGlow } from "@/lib/moodColors";
import { MONTH_NAMES } from "@/lib/mockData";
import { VIZ, circlePoint } from "./layout";
import { DayNode } from "./DayNode";

interface MonthNodeProps {
  month: MonthData;
  cx: number;
  cy: number;
  isSelected: boolean;
  isAnySelected: boolean;
  onSelect: () => void;
  onDaySelect: (date: string) => void;
  selectedDay: string | null;
}

export function MonthNode({
  month,
  cx,
  cy,
  isSelected,
  isAnySelected,
  onSelect,
  onDaySelect,
  selectedDay,
}: MonthNodeProps) {
  const [hovered, setHovered] = useState(false);

  const r = VIZ.monthR;
  const borderColor = moodToColor(month.averageMood);
  const glowColor = averageMoodToGlow(month.averageMood);
  const hasData = month.entryCount > 0;

  // Non-selected months fade fully out so they don't bleed into the zoomed
  // viewport. CSS transitions on plain <g> elements avoid the CSS-transform
  // injection that Framer Motion motion.* elements add to SVG nodes, which
  // can cause the browser to rasterize the subtree at the wrong resolution.
  const bodyOpacity = isAnySelected && !isSelected ? 0 : 1;

  return (
    <g>
      {/* Month body — fades with a CSS transition, not a Framer Motion spring */}
      <g
        style={{
          opacity: bodyOpacity,
          transition: "opacity 0.35s ease",
          pointerEvents: bodyOpacity === 0 ? "none" : "auto",
        }}
      >
        {/*
          Glow halo + ring — only rendered in year view (not selected).
          When zoomed in the day nodes carry all the visual weight; the ring
          and its glow would clutter the view and give a false sense that
          something is still "selected" as a bordered element.
        */}
        {!isSelected && hasData && (
          <circle
            cx={cx} cy={cy}
            r={r + 4}
            fill="none"
            stroke={glowColor}
            strokeWidth={8}
            opacity={hovered ? 0.45 : 0.2}
            style={{ transition: "opacity 0.15s", pointerEvents: "none" }}
          />
        )}

        {!isSelected && (
          <circle
            cx={cx} cy={cy}
            r={r}
            fill="rgba(255,255,255,0.03)"
            stroke={borderColor}
            strokeWidth={hovered ? 4 : 1.5}
            onClick={onSelect}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              cursor: "pointer",
              transition: "stroke-width 0.15s ease",
            }}
            role="button"
            aria-label={MONTH_NAMES[month.month]}
          />
        )}

        <text
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={14} fontWeight={500}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {MONTH_NAMES[month.month]}
        </text>

        {month.entryCount > 0 && (
          <text
            x={cx} y={cy + 18}
            textAnchor="middle" dominantBaseline="central"
            fill={borderColor} fontSize={10}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {month.entryCount}
          </text>
        )}
      </g>

      {/*
        Day nodes — revealed only when this month is selected.
        CSS transition-delay replicates the Framer Motion delay variant:
        0.15 s delay when appearing so the zoom settles first.
      */}
      <g
        style={{
          opacity: isSelected ? 1 : 0,
          transition: isSelected
            ? "opacity 0.25s ease 0.15s"
            : "opacity 0.25s ease 0s",
          pointerEvents: isSelected ? "auto" : "none",
        }}
      >
        {month.days.map((day, i) => {
          const pos = circlePoint(cx, cy, r, i, month.days.length);
          return (
            <DayNode
              key={day.date}
              day={day}
              x={pos.x}
              y={pos.y}
              onSelect={onDaySelect}
              isSelected={selectedDay === day.date}
            />
          );
        })}
      </g>
    </g>
  );
}
