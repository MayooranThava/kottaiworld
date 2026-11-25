"use client";

import { useEffect, useState } from "react";
import { formatBytes, formatWhen } from "@/lib/format";
import type { Snapshot } from "@/lib/types";
import { HoldingsMap } from "./HoldingsMap";

const serverName = process.env.NEXT_PUBLIC_SERVER_NAME ?? "KottaiServer";
const worldName = process.env.NEXT_PUBLIC_WORLD_NAME ?? "KottaiWorld";

export function Dashboard() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        const data = (await res.json()) as Snapshot;
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
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const mode = snap?.mode ?? (loadError ? "error" : "empty");
  const bases = snap?.primary?.bases ?? [];
  const pieces = snap?.primary?.pieceCount ?? 0;
  const statusLabel =
    mode === "live" ? "World telemetry live" : mode === "error" ? "Degraded" : "Waiting";

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Ashenfall · dedicated</p>
        <h1 className="brand">{serverName}</h1>
        <p className="lede">
          Watching <strong>{worldName}</strong> — holdings from a read-only save copy.
          The game volume is never written by this dashboard.
        </p>
        <div className="cta">
          <span className={`pulse ${mode}`} aria-hidden />
          <span>{statusLabel}</span>
          <a href="#holdings">View holdings</a>
        </div>
      </header>

      <section className="strip" aria-label="World vitals">
        <div>
          <span className="label">Building pieces</span>
          <strong>{pieces.toLocaleString()}</strong>
        </div>
        <div>
          <span className="label">Bases detected</span>
          <strong>{bases.length}</strong>
        </div>
        <div>
          <span className="label">Last collect</span>
          <strong>{formatWhen(snap?.collectedAtIso)}</strong>
        </div>
        <div>
          <span className="label">Save size</span>
          <strong>
            {snap?.primary ? formatBytes(snap.primary.fileSizeBytes) : "—"}
          </strong>
        </div>
      </section>

      <section id="holdings" className="holdings">
        <div className="section-head">
          <h2>Holdings</h2>
          <p>Clusters of placed pieces from {worldName}.sav — map pins scale with piece count.</p>
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

      <section className="worlds">
        <div className="section-head">
          <h2>World saves</h2>
          <p>Discovered under the read-only mount (copy-on-read).</p>
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
        {(snap?.error || loadError) && (
          <p className="err">{snap?.error ?? loadError}</p>
        )}
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
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 1.25rem 3rem;
        }
        .hero {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 4.5rem 0 3rem;
          animation: rise 0.9s ease both;
        }
        .eyebrow {
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 0.72rem;
          color: var(--fog);
          margin: 0 0 0.75rem;
        }
        .brand {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(3.2rem, 10vw, 6.4rem);
          line-height: 0.95;
          margin: 0;
          letter-spacing: -0.03em;
          background: linear-gradient(120deg, var(--parchment), var(--ember-soft));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .lede {
          max-width: 34rem;
          margin: 1.25rem 0 0;
          font-size: 1.05rem;
          line-height: 1.55;
          color: var(--fog);
        }
        .lede strong {
          color: var(--parchment);
          font-weight: 600;
        }
        .cta {
          margin-top: 2rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }
        .pulse {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 50%;
          background: var(--fog);
          animation: breath 2.4s ease-in-out infinite;
        }
        .pulse.live {
          background: #7dba6a;
        }
        .pulse.error {
          background: var(--ember);
        }
        .cta a {
          margin-left: 0.5rem;
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 138, 79, 0.5);
          padding-bottom: 0.1rem;
        }
        .strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1.25rem;
          padding: 1.5rem 0 2.5rem;
          border-top: 1px solid rgba(232, 224, 210, 0.12);
          animation: rise 1s ease both;
          animation-delay: 0.15s;
        }
        .strip .label {
          display: block;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--fog);
          margin-bottom: 0.35rem;
        }
        .strip strong {
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 600;
        }
        .section-head h2 {
          font-family: var(--font-display);
          font-size: 1.85rem;
          margin: 0 0 0.35rem;
        }
        .section-head p {
          margin: 0 0 1rem;
          color: var(--fog);
          max-width: 36rem;
        }
        .holdings,
        .worlds {
          padding: 2rem 0;
          animation: rise 1s ease both;
        }
        .base-list,
        .worlds ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .base-list li,
        .worlds li {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          padding: 0.75rem 0;
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
        .err {
          color: #ffb4a2;
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
          padding-top: 2rem;
          border-top: 1px solid rgba(232, 224, 210, 0.1);
          color: var(--fog);
          font-size: 0.85rem;
        }
        @media (max-width: 800px) {
          .strip {
            grid-template-columns: 1fr 1fr;
          }
          .base-list li,
          .worlds li {
            grid-template-columns: 1fr;
            gap: 0.2rem;
          }
        }
      `}</style>
    </div>
  );
}
