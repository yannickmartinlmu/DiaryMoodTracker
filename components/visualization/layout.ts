// Geometry helpers for circular layouts

export interface Point {
  x: number;
  y: number;
}

// Returns position of item i out of n, placed on a circle.
// Starts at the top (−π/2) and goes clockwise.
export function circlePoint(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number,
  offsetAngle = -Math.PI / 2
): Point {
  const angle = offsetAngle + (index / total) * 2 * Math.PI;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

// SVG transform string that maps (focusX, focusY) to the viewport center
// and scales so that the focus circle (radius focusR) appears at targetR.
export function cameraTransform(
  focusX: number,
  focusY: number,
  focusR: number,
  targetR: number
): { scale: number; x: number; y: number } {
  const scale = targetR / focusR;
  return { scale, x: -focusX * scale, y: -focusY * scale };
}

// Dimensions used throughout the visualization
export const VIZ = {
  // SVG viewBox: -VW/2 to VW/2, -VH/2 to VH/2
  vw: 1000,
  vh: 1000,

  // Year-level ring radius
  yearRingR: 340,

  // Month node radius
  monthR: 52,

  // Day node visual radius (they sit ON the month circumference).
  // 31 days give arc ≈ 10.5 SVG units; diameter 8 leaves a gap of ~2.5 units.
  dayR: 4,

  // Label offset from node center
  labelOffset: 18,
} as const;
