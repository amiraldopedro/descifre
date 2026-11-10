/** Peças compartilhadas das cenas sob medida (este arquivo NÃO é uma cena). */
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../tema";

/** Mola 0..1 a partir de um frame. */
export const useMolaEm = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (inicio: number, damping = 12) => spring({ frame: f - inicio, fps, config: { damping, mass: 0.6 } });
};

/** Contagem 3-2-1 que aparece na pausa depois da fala ("pense..."). */
export const Contador: React.FC<{ fala: number; dur: number; texto?: string; y?: number }> = ({ fala, dur, texto = "PENSE...", y = 820 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < fala) return null;
  const resta = (dur - f) / fps;
  const n = Math.max(1, Math.ceil(resta));
  const frac = resta % 1 || 1;
  const k = spring({ frame: f - fala, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: y, pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `scale(${k})` }}>
        <svg width={130} height={130}>
          <circle cx={65} cy={65} r={55} fill={COR.azulEscuro} stroke={`${COR.ciano}44`} strokeWidth={9} />
          <circle cx={65} cy={65} r={55} fill="none" stroke={COR.amarelo} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 55} strokeDashoffset={2 * Math.PI * 55 * (1 - frac)} transform="rotate(-90 65 65)" />
          <text x={65} y={86} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={56} fill={COR.branco}>{n}</text>
        </svg>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 54, color: COR.amarelo, letterSpacing: 6 }}>{texto}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Selo grande de revelação ("IGUAIS!", "METADE NÃO VIU"). */
export const Selo: React.FC<{ texto: string; k: number; cor?: string; rot?: number; style?: React.CSSProperties }> = ({ texto, k, cor = COR.vermelho, rot = -6, style }) => (
  <div
    style={{
      fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: COR.branco, background: cor,
      padding: "14px 38px", borderRadius: 22, transform: `scale(${k}) rotate(${rot * k}deg)`, opacity: Math.min(1, k * 2),
      boxShadow: `0 14px 40px rgba(0,0,0,.5), 0 0 40px ${cor}88`, whiteSpace: "nowrap", ...style,
    }}
  >
    {texto}
  </div>
);

/** Rótulo pequeno em cima ("PROVA 1"). */
export const Rotulo: React.FC<{ texto: string; k?: number }> = ({ texto, k = 1 }) => (
  <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: COR.ciano, opacity: k }}>{texto}</div>
);
