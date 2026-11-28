"use client";

import type { PublicPlayerPin } from "@/lib/types";

type Props = {
  players: PublicPlayerPin[];
  published?: boolean;
};

export function PlayersRoster({ players, published }: Props) {
  return (
    <div className="roster">
      <div className="head">
        <p className="kicker">Companions</p>
        <h3>Players</h3>
        <p>
          {players.length > 0
            ? "Nickname pins from the published snapshot (safe copy — no account IDs)."
            : published
              ? "No nicknames in this publish yet. When you add players to the sanitized snapshot, they show here."
              : "Live positions arrive in Phase B via RSDWServerAPI. Nickname pins can be added to the published snapshot sooner."}
        </p>
      </div>

      {players.length > 0 ? (
        <ul>
          {players.map((p) => (
            <li key={`${p.nickname}-${p.x}-${p.y}`}>
              <span className="dot" aria-hidden />
              <span className="name">{p.nickname}</span>
              <span className="coords">
                {Math.round(p.x).toLocaleString()}, {Math.round(p.y).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty" role="status">
          <span className="empty-mark">∅</span>
          <div>
            <strong>Roster quiet</strong>
            <span>Waiting for player nicknames on the next snapshot publish.</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .roster {
          margin-top: 1.25rem;
          padding-top: 1.15rem;
          border-top: 1px solid rgba(232, 224, 210, 0.1);
        }
        .kicker {
          margin: 0 0 0.2rem;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fog);
        }
        h3 {
          margin: 0 0 0.35rem;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .head p {
          margin: 0 0 0.9rem;
          color: var(--fog);
          max-width: 36rem;
          font-size: 0.92rem;
          line-height: 1.45;
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.55rem;
        }
        li {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.65rem;
          align-items: center;
          padding: 0.7rem 0.85rem;
          background: rgba(8, 10, 12, 0.4);
          border: 1px solid rgba(232, 224, 210, 0.1);
          animation: rise 0.55s ease both;
        }
        .dot {
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 50%;
          background: var(--moss);
          box-shadow: 0 0 0 3px rgba(61, 90, 69, 0.35);
        }
        .name {
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .coords {
          font-variant-numeric: tabular-nums;
          font-size: 0.78rem;
          color: var(--fog);
        }
        .empty {
          display: flex;
          gap: 0.85rem;
          align-items: center;
          padding: 1rem 1.05rem;
          border: 1px dashed rgba(232, 224, 210, 0.18);
          background: rgba(8, 10, 12, 0.28);
        }
        .empty-mark {
          font-size: 1.35rem;
          color: var(--fog);
          opacity: 0.7;
        }
        .empty strong {
          display: block;
          font-size: 0.95rem;
          margin-bottom: 0.15rem;
        }
        .empty span {
          display: block;
          font-size: 0.82rem;
          color: var(--fog);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
