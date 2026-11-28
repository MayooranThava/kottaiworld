import { inflateSync } from "node:zlib";

/** Unreal FString: int32 length (incl. NUL); negative = UTF-16LE. */
export function readFString(
  data: Buffer,
  offset: number,
): { value: string; next: number } {
  if (offset + 4 > data.length) {
    throw new Error("FString truncated (length)");
  }
  const length = data.readInt32LE(offset);
  let next = offset + 4;
  if (length === 0) return { value: "", next };
  if (length > 0) {
    if (next + length > data.length) throw new Error("FString truncated (ansi)");
    const raw = data.subarray(next, next + length - 1);
    return { value: raw.toString("latin1"), next: next + length };
  }
  const n = -length;
  const byteLen = n * 2;
  if (next + byteLen > data.length) throw new Error("FString truncated (utf16)");
  const raw = data.subarray(next, next + byteLen - 2);
  return { value: raw.toString("utf16le"), next: next + byteLen };
}

export type Chunk = {
  tag: string;
  bodyStart: number;
  bodyEnd: number;
};

export function readChunkHeader(data: Buffer, offset: number): Chunk {
  if (offset + 8 > data.length) throw new Error("chunk header truncated");
  const rawTag = data.subarray(offset, offset + 4);
  const tag = rawTag.toString("latin1");
  const safeTag = /^[\x20-\x7E]{4}$/.test(tag) ? tag : rawTag.toString("hex");
  const length = data.readUInt32LE(offset + 4);
  const bodyStart = offset + 8;
  const bodyEnd = bodyStart + length;
  if (bodyEnd > data.length) {
    throw new Error(`chunk ${safeTag} overflows buffer (len=${length})`);
  }
  return { tag, bodyStart, bodyEnd };
}

/** Walk immediate child chunks inside [start, end). Soft-stops on garbage headers. */
export function* walkChunks(
  data: Buffer,
  start: number,
  end: number,
): Generator<Chunk> {
  let offset = start;
  while (offset + 8 <= end) {
    let chunk: Chunk;
    try {
      chunk = readChunkHeader(data, offset);
    } catch {
      break;
    }
    // Reject non-printable tags / nonsense lengths (common when preamble isn't chunked)
    if (!/^[A-Za-z0-9]{3,4}$/.test(chunk.tag.trim()) && !/^[A-Za-z]{4}$/.test(chunk.tag)) {
      break;
    }
    if (chunk.bodyEnd > end || chunk.bodyEnd <= chunk.bodyStart) break;
    yield chunk;
    offset = chunk.bodyEnd;
  }
}

/** Find first occurrence of a 4-byte ASCII tag as a chunk header. */
export function findChunk(
  data: Buffer,
  tag: string,
  start = 0,
  end = data.length,
): Chunk | null {
  const needle = Buffer.from(tag, "ascii");
  if (needle.length !== 4) throw new Error("tag must be 4 bytes");
  let i = start;
  while (i + 8 <= end) {
    const at = data.indexOf(needle, i);
    if (at < 0 || at + 8 > end) return null;
    try {
      const chunk = readChunkHeader(data, at);
      if (chunk.bodyEnd <= end) return chunk;
    } catch {
      // not a real chunk header; keep scanning
    }
    i = at + 1;
  }
  return null;
}

/**
 * Dedicated-server saves are usually raw SAVE trees.
 * Some PC/Xbox exports are 12-byte header + zlib.
 */
export function unwrapSaveBuffer(input: Buffer): Buffer {
  if (input.length >= 4 && input.subarray(0, 4).toString("ascii") === "SAVE") {
    return input;
  }
  if (
    input.length > 16 &&
    input.readUInt32LE(0) === 0x0c &&
    input[12] === 0x78
  ) {
    return inflateSync(input.subarray(12));
  }
  // Last resort: look for SAVE magic
  const idx = input.indexOf(Buffer.from("SAVE"));
  if (idx >= 0 && input.readUInt32LE(idx + 4) + 8 <= input.length - idx) {
    return input.subarray(idx);
  }
  throw new Error("Unrecognized .sav format (no SAVE root)");
}
