import { findChunk } from "./binary.js";
import type { BuildingPiece } from "./types.js";

const GUID_LEN = 23; // 22 chars + NUL, length prefix 0x17
const LEN_PREFIX = Buffer.from([0x17, 0x00, 0x00, 0x00]);

function isPlausibleWorldCoord(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n) < 5_000_000;
}

/**
 * Scan Pces body for building piece main records.
 * Strategy from community RE: FString-23 + 3 doubles (position) + floats + ref_count.
 */
export function parsePcesPieces(data: Buffer): {
  pieces: BuildingPiece[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const pces = findChunk(data, "Pces");
  if (!pces) {
    warnings.push("No Pces chunk found (no GlobalBuildingManager pieces yet?)");
    return { pieces: [], warnings };
  }

  const start = pces.bodyStart;
  const end = pces.bodyEnd;
  const pieces: BuildingPiece[] = [];
  const seen = new Set<number>();

  let i = start;
  while (i + 4 + GUID_LEN + 8 * 3 + 12 <= end) {
    const at = data.indexOf(LEN_PREFIX, i);
    if (at < 0 || at >= end) break;

    const guidStart = at + 4;
    const guidEnd = guidStart + GUID_LEN;
    if (guidEnd > end) break;

    const classGuid = data.subarray(guidStart, guidEnd - 1).toString("ascii");
    // base64url-ish charset
    if (!/^[A-Za-z0-9_-]+$/.test(classGuid)) {
      i = at + 1;
      continue;
    }

    const posOff = guidEnd;
    if (posOff + 24 + 12 + 4 > end) {
      i = at + 1;
      continue;
    }

    const x = data.readDoubleLE(posOff);
    const y = data.readDoubleLE(posOff + 8);
    const z = data.readDoubleLE(posOff + 16);
    if (
      !isPlausibleWorldCoord(x) ||
      !isPlausibleWorldCoord(y) ||
      !isPlausibleWorldCoord(z)
    ) {
      // likely a ref GUID, not a main record
      i = at + 1;
      continue;
    }

    const yawDeg = data.readFloatLE(posOff + 24);
    // skip extra_b, extra_c
    const refCountOff = posOff + 24 + 12;
    const refCount = data.readUInt32LE(refCountOff);
    if (refCount < 0 || refCount > 16) {
      i = at + 1;
      continue;
    }

    // persistent_id sits immediately before the length prefix
    let id = pieces.length + 1;
    if (at >= start + 4) {
      id = data.readUInt32LE(at - 4);
    }
    if (seen.has(id)) {
      // duplicate scan hit — advance
      i = at + 1;
      continue;
    }
    seen.add(id);

    pieces.push({
      id,
      classGuid,
      position: { x, y, z },
      yawDeg,
    });

    // Jump ahead roughly past this record's fixed head; refs vary
    i = refCountOff + 4;
  }

  if (pieces.length === 0) {
    warnings.push("Pces chunk present but no piece records decoded");
  }

  return { pieces, warnings };
}
