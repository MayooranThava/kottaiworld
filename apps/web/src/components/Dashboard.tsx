"use client";

import { useEffect, useState } from "react";
import { formatBytes, formatDuration, formatWhen } from "@/lib/format";
import { fetchSnapshot } from "@/lib/loadSnapshot";
import type { Snapshot } from "@/lib/types";
import { HoldingsMap } from "./HoldingsMap";
import { MaterialsShelf } from "./MaterialsShelf";
import { UptimeBars } from "./UptimeBars";

const serverName = process.env.NEXT_PUBLIC_SERVER_NAME ?? "KottaiServer";
const worldName = process.env.NEXT_PUBLIC_WORLD_NAME ?? "KottaiWorld";
const isStatic = process.env.NEXT_PUBLIC_USE_STATIC_SNAPSHOT === "1";

export function Dashboard() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchSnapshot();
        if (!cancelled) {
          setSnap(data);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    void load();
    // Published copies change only when you push; poll less often
    const id = setInterval(load, isStatic ? 120_000 : 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const mode = snap?.mode ?? (loadError ? "error" : "empty");
  const bases = snap?.primary?.bases ?? [];
  const pieces = snap?.primary?.pieceCount ?? 0;
  const blueprints = snap?.primary?.blueprintCount ?? 0;
  const published = snap?.source === "published" || isStatic;
  const statusLabel = published
    ? mode === "live"
      ? "Published copy"
      : mode === "error"
        ? "Degraded"
        : "Waiting"
    : mode === "live"
      ? "Telemetry live"
      : mode === "error"
        ? "Degraded"
        : "Waiting";

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Ashenfall · dedicated observer</p>
          <h1 className="brand">{serverName}</h1>
        </div>
        <div className="status-chip">
          <span className={`pulse ${mode}`} aria-hidden />
          <div>
            <strong>{statusLabel}</strong>
            <span>
              {worldName}
              {snap?.upStreakSec != null && mode === "live"
                ? ` · up ${formatDuration(snap.upStreakSec)}`
                : ""}
            </span>
          </div>
        </div>
      </header>

      <p className="lede">
        Read-only holdings for <strong>{worldName}</strong>. The game volume is
        never written by this dashboard.
      </p>

      <nav className="toc" aria-label="Sections">
        <a href="#ops">Ops</a>
        <a href="#holdings">Holdings</a>
        <a href="#materials">Materials</a>
        <a href="#worlds">World saves</a>
      </nav>

      <section id="ops" className="panel ops">
        <UptimeBars snap={snap} />
        <div className="vitals" aria-label="World vitals">
          <div>
            <span className="vital-label">Building pieces</span>
            <strong>{pieces.toLocaleString()}</strong>
          </div>
          <div>
            <span className="vital-label">Bases</span>
            <strong>{bases.length}</strong>
          </div>
          <div>
            <span className="vital-label">Blueprints</span>
            <strong>{blueprints.toLocaleString()}</strong>
          </div>
          <div>
            <span className="vital-label">Last collect</span>
            <strong className="small">{formatWhen(snap?.collectedAtIso)}</strong>
          </div>
          <div>
            <span className="vital-label">Save size</span>
            <strong>
              {snap?.primary ? formatBytes(snap.primary.fileSizeBytes) : "—"}
            </strong>
          </div>
        </div>
      </section>

      {(snap?.error || loadError) && !published && (
        <section className="alert" role="alert">
          <h2>Collector issue</h2>
          <p>{snap?.error ?? loadError}</p>
          {snap?.diagnostics?.length ? (
            <ul>
              {snap.diagnostics.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <p className="hint">
            Path expected: <code>{snap?.saveGamesPath || "/data/rsdw/.../SaveGames"}</code>
          </p>
        </section>
      )}
      {published && loadError && (
        <section className="alert" role="alert">
          <h2>Snapshot unavailable</h2>
          <p>{loadError}</p>
        </section>
      )}

      <section id="holdings" className="panel holdings">
        <div className="section-head">
          <p className="kicker">World map</p>
          <h2>Holdings</h2>
          <p>
            In-game Ashenfall map (<code>T_WorldMap_Landmass</code>) with bases from{" "}
            {worldName}.sav — pins use the game&apos;s world-map calibration.
          </p>
        </div>
        <HoldingsMap bases={bases} />
        {bases.length > 0 && (
          <ul className="base-list">
            {bases.map((b) => (
              <li key={b.id}>
                <span className="name">{b.id}</span>
                <span>{b.pieceCount.toLocaleString()} pieces</span>
                <span className="coords">
                  {Math.round(b.centroid.x)}, {Math.round(b.centroid.y)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="materials" className="panel">
        <MaterialsShelf snap={snap} />
      </section>

      <section id="worlds" className="panel worlds">
        <div className="section-head">
          <p className="kicker">Filesystem</p>
          <h2>World saves</h2>
          <p>Discovered under the read-only mount (stream parse, no write-back).</p>
        </div>
        <ul>
          {(snap?.worlds ?? []).map((w) => (
            <li key={w.fileName}>
              <span>{w.fileName}</span>
              <span>{formatBytes(w.sizeBytes)}</span>
              <span>{formatWhen(w.mtimeIso)}</span>
            </li>
          ))}
          {(snap?.worlds?.length ?? 0) === 0 && (
            <li className="muted">No saves visible yet — check the volume mount.</li>
          )}
        </ul>
        {snap?.primary?.parseWarnings?.length ? (
          <p className="warn">{snap.primary.parseWarnings.join(" · ")}</p>
        ) : null}
      </section>

      <footer>
        <span>Phase A · local observer</span>
        <span>Live players arrive in Phase B (RSDWServerAPI)</span>
      </footer>

      <style jsx>{`
        .page {
          max-width: var(--page-max);
          margin: 0 auto;
          padding: 1.75rem 1.25rem 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
          animation: rise 0.7s ease both;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 1.25rem;
          flex-wrap: wrap;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid var(--line);
        }
        .eyebrow,
        .kicker {
          margin: 0 0 0.35rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 0.68rem;
          color: var(--fog);
          font-weight: 500;
        }
        .brand {
          font-family: var(--font-display);
          font-weight: 650;
          font-size: clamp(2.4rem, 5.5vw, 3.6rem);
          line-height: 1.02;
          margin: 0;
          letter-spacing: -0.03em;
          color: var(--parchment);
        }
        .status-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.9rem;
          background: var(--panel);
          border: 1px solid var(--line);
          min-width: 12rem;
        }
        .status-chip strong {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .status-chip span:last-child {
          display: block;
          font-size: 0.78rem;
          color: var(--fog);
        }
        .pulse {
          width: 0.65rem;
          height: 0.65rem;
          border-radius: 50%;
          background: var(--fog);
          flex-shrink: 0;
          animation: breath 2.4s ease-in-out infinite;
        }
        .pulse.live {
          background: var(--signal-up);
        }
        .pulse.error {
          background: var(--ember);
        }
        .lede {
          margin: 0;
          max-width: 40rem;
          color: var(--fog);
          font-size: 1rem;
          line-height: 1.55;
        }
        .lede strong {
          color: var(--parchment);
          font-weight: 600;
        }
        .toc {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 1.1rem;
          padding: 0.15rem 0 0.35rem;
          border-bottom: 1px solid var(--line);
        }
        .toc a {
          text-decoration: none;
          color: var(--fog);
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .toc a:hover {
          color: var(--ember-soft);
        }
        .panel {
          padding: 1.35rem 0;
          border-bottom: 1px solid var(--line);
        }
        .ops {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }
        .vitals {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.85rem;
        }
        .vitals > div {
          padding: 0.85rem 0.9rem;
          background: var(--panel);
          border: 1px solid var(--line);
        }
        .vitals strong {
          font-size: 1.35rem;
          font-weight: 650;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .vitals strong.small {
          font-size: 0.92rem;
          font-weight: 600;
          letter-spacing: 0;
          line-height: 1.35;
        }
        .section-head h2 {
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0 0 0.35rem;
        }
        .section-head p {
          margin: 0 0 1rem;
          color: var(--fog);
          max-width: 38rem;
        }
        .section-head code {
          color: var(--parchment);
          font-size: 0.85em;
        }
        .base-list,
        .worlds ul {
          list-style: none;
          margin: 1rem 0 0;
          padding: 0;
        }
        .base-list li,
        .worlds li {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(232, 224, 210, 0.08);
          font-variant-numeric: tabular-nums;
        }
        .base-list .name,
        .worlds li span:first-child {
          font-weight: 600;
        }
        .coords,
        .muted {
          color: var(--fog);
        }
        .alert {
          margin: 0;
          padding: 1.15rem 1.25rem;
          border: 1px solid rgba(196, 92, 42, 0.45);
          background: rgba(196, 92, 42, 0.1);
        }
        .alert h2 {
          font-family: var(--font-display);
          margin: 0 0 0.5rem;
          font-size: 1.15rem;
        }
        .alert p {
          margin: 0.35rem 0;
          color: #ffb4a2;
        }
        .alert ul {
          margin: 0.75rem 0 0;
          padding-left: 1.1rem;
          color: var(--fog);
        }
        .alert .hint {
          color: var(--fog);
          font-size: 0.9rem;
        }
        .alert code {
          color: var(--parchment);
        }
        .warn {
          color: #e0c07a;
          font-size: 0.9rem;
        }
        footer {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 0.5rem;
          color: var(--fog);
          font-size: 0.82rem;
        }
        @media (max-width: 900px) {
          .vitals {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .base-list li,
          .worlds li {
            grid-template-columns: 1fr;
            gap: 0.15rem;
          }
          .vitals {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
