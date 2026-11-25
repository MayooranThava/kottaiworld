import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  analyzeWorldSaveFromFile,
  type WorldSaveSummary,
} from "@kottaiworld/sav-parser";
import { config } from "./config.js";
import { discoverSaves, type Discovery } from "./discover.js";

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
  diagnostics: string[];
};

let latest: Snapshot = {
  collectedAtIso: new Date(0).toISOString(),
  serverName: config.serverName,
  configuredWorld: config.primaryWorld,
  dataRootMounted: false,
  saveGamesPath: "",
  worlds: [],
  primary: null,
  error: "Collector has not run yet",
  mode: "empty",
  diagnostics: [],
};

let lastParsedKey: string | null = null;
let lastPrimary: WorldSaveSummary | null = null;

export function getSnapshot(): Snapshot {
  return latest;
}

function worldsFromDiscovery(d: Discovery): WorldListItem[] {
  return d.savFiles.map((f) => ({
    fileName: f.fileName,
    sizeBytes: f.sizeBytes,
    mtimeIso: f.mtimeIso,
  }));
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Strip accidental binary from messages
    return err.message.replace(/[^\x20-\x7E]/g, "?").slice(0, 500);
  }
  return String(err).replace(/[^\x20-\x7E]/g, "?").slice(0, 500);
}

export async function collectOnce(): Promise<Snapshot> {
  const collectedAtIso = new Date().toISOString();
  let discovery: Discovery | null = null;
  let worlds: WorldListItem[] = [];

  try {
    await mkdir(config.workDir, { recursive: true });
    discovery = await discoverSaves();
    worlds = worldsFromDiscovery(discovery);

    if (!discovery.dataRootExists) {
      latest = {
        collectedAtIso,
        serverName: config.serverName,
        configuredWorld: config.primaryWorld,
        dataRootMounted: false,
        saveGamesPath: discovery.dataRoot,
        worlds: [],
        primary: null,
        error: discovery.notes.join(" · "),
        mode: "error",
        diagnostics: discovery.notes,
      };
      return latest;
    }

    if (worlds.length === 0) {
      latest = {
        collectedAtIso,
        serverName: config.serverName,
        configuredWorld: config.primaryWorld,
        dataRootMounted: true,
        saveGamesPath: discovery.saveGamesPath ?? discovery.dataRoot,
        worlds: [],
        primary: null,
        error: discovery.notes.join(" · "),
        mode: "empty",
        diagnostics: discovery.notes,
      };
      return latest;
    }

    const primaryName = `${config.primaryWorld}.sav`;
    const primaryMeta =
      discovery.savFiles.find((w) => w.fileName === primaryName) ??
      discovery.savFiles[0]!;

    const parseKey = `${primaryMeta.path}:${primaryMeta.mtimeIso}:${primaryMeta.sizeBytes}`;
    let primary: WorldSaveSummary;
    try {
      if (lastParsedKey === parseKey && lastPrimary) {
        primary = lastPrimary;
      } else {
        primary = await analyzeWorldSaveFromFile(primaryMeta.path, {
          cellCm: config.baseCellCm,
          minPieces: config.baseMinPieces,
        });
        lastParsedKey = parseKey;
        lastPrimary = primary;
      }
    } catch (parseErr) {
      const message = safeErrorMessage(parseErr);
      latest = {
        collectedAtIso,
        serverName: config.serverName,
        configuredWorld: config.primaryWorld,
        dataRootMounted: true,
        saveGamesPath: discovery.saveGamesPath ?? "",
        worlds,
        primary: null,
        error: `Save parse failed: ${message}`,
        mode: "error",
        diagnostics: [...discovery.notes, `parse: ${message}`],
      };
      return latest;
    }

    latest = {
      collectedAtIso,
      serverName: config.serverName,
      configuredWorld: config.primaryWorld,
      dataRootMounted: true,
      saveGamesPath: discovery.saveGamesPath ?? "",
      worlds,
      primary,
      error: null,
      mode: "live",
      diagnostics: discovery.notes,
    };

    await writeFile(
      join(config.workDir, "snapshot.json"),
      JSON.stringify(latest, null, 2),
      "utf8",
    );

    return latest;
  } catch (err) {
    const message = safeErrorMessage(err);
    latest = {
      collectedAtIso,
      serverName: config.serverName,
      configuredWorld: config.primaryWorld,
      dataRootMounted: discovery?.dataRootExists ?? latest.dataRootMounted,
      saveGamesPath: discovery?.saveGamesPath ?? latest.saveGamesPath,
      worlds: worlds.length ? worlds : latest.worlds,
      primary: null,
      error: message,
      mode: "error",
      diagnostics: [...(discovery?.notes ?? latest.diagnostics), message],
    };
    return latest;
  }
}
