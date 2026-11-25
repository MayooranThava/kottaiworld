import { basename } from "node:path";
import { unwrapSaveBuffer } from "./binary.js";
import { clusterBases } from "./cluster.js";
import { parseSaveInfo } from "./info.js";
import { parsePcesPieces } from "./pieces.js";
import type { ClusterOptions, WorldSaveSummary } from "./types.js";

export type {
  BaseCluster,
  BuildingPiece,
  ClusterOptions,
  Vec3,
  WorldSaveSummary,
} from "./types.js";
export { clusterBases } from "./cluster.js";
export { parsePcesPieces } from "./pieces.js";
export { parseSaveInfo } from "./info.js";
export { unwrapSaveBuffer } from "./binary.js";

export function analyzeWorldSave(
  buffer: Buffer,
  filePathOrName: string,
  options: ClusterOptions = {},
): WorldSaveSummary {
  const fileName = basename(filePathOrName);
  const data = unwrapSaveBuffer(buffer);
  const info = parseSaveInfo(data);
  const { pieces, warnings } = parsePcesPieces(data);
  const bases = clusterBases(pieces, options);

  const worldFromFile = fileName.replace(/\.sav$/i, "");

  return {
    fileName,
    worldName: info.worldName ?? worldFromFile,
    worldMapName: info.worldMapName,
    savedAtIso: info.savedAtIso,
    fileSizeBytes: buffer.length,
    pieceCount: pieces.length,
    bases,
    piecesSample: pieces.slice(0, 40),
    parseWarnings: warnings,
  };
}
