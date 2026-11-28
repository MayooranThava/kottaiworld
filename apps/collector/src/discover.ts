import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config.js";

const CANDIDATE_SUBPATHS = [
  "RSDragonwilds/Saved/SaveGames",
  "RSDragonwilds/Saved/Savegames",
  "Saved/SaveGames",
  "Saved/Savegames",
];

export type Discovery = {
  dataRoot: string;
  dataRootExists: boolean;
  dataRootEntries: string[];
  saveGamesPath: string | null;
  savFiles: Array<{ path: string; fileName: string; sizeBytes: number; mtimeIso: string }>;
  notes: string[];
};

async function existsDir(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function listSavInDir(dir: string) {
  const entries = await readdir(dir);
  const out: Discovery["savFiles"] = [];
  for (const name of entries) {
    if (!name.toLowerCase().endsWith(".sav")) continue;
    if (name.includes(".backup") || name.includes(".verbackup")) continue;
    const full = join(dir, name);
    const s = await stat(full);
    if (!s.isFile()) continue;
    out.push({
      path: full,
      fileName: name,
      sizeBytes: s.size,
      mtimeIso: s.mtime.toISOString(),
    });
  }
  return out.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

/** Walk a few levels under root looking for *.sav (cap breadth). */
async function findSavRecursive(
  root: string,
  depth: number,
  acc: Discovery["savFiles"],
): Promise<void> {
  if (depth < 0 || acc.length >= 50) return;
  let entries: string[];
  try {
    entries = await readdir(root);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "work" || name === "node_modules" || name.startsWith(".")) continue;
    const full = join(root, name);
    try {
      const s = await stat(full);
      if (s.isFile() && name.toLowerCase().endsWith(".sav") && !name.includes(".backup")) {
        acc.push({
          path: full,
          fileName: name,
          sizeBytes: s.size,
          mtimeIso: s.mtime.toISOString(),
        });
      } else if (s.isDirectory()) {
        await findSavRecursive(full, depth - 1, acc);
      }
    } catch {
      // ignore permission errors on RO volume oddities
    }
  }
}

export async function discoverSaves(): Promise<Discovery> {
  const dataRoot = config.dataRoot;
  const notes: string[] = [];
  const dataRootExists = await existsDir(dataRoot);
  let dataRootEntries: string[] = [];

  if (!dataRootExists) {
    notes.push(
      `Data root missing: ${dataRoot}. Check docker-compose volume mount (dragonwilds_dragonwilds-data → /data/rsdw:ro).`,
    );
    return {
      dataRoot,
      dataRootExists: false,
      dataRootEntries: [],
      saveGamesPath: null,
      savFiles: [],
      notes,
    };
  }

  try {
    dataRootEntries = await readdir(dataRoot);
  } catch (err) {
    notes.push(`Cannot list ${dataRoot}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const configured = join(dataRoot, config.saveGamesSubpath);
  const candidates = [
    configured,
    ...CANDIDATE_SUBPATHS.map((p) => join(dataRoot, p)),
  ];

  for (const dir of candidates) {
    if (!(await existsDir(dir))) continue;
    const savFiles = await listSavInDir(dir);
    if (savFiles.length > 0) {
      notes.push(`Using save directory: ${dir}`);
      return {
        dataRoot,
        dataRootExists: true,
        dataRootEntries,
        saveGamesPath: dir,
        savFiles,
        notes,
      };
    }
    notes.push(`Directory exists but has no .sav: ${dir}`);
  }

  // Last resort: shallow recursive search
  const found: Discovery["savFiles"] = [];
  await findSavRecursive(dataRoot, 6, found);
  if (found.length > 0) {
    const saveGamesPath = found[0]!.path.slice(0, found[0]!.path.length - found[0]!.fileName.length - 1);
    notes.push(`Found .sav via recursive search under ${dataRoot}`);
    return {
      dataRoot,
      dataRootExists: true,
      dataRootEntries,
      saveGamesPath,
      savFiles: found.sort((a, b) => a.fileName.localeCompare(b.fileName)),
      notes,
    };
  }

  notes.push(
    `No .sav files under ${dataRoot}. Top-level entries: [${dataRootEntries.join(", ") || "(empty)"}]`,
  );
  return {
    dataRoot,
    dataRootExists: true,
    dataRootEntries,
    saveGamesPath: null,
    savFiles: [],
    notes,
  };
}
