export type Vec3 = { x: number; y: number; z: number };

export type BaseCluster = {
  id: string;
  pieceCount: number;
  centroid: Vec3;
  bbox: { min: Vec3; max: Vec3 };
  cellKeys: string[];
};

export type BlueprintStat = {
  classGuid: string;
  count: number;
  share: number;
};

export type WorldSaveSummary = {
  fileName: string;
  worldName: string | null;
  worldMapName: string | null;
  savedAtIso: string | null;
  fileSizeBytes: number;
  pieceCount: number;
  bases: BaseCluster[];
  blueprintCount?: number;
  blueprints?: BlueprintStat[];
  parseWarnings: string[];
};

export type WorldListItem = {
  fileName: string;
  sizeBytes: number;
  mtimeIso: string;
};

export type UptimeStatus = "up" | "down" | "degraded" | "pending";

export type UptimeTick = {
  atIso: string;
  status: UptimeStatus;
};

export type UptimeHistory = {
  processStartedAtIso: string;
  firstLiveAtIso: string | null;
  ticks: UptimeTick[];
  windowHours: number;
  intervalSec: number;
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
  uptime?: UptimeHistory;
  upStreakSec?: number | null;
};
