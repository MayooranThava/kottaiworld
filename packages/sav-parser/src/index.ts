import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import { unwrapSaveBuffer } from "./binary.js";
import { summarizeBlueprints } from "./blueprints.js";
import { clusterBases } from "./cluster.js";
import { findChunkInFile, probeSaveFile, readFileRange, readHead } from "./fileScan.js";
import { parseSaveInfo } from "./info.js";
import { parsePcesPieces } from "./pieces.js";
import type { ClusterOptions, WorldSaveSummary } from "./types.js";

export type {
  BaseCluster,
  BlueprintStat,
  BuildingPiece,
  ClusterOptions,
  Vec3,
  WorldSaveSummary,
} from "./types.js";
export { summarizeBlueprints } from "./blueprints.js";
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
  const blueprints = summarizeBlueprints(pieces);
  const worldFromFile = fileName.replace(/\.sav$/i, "");

  return {
    fileName,
    worldName: info.worldName ?? worldFromFile,
    worldMapName: info.worldMapName,
    savedAtIso: info.savedAtIso,
    fileSizeBytes: buffer.length,
    pieceCount: pieces.length,
    bases,
    blueprintCount: blueprints.unique,
    blueprints: blueprints.top,
    piecesSample: pieces.slice(0, 40),
    parseWarnings: warnings,
  };
}

/**
 * Analyze a large dedicated-server .sav without loading the whole file into RAM.
 * Reads INFO from the head, then locates and loads only the Pces chunk.
 */
export async function analyzeWorldSaveFromFile(
  filePath: string,
  options: ClusterOptions = {},
): Promise<WorldSaveSummary> {
  const fileName = basename(filePath);
  const worldFromFile = fileName.replace(/\.sav$/i, "");
  const probe = await probeSaveFile(filePath);
  const warnings: string[] = [];

  if (!probe.isSave) {
    warnings.push("File does not start with SAVE magic (or known compressed wrapper)");
  }

  // Compressed wrapper needs full inflate — only safe for smaller files
  const head = await readHead(filePath, Math.min(64, probe.size));
  if (head.length >= 13 && head.readUInt32LE(0) === 0x0c && head[12] === 0x78) {
    if (probe.size > 512 * 1024 * 1024) {
      throw new Error(
        `Compressed .sav is ${(probe.size / 1024 ** 3).toFixed(2)} GiB — too large to inflate in Phase A`,
      );
    }
    const full = await readFile(filePath);
    return analyzeWorldSave(full, filePath, options);
  }

  const infoBuf = await readHead(filePath, Math.min(1024 * 1024, probe.size));
  const info = parseSaveInfo(infoBuf);

  const pces = await findChunkInFile(filePath, "Pces");
  let pieces: ReturnType<typeof parsePcesPieces>["pieces"] = [];
  if (!pces) {
    warnings.push("No Pces chunk found (no GlobalBuildingManager pieces yet?)");
  } else {
    const pcesLen = pces.bodyEnd - pces.bodyStart;
    // Include 8-byte chunk header so parsePcesPieces/findChunk works
    const chunkBuf = await readFileRange(filePath, pces.bodyStart - 8, pces.bodyEnd);
    if (chunkBuf.length !== pcesLen + 8) {
      warnings.push(`Pces read incomplete (${chunkBuf.length} vs ${pcesLen + 8})`);
    }
    const parsed = parsePcesPieces(chunkBuf);
    pieces = parsed.pieces;
    warnings.push(...parsed.warnings.filter((w) => !w.includes("No Pces")));
  }

  const bases = clusterBases(pieces, options);
  const blueprints = summarizeBlueprints(pieces);

  return {
    fileName,
    worldName: info.worldName ?? worldFromFile,
    worldMapName: info.worldMapName,
    savedAtIso: info.savedAtIso,
    fileSizeBytes: probe.size,
    pieceCount: pieces.length,
    bases,
    blueprintCount: blueprints.unique,
    blueprints: blueprints.top,
    piecesSample: pieces.slice(0, 40),
    parseWarnings: warnings,
  };
}
