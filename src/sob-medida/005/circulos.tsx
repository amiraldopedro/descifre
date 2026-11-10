/**
 * 005 — Razão 3: o outro vira parte de mim (escala de inclusão do outro no self, Aron e colegas, 1992).
 * Fala: "Quanto mais próxima uma pessoa, mais ela vira parte de você. (0–.3) | Em 1992, Arthur Aron criou um teste
 *        com dois círculos, você e o outro. (.3–.68) | Quanto mais íntimos, mais os círculos se misturam. (.68–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "pop", p: 0.34 }, { som: "pop", p: 0.38 }, { som: "pop", p: 0.42 }, { som: "pop", p: 0.46 },
  { som: "pop", p: 0.5 }, { som: "pop", p: 0.54 }, { som: "pop", p: 0.58 },
  { som: "sobe", p: 0.7 },
  { som: "brilho", p: 0.95 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Par: React.FC<{ d: number; r: number; destaque?: boolean; rotulos?: boolean; nos?: number }> = ({ d, r, destaque, rotulos, nos = 0 }) => {
  const w = r * 5.4;
  const h = r * 2.9;
  return (
    <svg width={w} height={h} viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}>
      <circle cx={-d / 2} cy={0} r={r} fill={`${COR.ciano}55`} stroke={COR.ciano} strokeWidth={destaque ? 8 : 4} />
      <circle cx={d / 2} cy={0} r={r} fill={`${COR.vermelho}55`} stroke={COR.vermelho} strokeWidth={destaque ? 8 : 4} />
      {rotulos && (
        <>
          <text x={-d / 2 - r * 0.62} y={-r * 0.92} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={r * 0.26} fill={COR.branco}>VOCÊ</text>
          <text x={d / 2 + r * 0.62} y={-r * 0.92} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={r * 0.26} fill={COR.branco}>OUTRO</text>
          <text x={0} y={12} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={r * 0.24} fill={COR.amarelo} opacity={nos}>NÓS</text>
        </>
      )}
    </svg>
  );
};

const Circulos: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const R = 190;
  // distância entre centros: separados -> perto (0–.3) -> parados -> se misturam (.68–1)
  const d = interpolate(p, [0, 0.3, 0.68, 0.98], [R * 2.6, R * 2.05, R * 2.05, R * 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kGrande = mola(fala * 0.02);
  const nivel = Math.min(6, Math.floor(cl(p, 0.68, 0.98) * 7));
  const nos = cl(p, 0.86, 0.95);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="ARTHUR ARON · 1992" />
      </div>
      {/* a escala de 7 níveis do teste */}
      <div style={{ position: "absolute", top: 130, width: "100%", display: "flex", justifyContent: "center", gap: 22 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const k = mola(fala * (0.34 + i * 0.04));
          const ativo = p > 0.68 && i === nivel;
          return (
            <div key={i} style={{ transform: `scale(${k * (ativo ? 1.15 : 1)})`, opacity: k, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Par d={interpolate(i, [0, 6], [2.3, 0.35]) * 40} r={40} destaque={ativo} />
              <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: ativo ? COR.amarelo : `${COR.branco}88` }}>{i + 1}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 330, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${kGrande * 0.82})` }}>
        <Par d={d} r={R} rotulos nos={nos} />
      </div>
    </AbsoluteFill>
  );
};

export default Circulos;
