"use client";

import type { BaseCluster } from "@/lib/types";

type Props = {
  bases: BaseCluster[];
};

export function HoldingsMap({ bases }: Props) {
  if (bases.length === 0) {
    return (
      <div className="map empty">
        <p>No bases detected yet — lower BASE_MIN_PIECES or wait for the next collect.</p>
        <style jsx>{`
          .map.empty {
            min-height: 320px;
            display: grid;
            place-items: center;
            color: var(--fog);
            border-top: 1px solid rgba(232, 224, 210, 0.12);
          }
        `}</style>
      </div>
    );
  }

  const xs = bases.flatMap((b) => [b.bbox.min.x, b.bbox.max.x]);
  const ys = bases.flatMap((b) => [b.bbox.min.y, b.bbox.max.y]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 0.08;
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const maxPieces = Math.max(...bases.map((b) => b.pieceCount));

  const project = (x: number, y: number) => {
    const nx = (x - minX) / spanX;
    const ny = (y - minY) / spanY;
    return {
      left: `${(pad + nx * (1 - pad * 2)) * 100}%`,
      top: `${(pad + (1 - ny) * (1 - pad * 2)) * 100}%`,
    };
  };

  return (
    <div className="map" role="img" aria-label="Holdings map of clustered bases">
      <div className="terrain" />
      {bases.map((b, i) => {
        const pos = project(b.centroid.x, b.centroid.y);
        const size = 14 + (b.pieceCount / maxPieces) * 28;
        return (
          <div
            key={b.id}
            className="pin"
            style={{
              ...pos,
              width: size,
              height: size,
              animationDelay: `${i * 80}ms`,
            }}
            title={`${b.id} · ${b.pieceCount} pieces`}
          >
            <span>{b.pieceCount}</span>
          </div>
        );
      })}
      <style jsx>{`
        .map {
          position: relative;
          min-height: min(52vh, 520px);
          overflow: hidden;
          border-top: 1px solid rgba(232, 224, 210, 0.12);
        }
        .terrain {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 40%, rgba(61, 90, 69, 0.45), transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(196, 92, 42, 0.12), transparent 45%),
            repeating-linear-gradient(
              115deg,
              rgba(232, 224, 210, 0.03) 0 2px,
              transparent 2px 18px
            ),
            linear-gradient(160deg, #1a221c, #121416 70%);
          background-size: 100% 100%, 100% 100%, 240% 240%, 100% 100%;
          animation: drift 48s linear infinite;
        }
        .pin {
          position: absolute;
          translate: -50% -50%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, var(--ember-soft), var(--ember));
          box-shadow: 0 0 0 1px rgba(232, 224, 210, 0.25), 0 0 24px var(--glow);
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: #1a120c;
          animation: rise 0.7s ease both;
        }
      `}</style>
    </div>
  );
}
