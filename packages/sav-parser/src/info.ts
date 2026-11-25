import { findChunk, readFString, walkChunks } from "./binary.js";

export type SaveInfo = {
  savedAtIso: string | null;
  worldName: string | null;
  worldMapName: string | null;
  cinfKeys: string[];
};

/**
 * Best-effort INFO/CINF extraction.
 * CINF value decoding is incomplete (offset table); we still surface keys +
 * ISO timestamp FString that sits in INFO before CINF.
 */
export function parseSaveInfo(data: Buffer): SaveInfo {
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
  // INFO: short preamble then ISO FString — scan for a plausible timestamp string
  const body = data.subarray(info.bodyStart, info.bodyEnd);
  const isoMatch = body.toString("latin1").match(
    /20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/,
  );
  if (isoMatch) savedAtIso = isoMatch[0];

  const cinf = [...walkChunks(data, info.bodyStart, info.bodyEnd)].find(
    (c) => c.tag === "CINF",
  );

  let worldName: string | null = null;
  let worldMapName: string | null = null;
  const cinfKeys: string[] = [];

  if (cinf) {
    // CINF: u32 n, n × FString key, …
    let offset = cinf.bodyStart;
    try {
      const keyCount = data.readUInt32LE(offset);
      offset += 4;
      for (let i = 0; i < keyCount && i < 64; i++) {
        const { value, next } = readFString(data, offset);
        cinfKeys.push(value);
        offset = next;
      }
    } catch {
      // ignore partial CINF
    }
  }

  // WorldName often appears as a clear FString near L_World in GLOB — heuristic fallback
  const glob = findChunk(data, "GLOB");
  if (glob) {
    try {
      const { value: mapHint } = readFString(data, glob.bodyStart);
      if (mapHint === "L_World") worldMapName = "L_World";
    } catch {
      // ignore
    }
  }

  // Filename-independent: search for WorldMapName companion "L_World" nearby strings is hard;
  // caller can set worldName from the .sav basename.
  return { savedAtIso, worldName, worldMapName, cinfKeys };
}
