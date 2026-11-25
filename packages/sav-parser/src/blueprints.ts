import type { BuildingPiece } from "./types.js";

export type BlueprintStat = {
  classGuid: string;
  count: number;
  share: number;
};

export type BlueprintSummary = {
  unique: number;
  top: BlueprintStat[];
};

/** Aggregate piece class GUIDs into a blueprint ledger. */
export function summarizeBlueprints(
  pieces: BuildingPiece[],
  topN = 8,
): BlueprintSummary {
  const counts = new Map<string, number>();
  for (const p of pieces) {
    counts.set(p.classGuid, (counts.get(p.classGuid) ?? 0) + 1);
  }
  const total = pieces.length || 1;
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([classGuid, count]) => ({
      classGuid,
      count,
      share: count / total,
    }));
  return { unique: counts.size, top };
}
