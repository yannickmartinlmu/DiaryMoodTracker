// Maps a mood score (1-10) to a color in the visualization
// 1 = deep red (worst), 5 = amber (neutral), 10 = teal-green (best)
// No data = muted slate

export function moodToHsl(score: number): string {
  // Hue: 0° (red) → 45° (amber) → 160° (teal)
  const hue = score <= 5
    ? (score - 1) / 4 * 45          // 0 → 45
    : 45 + (score - 5) / 5 * 115;   // 45 → 160

  const saturation = 65;
  const lightness = 50 + (score - 1) / 9 * 10; // 50% → 60%

  return `hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness.toFixed(0)}%)`;
}

export function moodToColor(score: number | undefined): string {
  if (score === undefined) return "hsl(220, 15%, 30%)";
  return moodToHsl(score);
}

export function averageMoodToGlow(score: number | undefined): string {
  if (score === undefined) return "transparent";
  return moodToHsl(score);
}
