import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.COLLECTOR_URL ?? "http://127.0.0.1:4100";
  try {
    const res = await fetch(`${base}/api/snapshot`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          mode: "error",
          error: `Collector returned ${res.status}`,
          collectedAtIso: new Date().toISOString(),
          serverName: process.env.NEXT_PUBLIC_SERVER_NAME ?? "KottaiServer",
          configuredWorld: process.env.NEXT_PUBLIC_WORLD_NAME ?? "KottaiWorld",
          dataRootMounted: false,
          saveGamesPath: "",
          worlds: [],
          primary: null,
          diagnostics: [],
          uptime: {
            processStartedAtIso: new Date().toISOString(),
            firstLiveAtIso: null,
            ticks: [],
            windowHours: 6,
            intervalSec: 120,
          },
          upStreakSec: 0,
        },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
        {
          mode: "error",
          error: `Cannot reach collector at ${base}: ${message}`,
          collectedAtIso: new Date().toISOString(),
          serverName: process.env.NEXT_PUBLIC_SERVER_NAME ?? "KottaiServer",
          configuredWorld: process.env.NEXT_PUBLIC_WORLD_NAME ?? "KottaiWorld",
          dataRootMounted: false,
          saveGamesPath: "",
          worlds: [],
          primary: null,
          diagnostics: [],
          uptime: {
            processStartedAtIso: new Date().toISOString(),
            firstLiveAtIso: null,
            ticks: [],
            windowHours: 6,
            intervalSec: 120,
          },
          upStreakSec: 0,
        },
      { status: 503 },
    );
  }
}
