import type { BaseCluster, BuildingPiece, ClusterOptions, Vec3 } from "./types.js";

function cellKey(x: number, y: number, cellCm: number): string {
  const cx = Math.floor(x / cellCm);
  const cy = Math.floor(y / cellCm);
  return `${cx}:${cy}`;
}

type CellAgg = {
  key: string;
  count: number;
  sum: Vec3;
  min: Vec3;
  max: Vec3;
};

function emptyVec(): Vec3 {
  return { x: 0, y: 0, z: 0 };
}

/**
 * Grid-cluster building pieces into "bases".
 * Adjacent occupied cells (4-neighborhood) with enough pieces merge into one base.
 */
export function clusterBases(
  pieces: BuildingPiece[],
  options: ClusterOptions = {},
): BaseCluster[] {
  const cellCm = options.cellCm ?? 5000;
  const minPieces = options.minPieces ?? 25;

  const cells = new Map<string, CellAgg>();

  for (const p of pieces) {
    const key = cellKey(p.position.x, p.position.y, cellCm);
    let agg = cells.get(key);
    if (!agg) {
      agg = {
        key,
        count: 0,
        sum: emptyVec(),
        min: { ...p.position },
        max: { ...p.position },
      };
      cells.set(key, agg);
    }
    agg.count += 1;
    agg.sum.x += p.position.x;
    agg.sum.y += p.position.y;
    agg.sum.z += p.position.z;
    agg.min.x = Math.min(agg.min.x, p.position.x);
    agg.min.y = Math.min(agg.min.y, p.position.y);
    agg.min.z = Math.min(agg.min.z, p.position.z);
    agg.max.x = Math.max(agg.max.x, p.position.x);
    agg.max.y = Math.max(agg.max.y, p.position.y);
    agg.max.z = Math.max(agg.max.z, p.position.z);
  }

  // Union-find adjacent cells
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let p = parent.get(k) ?? k;
    while (p !== (parent.get(p) ?? p)) p = parent.get(p) ?? p;
    parent.set(k, p);
    return p;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const key of cells.keys()) {
    parent.set(key, key);
  }

  for (const key of cells.keys()) {
    const [cx, cy] = key.split(":").map(Number);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ] as const) {
      const nk = `${cx + dx}:${cy + dy}`;
      if (cells.has(nk)) union(key, nk);
    }
  }

  const groups = new Map<string, CellAgg[]>();
  for (const agg of cells.values()) {
    const root = find(agg.key);
    const list = groups.get(root) ?? [];
    list.push(agg);
    groups.set(root, list);
  }

  const bases: BaseCluster[] = [];
  let idx = 0;
  for (const group of groups.values()) {
    const pieceCount = group.reduce((n, g) => n + g.count, 0);
    if (pieceCount < minPieces) continue;

    const sum = emptyVec();
    const min = { ...group[0]!.min };
    const max = { ...group[0]!.max };
    for (const g of group) {
      sum.x += g.sum.x;
      sum.y += g.sum.y;
      sum.z += g.sum.z;
      min.x = Math.min(min.x, g.min.x);
      min.y = Math.min(min.y, g.min.y);
      min.z = Math.min(min.z, g.min.z);
      max.x = Math.max(max.x, g.max.x);
      max.y = Math.max(max.y, g.max.y);
      max.z = Math.max(max.z, g.max.z);
    }

    bases.push({
      id: `base-${++idx}`,
      pieceCount,
      centroid: {
        x: sum.x / pieceCount,
        y: sum.y / pieceCount,
        z: sum.z / pieceCount,
      },
      bbox: { min, max },
      cellKeys: group.map((g) => g.key),
    });
  }

  bases.sort((a, b) => b.pieceCount - a.pieceCount);
  return bases;
}
