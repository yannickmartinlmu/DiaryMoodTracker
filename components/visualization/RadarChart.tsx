import { circlePoint } from "./layout";

export interface RadarLine {
  id: string;
  color: string;
  values: (number | undefined)[];
}

interface RadarChartProps {
  cx: number;
  cy: number;
  radius: number;
  count: number;
  lines: RadarLine[];
  strokeWidth?: number;
  // true  → undefined values collapse to center (year view: proper spider shape)
  // false → undefined values are skipped entirely (month view: sparse days)
  zeroFill?: boolean;
}

function polygonPath(cx: number, cy: number, r: number, n: number): string {
  return (
    Array.from({ length: n }, (_, i) => {
      const p = circlePoint(cx, cy, r, i, n);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join("") + "Z"
  );
}

function radarPathZeroFill(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  values: (number | undefined)[]
): string {
  return (
    values
      .map((v, i) => {
        const p = circlePoint(cx, cy, (v ?? 0) * radius, i, count);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join("") + "Z"
  );
}

// Skips undefined nodes so the polygon connects only days/months with data.
function radarPathSparse(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  values: (number | undefined)[]
): string {
  const defined = values
    .map((v, i) => (v !== undefined ? { v, i } : null))
    .filter((x): x is { v: number; i: number } => x !== null);

  if (defined.length === 0) return "";

  return (
    defined
      .map(({ v, i }, idx) => {
        const p = circlePoint(cx, cy, v * radius, i, count);
        return `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join("") + "Z"
  );
}

export function RadarChart({
  cx, cy, radius, count, lines,
  strokeWidth = 1.5,
  zeroFill = false,
}: RadarChartProps) {
  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Axis spokes */}
      {Array.from({ length: count }, (_, i) => {
        const p = circlePoint(cx, cy, radius, i, count);
        return (
          <line
            key={i}
            x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={strokeWidth * 0.45}
          />
        );
      })}

      {/* Concentric grid rings at 20 % intervals */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((s) => (
        <path
          key={s}
          d={polygonPath(cx, cy, radius * s, count)}
          fill="none"
          stroke={s === 1 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.30)"}
          strokeWidth={strokeWidth * (s === 1 ? 0.6 : 0.45)}
        />
      ))}

      {/* One filled polygon per metric */}
      {lines.map(({ id, color, values }) => (
        <path
          key={id}
          d={
            zeroFill
              ? radarPathZeroFill(cx, cy, radius, count, values)
              : radarPathSparse(cx, cy, radius, count, values)
          }
          fill={color}
          fillOpacity={0.1}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.65}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}
