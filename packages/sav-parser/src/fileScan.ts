import { open, type FileHandle } from "node:fs/promises";

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MiB window
const OVERLAP = 64;

export type FileChunk = {
  tag: string;
  /** Absolute file offset of chunk body start */
  bodyStart: number;
  bodyEnd: number;
};

/** Find first IFF-style chunk with the given 4-byte tag without loading the whole file. */
export async function findChunkInFile(
  filePath: string,
  tag: string,
): Promise<FileChunk | null> {
  if (tag.length !== 4) throw new Error("tag must be 4 bytes");
  const needle = Buffer.from(tag, "ascii");
  const fh = await open(filePath, "r");
  try {
    const stat = await fh.stat();
    const size = stat.size;
    let offset = 0;
    let carry = Buffer.alloc(0);

    while (offset < size) {
      const toRead = Math.min(CHUNK_SIZE, size - offset);
      const buf = Buffer.allocUnsafe(toRead);
      const { bytesRead } = await fh.read(buf, 0, toRead, offset);
      const window = carry.length
        ? Buffer.concat([carry, buf.subarray(0, bytesRead)])
        : buf.subarray(0, bytesRead);

      const windowFileStart = offset - carry.length;
      let searchFrom = 0;
      while (searchFrom + 8 <= window.length) {
        const at = window.indexOf(needle, searchFrom);
        if (at < 0 || at + 8 > window.length) break;

        const length = window.readUInt32LE(at + 4);
        const absHeader = windowFileStart + at;
        const bodyStart = absHeader + 8;
        const bodyEnd = bodyStart + length;
        // Reject huge false positives (would OOM) and empty bodies
        const maxBody =
          tag === "Pces" ? 800 * 1024 * 1024 : Math.min(size - 1, 64 * 1024 * 1024);
        if (length > 0 && length <= maxBody && bodyEnd <= size) {
          // For Pces, require a plausible piece record near the start (len=23 GUID)
          if (tag === "Pces") {
            const peekLen = Math.min(64, length);
            if (at + 8 + peekLen <= window.length) {
              const peek = window.subarray(at + 8, at + 8 + peekLen);
              const guidMarker = Buffer.from([0x17, 0x00, 0x00, 0x00]);
              if (peek.indexOf(guidMarker) < 0) {
                searchFrom = at + 1;
                continue;
              }
            }
          }
          return { tag, bodyStart, bodyEnd };
        }
        searchFrom = at + 1;
      }

      carry = window.subarray(Math.max(0, window.length - OVERLAP));
      offset += bytesRead;
    }
    return null;
  } finally {
    await fh.close();
  }
}

export async function readFileRange(
  filePath: string,
  start: number,
  end: number,
): Promise<Buffer> {
  const fh = await open(filePath, "r");
  try {
    const len = end - start;
    const buf = Buffer.allocUnsafe(len);
    let filled = 0;
    while (filled < len) {
      const { bytesRead } = await fh.read(buf, filled, len - filled, start + filled);
      if (bytesRead === 0) break;
      filled += bytesRead;
    }
    return buf.subarray(0, filled);
  } finally {
    await fh.close();
  }
}

/** Read SAVE magic + verify; return file size. */
export async function probeSaveFile(filePath: string): Promise<{ size: number; isSave: boolean }> {
  const fh = await open(filePath, "r");
  try {
    const stat = await fh.stat();
    const head = Buffer.alloc(16);
    await fh.read(head, 0, 16, 0);
    const isSave =
      head.subarray(0, 4).toString("ascii") === "SAVE" ||
      (head.readUInt32LE(0) === 0x0c && head[12] === 0x78);
    return { size: stat.size, isSave };
  } finally {
    await fh.close();
  }
}

export async function readHead(filePath: string, bytes: number): Promise<Buffer> {
  return readFileRange(filePath, 0, bytes);
}

export type { FileHandle };
