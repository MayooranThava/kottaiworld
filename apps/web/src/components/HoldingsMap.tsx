"use client";

import { projectToMap } from "@/lib/worldBounds";
import type { BaseCluster } from "@/lib/types";

type Props = {
  bases: BaseCluster[];
};

const REGIONS = [
  { name: "Brynmoor", left: "22%", top: "68%" },
  { name: "Ghornfell", left: "48%", top: "42%" },
  { name: "Fellhollow", left: "58%", top: "18%" },
  { name: "Umbral Sands", left: "78%", top: "72%" },
] as const;

export function HoldingsMap({ bases }: Props) {
  if (bases.length === 0) {
    return (
      <div className="map empty">
        <div className="terrain" aria-hidden />
        <p>No bases detected yet — lower BASE_MIN_PIECES or wait for the next collect.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const maxPieces = Math.max(...bases.map((b) => b.pieceCount));

  return (
    <div className="map" role="img" aria-label="Ashenfall holdings map with base markers">
      <div className="terrain" aria-hidden />
      <div className="veil" aria-hidden />

      {REGIONS.map((r) => (
        <span key={r.name} className="region" style={{ left: r.left, top: r.top }}>
          {r.name}
        </span>
      ))}

      {bases.map((b, i) => {
        const pos = projectToMap(b.centroid.x, b.centroid.y);
        const size = 18 + (b.pieceCount / maxPieces) * 34;
        return (
          <div
            key={b.id}
            className="pin"
            style={{
              left: `${pos.leftPct}%`,
              top: `${pos.topPct}%`,
              width: size,
              height: size,
              animationDelay: `${i * 90}ms`,
            }}
            title={`${b.id} · ${b.pieceCount} pieces · (${Math.round(b.centroid.x)}, ${Math.round(b.centroid.y)})`}
          >
            <span className="ring" />
            <span className="core">{b.pieceCount}</span>
          </div>
        );
      })}

      <div className="legend">
        <span>Ashenfall</span>
        <span>Holdings · Unreal cm</span>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .map {
    position: relative;
    min-height: min(58vh, 560px);
    overflow: hidden;
    border-top: 1px solid rgba(232, 224, 210, 0.12);
  }
  .map.empty {
    display: grid;
    place-items: center;
    color: var(--fog);
  }
  .map.empty p {
    position: relative;
    z-index: 2;
    margin: 0;
    padding: 1rem;
  }
  .terrain {
    position: absolute;
    inset: 0;
    background:
      url("/ashenfall-map.jpg") center / cover no-repeat,
      linear-gradient(160deg, #1a221c, #121416 70%);
    transform: scale(1.02);
    animation: mapBreath 18s ease-in-out infinite alternate;
  }
  .veil {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(10, 12, 14, 0.55) 100%),
      linear-gradient(180deg, rgba(12, 14, 16, 0.15), rgba(12, 14, 16, 0.45));
    pointer-events: none;
  }
  .region {
    position: absolute;
    z-index: 2;
    translate: -50% -50%;
    font-family: var(--font-display);
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(232, 224, 210, 0.55);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    animation: rise 1s ease both;
  }
  .pin {
    position: absolute;
    z-index: 3;
    translate: -50% -50%;
    display: grid;
    place-items: center;
    animation: rise 0.7s ease both;
  }
  .ring {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1px solid rgba(224, 138, 79, 0.55);
    box-shadow: 0 0 28px var(--glow);
    animation: breath 2.8s ease-in-out infinite;
  }
  .core {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, var(--ember-soft), var(--ember) 70%, #6b2a12);
    box-shadow: 0 0 0 1px rgba(232, 224, 210, 0.35);
    display: grid;
    place-items: center;
    font-size: 0.72rem;
    font-weight: 700;
    color: #1a120c;
  }
  .legend {
    position: absolute;
    z-index: 2;
    left: 1rem;
    bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(232, 224, 210, 0.7);
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
  }
  .legend span:first-child {
    font-family: var(--font-display);
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    color: var(--parchment);
  }
  @keyframes mapBreath {
    from { transform: scale(1.02); }
    to { transform: scale(1.05); }
  }
`;
