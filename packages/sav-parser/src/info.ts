import { findChunk, readFString } from "./binary.js";

export type SaveInfo = {
  savedAtIso: string | null;
  worldName: string | null;
  worldMapName: string | null;
  cinfKeys: string[];
};

/**
 * Best-effort INFO/CINF extraction.
 * INFO bodies start with a non-chunk preamble — never walkChunks from bodyStart.
 */
export function parseSaveInfo(data: Buffer): SaveInfo {
  try {
    const info = findChunk(data, "INFO");
    if (!info) {
      return {
        savedAtIso: null,
        worldName: null,
        worldMapName: null,
        cinfKeys: [],
      };
    }

    let savedAtIso: string | null = null;
    const body = data.subarray(info.bodyStart, Math.min(info.bodyEnd, data.length));
    const isoMatch = body.toString("latin1").match(
      /20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/,
    );
    if (isoMatch) savedAtIso = isoMatch[0];

    // Search for CINF inside INFO without assuming chunked layout from offset 0
    const cinf = findChunk(data, "CINF", info.bodyStart, Math.min(info.bodyEnd, data.length));

    let worldName: string | null = null;
    let worldMapName: string | null = null;
    const cinfKeys: string[] = [];

    if (cinf) {
      let offset = cinf.bodyStart;
      try {
        const keyCount = data.readUInt32LE(offset);
        offset += 4;
        if (keyCount > 0 && keyCount < 64) {
          for (let i = 0; i < keyCount; i++) {
            const { value, next } = readFString(data, offset);
            cinfKeys.push(value);
            offset = next;
          }
        }
      } catch {
        // ignore partial CINF
      }
    }

    const glob = findChunk(data, "GLOB");
    if (glob) {
      try {
        const { value: mapHint } = readFString(data, glob.bodyStart);
        if (mapHint === "L_World") worldMapName = "L_World";
      } catch {
        // ignore
      }
    }

    return { savedAtIso, worldName, worldMapName, cinfKeys };
  } catch {
    return {
      savedAtIso: null,
      worldName: null,
      worldMapName: null,
      cinfKeys: [],
    };
  }
}
