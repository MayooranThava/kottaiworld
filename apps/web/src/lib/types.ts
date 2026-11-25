export type Vec3 = { x: number; y: number; z: number };

export type BaseCluster = {
  id: string;
  pieceCount: number;
  centroid: Vec3;
  bbox: { min: Vec3; max: Vec3 };
  cellKeys: string[];
};

export type WorldSaveSummary = {
  fileName: string;
  worldName: string | null;
  worldMapName: string | null;
  savedAtIso: string | null;
  fileSizeBytes: number;
  pieceCount: number;
  bases: BaseCluster[];
  parseWarnings: string[];
};

export type WorldListItem = {
  fileName: string;
  sizeBytes: number;
  mtimeIso: string;
};

export type Snapshot = {
  collectedAtIso: string;
  serverName: string;
  configuredWorld: string;
  dataRootMounted: boolean;
  saveGamesPath: string;
  worlds: WorldListItem[];
  primary: WorldSaveSummary | null;
  error: string | null;
  mode: "live" | "empty" | "error";
  diagnostics?: string[];
};
