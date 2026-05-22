"use client";

import { useState } from "react";
import { DayData } from "@/lib/types";
import { moodToColor, averageMoodToGlow } from "@/lib/moodColors";
import { VIZ } from "./layout";

interface DayNodeProps {
  day: DayData;
  x: number;
  y: number;
  onSelect: (date: string) => void;
  isSelected: boolean;
}

export function DayNode({ day, x, y, onSelect, isSelected }: DayNodeProps) {
  const [hovered, setHovered] = useState(false);
  const r = VIZ.dayR;

  // Shared interaction handlers on the <g> so the full hit area responds.
  // Plain SVG elements instead of motion.* avoid will-change / CSS transform
  // injection that can cause browsers to rasterize the subtree at the
  // pre-zoom resolution, producing pixelated output when the camera is scaled.
  const interactionProps = {
    onClick: () => onSelect(day.date),
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: { cursor: "pointer" },
    role: "button" as const,
  };

  if (!day.hasEntry) {
    // Empty day — same radius as entry nodes so the ring reads as a uniform
    // track, but visually receded: hollow fill, dim stroke, dim day number.
    return (
      <g {...interactionProps} aria-label={`Day ${day.dayOfMonth}, no entry`}>
        <circle
          cx={x} cy={y}
          r={r}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={hovered ? 1.2 : 0.6}
          style={{ transition: "stroke-width 0.12s ease" }}
        />
        <text
          x={x} y={y}
          textAnchor="middle" dominantBaseline="central"
          fill={hovered ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)"}
          fontSize={2.8} fontWeight={400}
          style={{ pointerEvents: "none", userSelect: "none", transition: "fill 0.12s ease" }}
        >
          {day.dayOfMonth}
        </text>
      </g>
    );
  }

  const color = moodToColor(day.moodScore);
  const glowColor = averageMoodToGlow(day.moodScore);

  return (
    <g {...interactionProps} aria-label={`Day ${day.dayOfMonth}`}>
      {/* Glow halo — kept tight so adjacent nodes don't bleed into each other */}
      <circle
        cx={x} cy={y}
        r={r + 0.5}
        fill="none"
        stroke={glowColor}
        strokeWidth={2.5}
        opacity={hovered ? 0.45 : 0.22}
        style={{ pointerEvents: "none", transition: "opacity 0.12s ease" }}
      />

      {/* Selection ring — appears when this day is active */}
      {isSelected && (
        <circle
          cx={x} cy={y}
          r={r + 4.5}
          fill="none"
          stroke="white"
          strokeWidth={0.8}
          opacity={0.55}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/*
        Main node ring — mirrors MonthNode's ring style.
        strokeWidth steps up on hover and holds at a mid value when selected,
        matching the pattern where selection ≠ hover but both are readable.
      */}
      <circle
        cx={x} cy={y}
        r={r}
        fill="rgba(255,255,255,0.05)"
        stroke={color}
        strokeWidth={isSelected ? 1.5 : hovered ? 2.5 : 1}
        style={{ transition: "stroke-width 0.12s ease" }}
      />

      {/* Day number — only legible when zoomed in (fontSize in SVG user units) */}
      <text
        x={x} y={y}
        textAnchor="middle" dominantBaseline="central"
        fill={hovered ? "white" : "rgba(255,255,255,0.75)"}
        fontSize={2.8} fontWeight={500}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          transition: "fill 0.12s ease",
        }}
      >
        {day.dayOfMonth}
      </text>
    </g>
  );
}
