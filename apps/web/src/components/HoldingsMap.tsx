"use client";

import { projectToMap } from "@/lib/worldBounds";
import type { BaseCluster } from "@/lib/types";

type Props = {
  bases: BaseCluster[];
};

export function HoldingsMap({ bases }: Props) {
  if (bases.length === 0) {
    return (
      <div className="map empty">
        <img
          className="terrain"
          src="/ashenfall-map.jpg"
          alt=""
          aria-hidden
          draggable={false}
        />
        <p>No bases detected yet — lower BASE_MIN_PIECES or wait for the next collect.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const maxPieces = Math.max(...bases.map((b) => b.pieceCount));

  return (
    <div className="map" role="img" aria-label="Ashenfall world map with base holdings">
      {/*
        Square stage so UV % matches the square T_WorldMap_Landmass image 1:1.
        Pins live in the same box as the image — no letterboxing drift.
      */}
      <div className="stage">
        <picture>
          <source srcSet="/ashenfall-map.webp" type="image/webp" />
          <img
            className="terrain"
            src="/ashenfall-map.jpg"
            alt="Ashenfall world map from RuneScape: Dragonwilds (T_WorldMap_Landmass)"
            draggable={false}
          />
        </picture>

        {bases.map((b, i) => {
          const pos = projectToMap(b.centroid.x, b.centroid.y);
          // Compact pins: 10–16px so coastlines stay readable
          const size = 10 + (b.pieceCount / maxPieces) * 6;
          return (
            <div
              key={b.id}
              className={`pin ${pos.onMap ? "" : "off"}`}
              style={{
                left: `${pos.leftPct}%`,
                top: `${pos.topPct}%`,
                width: size,
                height: size,
                animationDelay: `${i * 90}ms`,
              }}
              title={`${b.id} · ${b.pieceCount} pieces · (${Math.round(b.centroid.x)}, ${Math.round(b.centroid.y)})`}
            >
              <span className="core" />
              <span className="label">{b.pieceCount}</span>
            </div>
          );
        })}
      </div>

      <div className="legend">
        <span>Ashenfall</span>
        <span>Map © Jagex · T_WorldMap_Landmass</span>
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .map {
    position: relative;
    overflow: hidden;
    border-top: 1px solid rgba(232, 224, 210, 0.12);
    background: #080a0c;
    padding: 0.75rem 0 2.75rem;
  }
  .map.empty {
    min-height: 320px;
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
  .stage {
    position: relative;
    width: min(100%, 720px);
    aspect-ratio: 1 / 1;
    margin: 0 auto;
    overflow: hidden;
  }
  .terrain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    display: block;
    user-select: none;
    pointer-events: none;
  }
  .pin {
    position: absolute;
    z-index: 3;
    translate: -50% -50%;
    display: grid;
    place-items: center;
    animation: rise 0.7s ease both;
  }
  .pin.off {
    opacity: 0.45;
  }
  .core {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, var(--ember-soft), var(--ember));
    box-shadow:
      0 0 0 1px rgba(232, 224, 210, 0.55),
      0 0 10px rgba(196, 92, 42, 0.55);
  }
  .label {
    position: absolute;
    top: calc(100% + 3px);
    left: 50%;
    translate: -50% 0;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--parchment);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
    white-space: nowrap;
    pointer-events: none;
  }
  .legend {
    position: absolute;
    z-index: 2;
    left: 1rem;
    bottom: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(232, 224, 210, 0.7);
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.85);
  }
  .legend span:first-child {
    font-family: var(--font-display);
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    color: var(--parchment);
  }
  @media (max-width: 800px) {
    .stage {
      width: 100%;
    }
  }
`;
