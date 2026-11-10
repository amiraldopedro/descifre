import React, { useMemo } from "react";
import { AbsoluteFill, Loop, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COR } from "./tema";

/** Shader lo-fi: grão fino, aberração cromática, scanlines sutis.
 *  nivel: "leve" (b-roll normal) ou "forte" (glitch em revelações/shorts). */
export const ShaderLoFi: React.FC<{ nivel?: "leve" | "forte" }> = ({ nivel = "leve" }) => {
  const f = useCurrentFrame();
  const forte = nivel === "forte";
  const graoOpacidade = forte ? 0.18 : 0.08;
  const abCr = forte ? 4 : 1.5; // px de aberração cromática
  const scanOpacidade = forte ? 0.12 : 0.04;
  const glitchOffset = forte ? Math.sin(f * 1.7) * (f % 17 < 2 ? 12 : 0) : 0;

  return (
    <>
      {/* Aberração cromática via sombras coloridas deslocadas */}
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          opacity: 0.15,
          background: `linear-gradient(90deg, rgba(255,59,78,0.3) 0%, transparent 30%, transparent 70%, rgba(47,107,255,0.3) 100%)`,
          transform: `translateX(${glitchOffset}px)`,
        }}
      />
      {/* Scanlines */}
      <AbsoluteFill
        style={{
          opacity: scanOpacidade,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.6) 3px, rgba(0,0,0,0.6) 4px)`,
          pointerEvents: "none",
        }}
      />
      {/* Grão — SVG noise filter */}
      <AbsoluteFill style={{ opacity: graoOpacidade, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute" }}>
          <filter id={`grao-${nivel}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={f % 60} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grao-${nivel})`} />
        </svg>
      </AbsoluteFill>
      {/* Vinheta (bordas escuras) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 55%, rgba(7,15,51,${forte ? 0.6 : 0.3}) 100%)`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

/** Fundo cósmico da marca (usado quando não há b-roll e nas cenas do mascote). */
export const FundoCosmico: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const estrelas = useMemo(
    () =>
      new Array(140).fill(0).map((_, i) => ({
        x: random(`x${i}`) * 1920,  // espalhadas e escaladas abaixo
        y: random(`y${i}`) * 1080,
        r: 1 + random(`r${i}`) * 2.2,
        v: 0.05 + random(`v${i}`) * 0.25,
        o: 0.25 + random(`o${i}`) * 0.7,
      })),
    []
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${COR.azul} 0%, ${COR.azulEscuro} 75%)` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {estrelas.map((e, i) => (
          <circle
            key={i}
            cx={((e.x / 1920) * W + f * e.v) % W}
            cy={(e.y / 1080) * H}
            r={e.r}
            fill={COR.branco}
            opacity={e.o * (0.6 + 0.4 * Math.sin(f / 15 + i))}
          />
        ))}
        <g transform={`rotate(${f * 0.08} ${W / 2} ${H / 2}) translate(${W / 2 - 960} ${H / 2 - 540})`} fill="none" stroke={COR.ciano} opacity={0.14} strokeWidth={2}>
          <circle cx={960} cy={540} r={380} />
          <circle cx={960} cy={540} r={520} strokeDasharray="6 18" />
          <circle cx={960} cy={540} r={680} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** B-roll com zoom lento e tinta azul da marca. */
export const BRoll: React.FC<{ src: string; duracao: number; clipe?: number; lofi?: "leve" | "forte" | "nenhum" }> = ({
  src,
  duracao,
  clipe,
  lofi = "leve",
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const escala = interpolate(f, [0, duracao], [1.02, 1.12]);
  return (
    <AbsoluteFill style={{ backgroundColor: COR.azulEscuro }}>
      <AbsoluteFill style={{ transform: `scale(${escala})` }}>
        {/* repete o clipe se a cena for maior que ele */}
        <Loop durationInFrames={Math.max(30, clipe && clipe > 2 ? clipe - 2 : duracao + 30)} layout="none">
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            pauseWhenBuffering={false}
            delayRenderTimeoutInMilliseconds={60_000}
            acceptableTimeShiftInSeconds={1 / fps}
          />
        </Loop>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(7,15,51,.35) 0%, rgba(7,15,51,.15) 45%, rgba(7,15,51,.85) 100%)`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: COR.azul, mixBlendMode: "soft-light", opacity: 0.35 }} />
      {lofi !== "nenhum" && <ShaderLoFi nivel={lofi} />}
    </AbsoluteFill>
  );
};
