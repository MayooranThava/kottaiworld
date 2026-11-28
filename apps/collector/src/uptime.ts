import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "./config.js";

export type UptimeStatus = "up" | "down" | "degraded" | "pending";

export type UptimeTick = {
  atIso: string;
  status: UptimeStatus;
};

export type UptimeHistory = {
  /** Collector process boot time */
  processStartedAtIso: string;
  /** First successful live collect in this process, if any */
  firstLiveAtIso: string | null;
  /** Rolling ticks — roughly last few hours at collect cadence */
  ticks: UptimeTick[];
  /** How many ticks fit in the window */
  windowHours: number;
  intervalSec: number;
};

const WINDOW_HOURS = 6;

function maxTicks(): number {
  return Math.max(24, Math.ceil((WINDOW_HOURS * 3600) / config.intervalSec));
}

function storePath(): string {
  return join(config.workDir, "uptime.json");
}

let history: UptimeHistory = {
  processStartedAtIso: new Date().toISOString(),
  firstLiveAtIso: null,
  ticks: [],
  windowHours: WINDOW_HOURS,
  intervalSec: config.intervalSec,
};

export function getUptimeHistory(): UptimeHistory {
  return history;
}

export async function loadUptimeHistory(): Promise<void> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<UptimeHistory>;
    if (Array.isArray(parsed.ticks)) {
      history = {
        processStartedAtIso:
          parsed.processStartedAtIso ?? history.processStartedAtIso,
        firstLiveAtIso: parsed.firstLiveAtIso ?? null,
        ticks: parsed.ticks.slice(-maxTicks()),
        windowHours: WINDOW_HOURS,
        intervalSec: config.intervalSec,
      };
    }
  } catch {
    // Fresh start — keep in-memory defaults
  }
}

async function persist(): Promise<void> {
  try {
    await mkdir(config.workDir, { recursive: true });
    await writeFile(storePath(), JSON.stringify(history, null, 2), "utf8");
  } catch {
    // Non-fatal — history still lives in memory for this process
  }
}

export async function recordUptimeTick(
  mode: "live" | "empty" | "error",
): Promise<UptimeHistory> {
  const status: UptimeStatus =
    mode === "live" ? "up" : mode === "error" ? "down" : "degraded";
  const atIso = new Date().toISOString();

  if (status === "up" && !history.firstLiveAtIso) {
    history.firstLiveAtIso = atIso;
  }

  history.ticks.push({ atIso, status });
  const cap = maxTicks();
  if (history.ticks.length > cap) {
    history.ticks = history.ticks.slice(-cap);
  }
  history.windowHours = WINDOW_HOURS;
  history.intervalSec = config.intervalSec;

  await persist();
  return history;
}

/** Continuous up streak ending at the latest tick, in seconds. */
export function currentUpStreakSec(now = Date.now()): number | null {
  if (history.ticks.length === 0) return null;
  let i = history.ticks.length - 1;
  if (history.ticks[i]!.status !== "up") return 0;
  while (i > 0 && history.ticks[i - 1]!.status === "up") i -= 1;
  const start = Date.parse(history.ticks[i]!.atIso);
  if (!Number.isFinite(start)) return null;
  return Math.max(0, Math.floor((now - start) / 1000));
}
