import React, { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COR } from "./tema";

/** Fundo cósmico da marca (usado quando não há b-roll e nas cenas do mascote). */
export const FundoCosmico: React.FC = () => {
  const f = useCurrentFrame();
  const estrelas = useMemo(
    () =>
      new Array(140).fill(0).map((_, i) => ({
        x: random(`x${i}`) * 1920,
        y: random(`y${i}`) * 1080,
        r: 1 + random(`r${i}`) * 2.2,
        v: 0.05 + random(`v${i}`) * 0.25,
        o: 0.25 + random(`o${i}`) * 0.7,
      })),
    []
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${COR.azul} 0%, ${COR.azulEscuro} 75%)` }}>
      <svg width={1920} height={1080}>
        {estrelas.map((e, i) => (
          <circle
            key={i}
            cx={(e.x + f * e.v) % 1920}
            cy={e.y}
            r={e.r}
            fill={COR.branco}
            opacity={e.o * (0.6 + 0.4 * Math.sin(f / 15 + i))}
          />
        ))}
        <g transform={`rotate(${f * 0.08} 960 540)`} fill="none" stroke={COR.ciano} opacity={0.14} strokeWidth={2}>
          <circle cx={960} cy={540} r={380} />
          <circle cx={960} cy={540} r={520} strokeDasharray="6 18" />
          <circle cx={960} cy={540} r={680} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** B-roll com zoom lento e tinta azul da marca. */
export const BRoll: React.FC<{ src: string; duracao: number }> = ({ src, duracao }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const escala = interpolate(f, [0, duracao], [1.02, 1.12]);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.azulEscuro }}>
      <AbsoluteFill style={{ transform: `scale(${escala})` }}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          // repete o clipe se a cena for maior que o vídeo
          loop
          pauseWhenBuffering={false}
          delayRenderTimeoutInMilliseconds={60_000}
          acceptableTimeShiftInSeconds={1 / fps}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(7,15,51,.35) 0%, rgba(7,15,51,.15) 45%, rgba(7,15,51,.85) 100%)`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: COR.azul, mixBlendMode: "soft-light", opacity: 0.35 }} />
    </AbsoluteFill>
  );
};
