/**
 * Ashenfall world-map calibration from the game's T_WorldMap_Landmass
 * (same constants published in dragonwildsdatabase.com/map/world.json).
 *
 * world → map UV:
 *   u = (x - ox) / size
 *   v = (y - oy) / size
 */
export const ASHENFALL_MAP = {
  /** Unreal cm span covered by the square world map texture */
  size: 485_000,
  ox: -42_500,
  oy: -147_500,
  /** Source texture name inside the game */
  texture: "T_WorldMap_Landmass",
  /** Native texture pixels */
  px: 6144,
} as const;

export function projectToMap(
  x: number,
  y: number,
  map = ASHENFALL_MAP,
): { leftPct: number; topPct: number; onMap: boolean } {
  const u = (x - map.ox) / map.size;
  const v = (y - map.oy) / map.size;
  const onMap = u >= 0 && u <= 1 && v >= 0 && v <= 1;
  return {
    leftPct: Math.min(100, Math.max(0, u * 100)),
    // Match in-game / community map: v increases toward the bottom of the image
    topPct: Math.min(100, Math.max(0, v * 100)),
    onMap,
  };
}
