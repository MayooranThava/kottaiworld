import type { Snapshot } from "./types";

/** Static Pages build reads published JSON; Docker BFF still uses /api/snapshot. */
export function snapshotUrl(): string {
  if (process.env.NEXT_PUBLIC_USE_STATIC_SNAPSHOT === "1") {
    return "/data/snapshot.json";
  }
  return "/api/snapshot";
}

export async function fetchSnapshot(): Promise<Snapshot> {
  const res = await fetch(snapshotUrl(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Snapshot HTTP ${res.status}`);
  }
  return (await res.json()) as Snapshot;
}
