#!/usr/bin/env node
/**
 * Turn a live collector snapshot into a safe public JSON copy.
 * Strips filesystem paths, diagnostics, and internal cluster keys.
 *
 * Usage:
 *   node scripts/sanitize-snapshot.mjs [in.json] [out.json]
 *   curl -s http://127.0.0.1:4100/api/snapshot | node scripts/sanitize-snapshot.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function round(n) {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
}

function sanitizeBase(b) {
  return {
    id: String(b.id ?? "base"),
    pieceCount: Number(b.pieceCount) || 0,
    centroid: {
      x: round(b.centroid?.x),
      y: round(b.centroid?.y),
      z: round(b.centroid?.z),
    },
  };
}

function sanitizePrimary(p) {
  if (!p) return null;
  return {
    fileName: p.fileName ?? null,
    worldName: p.worldName ?? null,
    worldMapName: p.worldMapName ?? null,
    savedAtIso: p.savedAtIso ?? null,
    fileSizeBytes: Number(p.fileSizeBytes) || 0,
    pieceCount: Number(p.pieceCount) || 0,
    blueprintCount: Number(p.blueprintCount) || 0,
    blueprints: Array.isArray(p.blueprints)
      ? p.blueprints.slice(0, 8).map((b) => ({
          classGuid: String(b.classGuid ?? "").slice(0, 12),
          count: Number(b.count) || 0,
          share: Number(b.share) || 0,
        }))
      : [],
    bases: Array.isArray(p.bases) ? p.bases.map(sanitizeBase) : [],
  };
}

function sanitizeUptime(u) {
  if (!u || typeof u !== "object") {
    return {
      processStartedAtIso: new Date().toISOString(),
      firstLiveAtIso: null,
      ticks: [],
      windowHours: 6,
      intervalSec: 120,
    };
  }
  const ticks = Array.isArray(u.ticks) ? u.ticks.slice(-180) : [];
  return {
    processStartedAtIso: u.processStartedAtIso ?? new Date().toISOString(),
    firstLiveAtIso: u.firstLiveAtIso ?? null,
    ticks: ticks.map((t) => ({
      atIso: t.atIso,
      status: ["up", "down", "degraded", "pending"].includes(t.status)
        ? t.status
        : "pending",
    })),
    windowHours: Number(u.windowHours) || 6,
    intervalSec: Number(u.intervalSec) || 120,
  };
}

export function sanitizeSnapshot(raw) {
  const worlds = Array.isArray(raw.worlds)
    ? raw.worlds.map((w) => ({
        fileName: w.fileName,
        sizeBytes: Number(w.sizeBytes) || 0,
        mtimeIso: w.mtimeIso,
      }))
    : [];

  return {
    source: "published",
    publishedAtIso: new Date().toISOString(),
    collectedAtIso: raw.collectedAtIso ?? new Date().toISOString(),
    serverName: raw.serverName ?? "KottaiServer",
    configuredWorld: raw.configuredWorld ?? "KottaiWorld",
    mode:
      raw.mode === "live" || raw.mode === "empty" || raw.mode === "error"
        ? raw.mode
        : "empty",
    worlds,
    primary: sanitizePrimary(raw.primary),
    uptime: sanitizeUptime(raw.uptime),
    upStreakSec:
      typeof raw.upStreakSec === "number"
        ? Math.max(0, Math.floor(raw.upStreakSec))
        : null,
    players: Array.isArray(raw.players)
      ? raw.players.map((p) => ({
          nickname: String(p.nickname ?? p.name ?? "Player").slice(0, 32),
          x: round(p.x ?? p.centroid?.x),
          y: round(p.y ?? p.centroid?.y),
        }))
      : [],
  };
}

const inPath = process.argv[2];
const outPath = process.argv[3] ?? "apps/web/public/data/snapshot.json";

let raw;
if (inPath) {
  raw = JSON.parse(readFileSync(inPath, "utf8"));
} else {
  const stdin = readFileSync(0, "utf8");
  if (!stdin.trim()) {
    console.error("No input. Pipe collector JSON or pass an input file path.");
    process.exit(1);
  }
  raw = JSON.parse(stdin);
}

const clean = sanitizeSnapshot(raw);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(clean, null, 2)}\n`, "utf8");
console.log(
  `Wrote ${outPath} (${clean.primary?.pieceCount ?? 0} pieces, ${clean.primary?.bases?.length ?? 0} bases, ${clean.uptime.ticks.length} uptime ticks)`,
);
