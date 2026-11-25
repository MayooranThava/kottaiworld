import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { analyzeWorldSave, type WorldSaveSummary } from "@kottaiworld/sav-parser";
import { config, saveGamesDir } from "./config.js";

export type WorldListItem = {
  fileName: string;
  sizeBytes: number;
  mtimeIso: string;
};

export type Snapshot = {
  collectedAtIso: string;
  serverName: string;
  configuredWorld: string;
  dataRootMounted: boolean;
  saveGamesPath: string;
  worlds: WorldListItem[];
  primary: WorldSaveSummary | null;
  error: string | null;
  mode: "live" | "empty" | "error";
};

let latest: Snapshot = {
  collectedAtIso: new Date(0).toISOString(),
  serverName: config.serverName,
  configuredWorld: config.primaryWorld,
  dataRootMounted: false,
  saveGamesPath: saveGamesDir(),
  worlds: [],
  primary: null,
  error: "Collector has not run yet",
  mode: "empty",
};

export function getSnapshot(): Snapshot {
  return latest;
}

async function listWorlds(dir: string): Promise<WorldListItem[]> {
  const entries = await readdir(dir);
  const worlds: WorldListItem[] = [];
  for (const name of entries) {
    if (!name.toLowerCase().endsWith(".sav")) continue;
    if (name.includes(".backup") || name.includes(".verbackup")) continue;
    const full = join(dir, name);
    const s = await stat(full);
    worlds.push({
      fileName: name,
      sizeBytes: s.size,
      mtimeIso: s.mtime.toISOString(),
    });
  }
  worlds.sort((a, b) => a.fileName.localeCompare(b.fileName));
  return worlds;
}

export async function collectOnce(): Promise<Snapshot> {
  const collectedAtIso = new Date().toISOString();
  const dir = saveGamesDir();

  try {
    await mkdir(config.workDir, { recursive: true });
    const worlds = await listWorlds(dir);

    if (worlds.length === 0) {
      latest = {
        collectedAtIso,
        serverName: config.serverName,
        configuredWorld: config.primaryWorld,
        dataRootMounted: true,
        saveGamesPath: dir,
        worlds: [],
        primary: null,
        error: `No .sav files in ${dir}`,
        mode: "empty",
      };
      return latest;
    }

    const primaryName = `${config.primaryWorld}.sav`;
    const primaryMeta =
      worlds.find((w) => w.fileName === primaryName) ?? worlds[0]!;

    const src = join(dir, primaryMeta.fileName);
    const dest = join(config.workDir, primaryMeta.fileName);

    // Copy-then-parse: never open the live file for long parsing, never write back.
    await copyFile(src, dest);
    const { readFile } = await import("node:fs/promises");
    const buf = await readFile(dest);

    const primary = analyzeWorldSave(buf, primaryMeta.fileName, {
      cellCm: config.baseCellCm,
      minPieces: config.baseMinPieces,
    });

    latest = {
      collectedAtIso,
      serverName: config.serverName,
      configuredWorld: config.primaryWorld,
      dataRootMounted: true,
      saveGamesPath: dir,
      worlds,
      primary,
      error: null,
      mode: "live",
    };

    await writeFile(
      join(config.workDir, "snapshot.json"),
      JSON.stringify(latest, null, 2),
      "utf8",
    );

    return latest;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    latest = {
      collectedAtIso,
      serverName: config.serverName,
      configuredWorld: config.primaryWorld,
      dataRootMounted: false,
      saveGamesPath: dir,
      worlds: [],
      primary: null,
      error: message,
      mode: "error",
    };
    return latest;
  }
}
