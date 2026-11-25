"use client";

import { CORE_MATERIALS, LEDGER_EMBLEMS } from "@/lib/materials";
import type { Snapshot } from "@/lib/types";

type Props = {
  snap: Snapshot | null;
};

export function MaterialsShelf({ snap }: Props) {
  const pieces = snap?.primary?.pieceCount ?? 0;
  const bases = snap?.primary?.bases.length ?? 0;
  const blueprints = snap?.primary?.blueprintCount ?? 0;
  const density =
    bases > 0 ? Math.round(pieces / bases) : pieces > 0 ? pieces : 0;

  const ledger = [
    {
      key: "pieces",
      label: "Pieces placed",
      value: pieces.toLocaleString(),
      emblem: LEDGER_EMBLEMS.pieces,
      note: "Building parts in the world save",
    },
    {
      key: "blueprints",
      label: "Blueprints",
      value: blueprints.toLocaleString(),
      emblem: LEDGER_EMBLEMS.blueprints,
      note: "Distinct piece class signatures",
    },
    {
      key: "bases",
      label: "Bases",
      value: bases.toLocaleString(),
      emblem: LEDGER_EMBLEMS.bases,
      note: "Clustered holdings on Ashenfall",
    },
    {
      key: "density",
      label: "Pieces / base",
      value: density.toLocaleString(),
      emblem: LEDGER_EMBLEMS.density,
      note: "Average construction density",
    },
  ] as const;

  const top = snap?.primary?.blueprints ?? [];

  return (
    <div className="shelf">
      <div className="section-head">
        <p className="kicker">Construction ledger</p>
        <h2>Materials & blueprints</h2>
        <p>
          In-game resource icons from Dragonwilds. Piece and blueprint totals are
          read from <code>Pces</code> — inventory stock is not in the world save
          yet.
        </p>
      </div>

      <div className="ledger">
        {ledger.map((row) => (
          <article key={row.key} className="stat">
            <img
              src={row.emblem.src}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
            />
            <div>
              <span className="label">{row.label}</span>
              <strong>{row.value}</strong>
              <span className="note">{row.note}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="icons">
        {CORE_MATERIALS.map((m, i) => (
          <a
            key={m.id}
            className="chip"
            href={m.href}
            target="_blank"
            rel="noreferrer"
            title={m.blurb}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <img src={m.src} alt="" width={48} height={48} loading="lazy" />
            <span>{m.name}</span>
          </a>
        ))}
      </div>

      {top.length > 0 && (
        <div className="top">
          <h3>Top blueprints in {snap?.configuredWorld ?? "world"}</h3>
          <ul>
            {top.slice(0, 6).map((b) => (
              <li key={b.classGuid}>
                <code title={b.classGuid}>{b.classGuid.slice(0, 10)}…</code>
                <span className="bar-track" aria-hidden>
                  <span
                    className="bar-fill"
                    style={{ width: `${Math.max(4, b.share * 100)}%` }}
                  />
                </span>
                <span className="count">{b.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="attr">
        Icons © Jagex · via{" "}
        <a
          href="https://www.dragonwildsdatabase.com/items/c/materials/"
          target="_blank"
          rel="noreferrer"
        >
          Dragonwilds DB
        </a>
      </p>

      <style jsx>{`
        .shelf {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }
        .section-head .kicker {
          margin: 0 0 0.25rem;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fog);
        }
        .section-head h2 {
          margin: 0 0 0.4rem;
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .section-head p {
          margin: 0;
          color: var(--fog);
          max-width: 40rem;
          line-height: 1.5;
        }
        .section-head code {
          font-size: 0.85em;
          color: var(--parchment);
        }
        .ledger {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.85rem;
        }
        .stat {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 0.75rem;
          align-items: center;
          padding: 0.85rem 0.9rem;
          background: rgba(8, 10, 12, 0.35);
          border: 1px solid rgba(232, 224, 210, 0.1);
          animation: rise 0.6s ease both;
        }
        .stat img {
          width: 56px;
          height: 56px;
          object-fit: contain;
          image-rendering: auto;
        }
        .label {
          display: block;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fog);
        }
        .stat strong {
          display: block;
          font-size: 1.45rem;
          font-weight: 650;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 0.1rem 0;
        }
        .note {
          display: block;
          font-size: 0.78rem;
          color: var(--fog);
          line-height: 1.35;
        }
        .icons {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 0.7rem 0.35rem 0.65rem;
          text-decoration: none;
          color: var(--parchment);
          background: rgba(8, 10, 12, 0.28);
          border: 1px solid rgba(232, 224, 210, 0.08);
          transition: border-color 0.15s ease, transform 0.15s ease;
          animation: rise 0.55s ease both;
        }
        .chip:hover {
          border-color: rgba(224, 138, 79, 0.45);
          transform: translateY(-2px);
        }
        .chip img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }
        .chip span {
          font-size: 0.68rem;
          text-align: center;
          letter-spacing: 0.02em;
          line-height: 1.25;
          color: var(--fog);
        }
        .top h3 {
          margin: 0 0 0.65rem;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fog);
          font-weight: 600;
        }
        .top ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .top li {
          display: grid;
          grid-template-columns: 7.5rem 1fr 3.5rem;
          gap: 0.75rem;
          align-items: center;
          font-variant-numeric: tabular-nums;
        }
        .top code {
          font-size: 0.78rem;
          color: var(--parchment);
        }
        .bar-track {
          height: 6px;
          background: rgba(232, 224, 210, 0.1);
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, var(--ember), var(--ember-soft));
          border-radius: inherit;
        }
        .count {
          text-align: right;
          font-size: 0.85rem;
        }
        .attr {
          margin: 0;
          font-size: 0.72rem;
          color: var(--fog);
          letter-spacing: 0.04em;
        }
        .attr a {
          color: var(--ember-soft);
        }
        @media (max-width: 960px) {
          .ledger {
            grid-template-columns: 1fr 1fr;
          }
          .icons {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .ledger {
            grid-template-columns: 1fr;
          }
          .icons {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .top li {
            grid-template-columns: 1fr auto;
          }
          .bar-track {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
