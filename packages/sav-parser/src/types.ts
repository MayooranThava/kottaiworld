export type Vec3 = { x: number; y: number; z: number };

export type BuildingPiece = {
  id: number;
  classGuid: string;
  position: Vec3;
  yawDeg: number;
};

export type BaseCluster = {
  id: string;
  pieceCount: number;
  centroid: Vec3;
  bbox: {
    min: Vec3;
    max: Vec3;
  };
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
  piecesSample: BuildingPiece[];
  parseWarnings: string[];
};

export type ClusterOptions = {
  cellCm?: number;
  minPieces?: number;
};
