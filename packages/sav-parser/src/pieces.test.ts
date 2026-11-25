import assert from "node:assert/strict";
import { test } from "node:test";
import { clusterBases } from "./cluster.js";
import { parsePcesPieces } from "./pieces.js";
import type { BuildingPiece } from "./types.js";

function writeFString23(buf: Buffer, offset: number, guid22: string): number {
  buf.writeUInt32LE(23, offset);
  offset += 4;
  buf.write(guid22 + "\0", offset, 23, "ascii");
  return offset + 23;
}

function buildFakeSaveWithPces(pieces: Array<{ id: number; x: number; y: number; z: number }>): Buffer {
  const guid = "4AfTREj9KmVBOF-HvMtqhw"; // 22 chars
  const records: Buffer[] = [];
  for (const p of pieces) {
    const rec = Buffer.alloc(4 + 4 + 23 + 24 + 12 + 4);
    let o = 0;
    rec.writeUInt32LE(p.id, o);
    o += 4;
    o = writeFString23(rec, o, guid);
    rec.writeDoubleLE(p.x, o);
    rec.writeDoubleLE(p.y, o + 8);
    rec.writeDoubleLE(p.z, o + 16);
    o += 24;
    rec.writeFloatLE(90, o);
    rec.writeFloatLE(400, o + 4);
    rec.writeFloatLE(1, o + 8);
    o += 12;
    rec.writeUInt32LE(0, o); // ref_count
    records.push(rec);
  }
  const body = Buffer.concat(records);
  const pces = Buffer.alloc(8 + body.length);
  pces.write("Pces", 0, 4, "ascii");
  pces.writeUInt32LE(body.length, 4);
  body.copy(pces, 8);

  // Minimal SAVE wrapper so findChunk works from full file
  const saveBody = pces;
  const save = Buffer.alloc(8 + saveBody.length);
  save.write("SAVE", 0, 4, "ascii");
  save.writeUInt32LE(saveBody.length, 4);
  saveBody.copy(save, 8);
  return save;
}

test("parsePcesPieces reads synthetic records", () => {
  const buf = buildFakeSaveWithPces([
    { id: 1, x: 10000, y: 20000, z: 100 },
    { id: 2, x: 10100, y: 20100, z: 100 },
  ]);
  const { pieces, warnings } = parsePcesPieces(buf);
  assert.equal(warnings.length, 0);
  assert.equal(pieces.length, 2);
  assert.equal(pieces[0]!.classGuid, "4AfTREj9KmVBOF-HvMtqhw");
  assert.equal(pieces[0]!.position.x, 10000);
});

test("clusterBases merges nearby cells", () => {
  const pieces: BuildingPiece[] = [];
  for (let i = 0; i < 30; i++) {
    pieces.push({
      id: i + 1,
      classGuid: "x",
      position: { x: 1000 + i * 10, y: 2000, z: 0 },
      yawDeg: 0,
    });
  }
  // far away small cluster — ignored by minPieces
  for (let i = 0; i < 5; i++) {
    pieces.push({
      id: 100 + i,
      classGuid: "x",
      position: { x: 900_000, y: 900_000, z: 0 },
      yawDeg: 0,
    });
  }
  const bases = clusterBases(pieces, { cellCm: 5000, minPieces: 25 });
  assert.equal(bases.length, 1);
  assert.equal(bases[0]!.pieceCount, 30);
});
