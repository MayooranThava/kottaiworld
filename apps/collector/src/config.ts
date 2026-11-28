import { join } from "node:path";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: num("COLLECTOR_PORT", 4100),
  dataRoot: process.env.RSDW_DATA_ROOT ?? "/data/rsdw",
  saveGamesSubpath:
    process.env.SAVE_GAMES_SUBPATH ?? "RSDragonwilds/Saved/SaveGames",
  primaryWorld: process.env.PRIMARY_WORLD ?? "KottaiWorld",
  intervalSec: num("COLLECT_INTERVAL_SEC", 120),
  baseMinPieces: num("BASE_MIN_PIECES", 25),
  baseCellCm: num("BASE_CELL_CM", 5000),
  serverName: process.env.KOTTAI_SERVER_NAME ?? "KottaiServer",
  worldName: process.env.KOTTAI_WORLD_NAME ?? "KottaiWorld",
  workDir: process.env.COLLECTOR_WORK_DIR ?? join(process.cwd(), "work"),
};

export function saveGamesDir(): string {
  return join(config.dataRoot, config.saveGamesSubpath);
}
