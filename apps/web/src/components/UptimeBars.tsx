"use client";

import { formatDuration, formatShortTime, formatWhen } from "@/lib/format";
import type { Snapshot, UptimeStatus } from "@/lib/types";

type Props = {
  snap: Snapshot | null;
};

function labelFor(status: UptimeStatus): string {
  switch (status) {
    case "up":
      return "Up";
    case "down":
      return "Down";
    case "degraded":
      return "Degraded";
    default:
      return "Pending";
  }
}

export function UptimeBars({ snap }: Props) {
  const history = snap?.uptime;
  const ticks = history?.ticks ?? [];
  const windowHours = history?.windowHours ?? 6;
  const intervalSec = history?.intervalSec ?? 120;
  // Only real heartbeats — no padded empty slots (those read as false downtime)
  const slots = ticks.slice(-Math.min(180, Math.max(24, ticks.length || 24)));
  const upCount = ticks.filter((t) => t.status === "up").length;
  const ratio = ticks.length ? Math.round((upCount / ticks.length) * 1000) / 10 : null;
  const streak = snap?.upStreakSec ?? null;
  const mode = snap?.mode ?? "empty";

  return (
    <div className="uptime">
      <div className="uptime-head">
        <div>
          <p className="kicker">Observer uptime</p>
          <h2>Last {windowHours} hours</h2>
        </div>
        <div className="meta">
          <div>
            <span className="label">Availability</span>
            <strong>{ratio == null ? "—" : `${ratio}%`}</strong>
          </div>
          <div>
            <span className="label">Current streak</span>
            <strong>{formatDuration(streak)}</strong>
          </div>
          <div>
            <span className="label">Status</span>
            <strong className={`pill ${mode}`}>
              {mode === "live" ? "Live" : mode === "error" ? "Down" : "Warming"}
            </strong>
          </div>
        </div>
      </div>

      <div
        className="bars"
        role="img"
        aria-label={`Uptime history for the last ${windowHours} hours`}
      >
        {slots.length === 0 ? (
          <span className="empty-bars">Waiting for the first collector heartbeat…</span>
        ) : (
          slots.map((tick, i) => (
            <span
              key={`${tick.atIso}-${i}`}
              className={`bar ${tick.status}`}
              title={`${labelFor(tick.status)} · ${formatWhen(tick.atIso)}`}
              data-status={tick.status}
            />
          ))
        )}
      </div>

      <div className="axis">
        <span>
          {slots[0] ? formatShortTime(slots[0].atIso) : `${windowHours}h ago`}
        </span>
        <span className="hint">
          One bar per collect (~{Math.round(intervalSec / 60)} min) · collector heartbeats
        </span>
        <span>Now</span>
      </div>

      <style jsx>{`
        .uptime {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .uptime-head {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          align-items: end;
        }
        .kicker {
          margin: 0 0 0.25rem;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fog);
        }
        h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(5.5rem, auto));
          gap: 1.25rem;
        }
        .label {
          display: block;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fog);
          margin-bottom: 0.2rem;
        }
        .meta strong {
          font-variant-numeric: tabular-nums;
          font-size: 1.05rem;
          font-weight: 600;
        }
        .pill {
          display: inline-block;
        }
        .pill.live {
          color: var(--signal-up);
        }
        .pill.error {
          color: var(--ember);
        }
        .bars {
          display: flex;
          gap: 2px;
          height: 34px;
          align-items: stretch;
          padding: 0.35rem 0;
        }
        .empty-bars {
          align-self: center;
          font-size: 0.85rem;
          color: var(--fog);
        }
        .bar {
          flex: 1 1 0;
          min-width: 2px;
          border-radius: 1px;
          background: rgba(232, 224, 210, 0.12);
          transition: filter 0.15s ease, transform 0.15s ease;
        }
        .bar:hover {
          filter: brightness(1.25);
          transform: scaleY(1.08);
        }
        .bar.up {
          background: var(--signal-up);
        }
        .bar.down {
          background: var(--ember);
        }
        .bar.degraded {
          background: #c9a24a;
        }
        .bar.pending {
          background: rgba(232, 224, 210, 0.1);
        }
        .axis {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: var(--fog);
          font-variant-numeric: tabular-nums;
        }
        .hint {
          text-align: center;
          opacity: 0.85;
        }
        @media (max-width: 720px) {
          .meta {
            grid-template-columns: repeat(3, 1fr);
            width: 100%;
          }
          .hint {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
