/**
 * Approximate Ashenfall playable bounds in Unreal cm.
 * Tuned to span early Brynmoor → mid Ghornfell from observed dedicated-server coords.
 * Phase B can replace this with calibrated landmarks from live player positions.
 */
export const ASHENFALL_BOUNDS = {
  minX: 0,
  maxX: 220_000,
  minY: 40_000,
  maxY: 260_000,
} as const;

export function projectToMap(
  x: number,
  y: number,
  bounds = ASHENFALL_BOUNDS,
  pad = 0.04,
): { leftPct: number; topPct: number } {
  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1);
  const nx = (x - bounds.minX) / spanX;
  const ny = (y - bounds.minY) / spanY;
  return {
    leftPct: (pad + Math.min(1, Math.max(0, nx)) * (1 - pad * 2)) * 100,
    // Unreal Y increases "north" in our holdings view → flip for screen
    topPct: (pad + (1 - Math.min(1, Math.max(0, ny))) * (1 - pad * 2)) * 100,
  };
}
