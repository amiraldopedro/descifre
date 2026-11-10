import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TEXTO, Palavra } from "./tema";

/** Agrupa palavras em blocos curtos (até 5 palavras ou fim de frase). */
function blocos(palavras: Palavra[]): Palavra[][] {
  const out: Palavra[][] = [];
  let atual: Palavra[] = [];
  for (const p of palavras) {
    atual.push(p);
    if (atual.length >= 5 || /[.!?,:]$/.test(p.w)) {
      out.push(atual);
      atual = [];
    }
  }
  if (atual.length) out.push(atual);
  return out;
}

/** Legenda palavra por palavra, com a palavra falada em destaque. */
export const Legenda: React.FC<{ palavras: Palavra[]; topo?: boolean }> = ({ palavras, topo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const grupos = blocos(palavras);
  const grupo = grupos.find((g) => t >= g[0].t0 - 0.05 && t <= g[g.length - 1].t1 + 0.25);
  if (!grupo) return null;
  const entrada = interpolate(t - grupo[0].t0, [0, 0.12], [0.85, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        [topo ? "top" : "bottom"]: topo ? 90 : 110,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 30px",
        transform: `scale(${entrada})`,
      }}
    >
      {grupo.map((p, i) => {
        const ativa = t >= p.t0 && t <= p.t1 + 0.05;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONTE_TEXTO,
              fontWeight: 800,
              fontSize: 70,
              lineHeight: 1.15,
              textTransform: "uppercase",
              color: ativa ? COR.amarelo : COR.branco,
              WebkitTextStroke: `10px ${COR.azulEscuro}`,
              paintOrder: "stroke fill",
              textShadow: "0 8px 24px rgba(0,0,0,.55)",
              transform: ativa ? "translateY(-4px) scale(1.04)" : "none",
              transformOrigin: "center bottom",
              display: "inline-block",
            }}
          >
            {p.w.replace(/[,.:;]$/, "")}
          </span>
        );
      })}
    </div>
  );
};
