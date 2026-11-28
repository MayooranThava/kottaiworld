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
          Named Ashenfall resources from Dragonwilds. Totals come from{" "}
          <code>Pces</code> in the world save — inventory stock is not available
          yet.
        </p>
      </div>

      <div className="ledger">
        {ledger.map((row, i) => (
          <article
            key={row.key}
            className="stat"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="emblem">
              <img
                src={row.emblem.src}
                alt={row.emblem.name}
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
              />
              <span className="material-name">{row.emblem.name}</span>
            </div>
            <div className="body">
              <span className="label">{row.label}</span>
              <strong>{row.value}</strong>
              <span className="note">{row.note}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="resources-head">
        <h3>Core resources</h3>
        <p>Each material, named — open Dragonwilds DB for details.</p>
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
            style={{ animationDelay: `${80 + i * 40}ms` }}
          >
            <img
              src={m.src}
              alt={m.name}
              width={52}
              height={52}
              loading="lazy"
            />
            <span className="res-name">{m.name}</span>
            <span className="res-blurb">{m.blurb}</span>
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
          max-width: 42rem;
          line-height: 1.5;
        }
        .section-head code {
          font-size: 0.85em;
          color: var(--parchment);
        }
        .ledger {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .stat {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 0.85rem;
          align-items: center;
          padding: 0.95rem 0.95rem;
          background: linear-gradient(
            165deg,
            rgba(18, 22, 20, 0.72),
            rgba(8, 10, 12, 0.5)
          );
          border: 1px solid rgba(232, 224, 210, 0.12);
          border-top: 1px solid rgba(224, 138, 79, 0.22);
          animation: rise 0.6s ease both;
        }
        .emblem {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }
        .emblem img {
          width: 56px;
          height: 56px;
          object-fit: contain;
        }
        .material-name {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-align: center;
          color: var(--parchment);
          line-height: 1.2;
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
          font-size: 1.5rem;
          font-weight: 650;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 0.15rem 0;
        }
        .note {
          display: block;
          font-size: 0.78rem;
          color: var(--fog);
          line-height: 1.35;
        }
        .resources-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.65rem 1rem;
          margin-top: 0.25rem;
        }
        .resources-head h3 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
        }
        .resources-head p {
          margin: 0;
          color: var(--fog);
          font-size: 0.85rem;
        }
        .icons {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.65rem;
        }
        .chip {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.35rem;
          padding: 0.9rem 0.85rem 0.95rem;
          text-decoration: none;
          color: var(--parchment);
          background: rgba(8, 10, 12, 0.38);
          border: 1px solid rgba(232, 224, 210, 0.1);
          transition: border-color 0.15s ease, transform 0.15s ease,
            background 0.15s ease;
          animation: rise 0.55s ease both;
        }
        .chip:hover {
          border-color: rgba(224, 138, 79, 0.5);
          background: rgba(196, 92, 42, 0.08);
          transform: translateY(-2px);
        }
        .chip img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          margin-bottom: 0.15rem;
        }
        .res-name {
          font-size: 0.92rem;
          font-weight: 650;
          letter-spacing: 0.01em;
          color: var(--parchment);
          line-height: 1.2;
        }
        .res-blurb {
          font-size: 0.72rem;
          color: var(--fog);
          line-height: 1.35;
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
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .ledger,
          .icons {
            grid-template-columns: 1fr;
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
