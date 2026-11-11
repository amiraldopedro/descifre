/**
 * 008 — O Estudo Monstro (1939): 22 órfãos; a 6 deles disseram, por meses, que gaguejavam.
 * Fala: "Para testar, Mary escolheu 22 crianças órfãs. (0–.25) | Algumas falavam perfeitamente. (.25–.38)
 *        | E, a seis delas, Mary passou meses dizendo: você está começando a gaguejar. (.38–.72)
 *        | Pare. Não fale se não conseguir falar direito. (.72–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "pop", p: 0.06 }, { som: "pop", p: 0.12 }, { som: "pop", p: 0.18 },
  { som: "ding", p: 0.4 },
  { som: "desce", p: 0.55 },
  { som: "batida", p: 0.74 }, { som: "batida", p: 0.84 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const ALVOS = new Set([2, 6, 9, 13, 16, 20]);
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI"];

const Crianca: React.FC<{ k: number; alvo: boolean; murcha: number; f: number; i: number }> = ({ k, alvo, murcha, f, i }) => {
  const cor = alvo ? COR.amarelo : "#8E99C2";
  const s = 1 - murcha * 0.18;
  return (
    <svg width={92} height={126} viewBox="0 0 110 150" style={{ transform: `scale(${k * s}) translateY(${murcha * 12}px)`, opacity: Math.min(1, k * 2) * (1 - murcha * 0.35) }}>
      <circle cx={55} cy={40} r={24} fill="#F1D3B8" />
      <path d="M22 150 Q22 78 55 78 Q88 78 88 150 Z" fill={cor} />
      {alvo && murcha > 0.3 ? (
        <path d="M45 50 Q55 44 65 50" stroke={COR.azulEscuro} strokeWidth={4} fill="none" />
      ) : (
        <path d="M45 46 Q55 56 65 46" stroke={COR.azulEscuro} strokeWidth={4} fill="none" />
      )}
      <circle cx={46} cy={36} r={3.5} fill={COR.azulEscuro} />
      <circle cx={64} cy={36} r={3.5} fill={COR.azulEscuro} />
      {!(alvo && murcha > 0.5) && Math.sin(f / 9 + i) > 0.6 && (
        <g>
          <rect x={70} y={0} width={40} height={24} rx={10} fill={COR.branco} opacity={0.9} />
          <path d="M78 12 h24" stroke={COR.azulEscuro} strokeWidth={3} />
        </g>
      )}
    </svg>
  );
};

const Monstro: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const destaque = cl(p, 0.38, 0.44);
  const murcha = cl(p, 0.5, 0.95);
  const mes = Math.min(4, Math.floor(cl(p, 0.45, 0.98) * 5));
  const kFrase1 = mola(fala * 0.48) * (1 - cl(p, 0.7, 0.73));
  const kFrase2 = mola(fala * 0.74);
  const kFrase3 = mola(fala * 0.84);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="ORFANATO DE DAVENPORT · 1939" />
      </div>
      <div style={{ position: "absolute", left: 120, top: 150, width: 1240, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <Crianca key={i} i={i} f={f} k={mola(fala * (0.03 + i * 0.008))} alvo={ALVOS.has(i) && destaque > 0.5} murcha={ALVOS.has(i) ? murcha : 0} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 120, top: 500, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, color: COR.branco, opacity: cl(p, 0.05, 0.12) }}>
        22 CRIANÇAS <span style={{ color: COR.amarelo, opacity: destaque }}>· 6 OUVIRAM QUE GAGUEJAVAM</span>
      </div>
      {/* calendário dos meses */}
      <div style={{ position: "absolute", right: 110, top: 160, width: 380, opacity: cl(p, 0.44, 0.5), background: "rgba(7,15,51,.85)", borderRadius: 20, padding: 20 }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: COR.ciano, marginBottom: 12 }}>POR MESES</div>
        <div style={{ display: "flex", gap: 8 }}>
          {MESES.map((m, i) => (
            <div key={m} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, background: i <= mes ? COR.vermelho : `${COR.branco}22`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 20, color: COR.branco }}>{m}</div>
          ))}
        </div>
      </div>
      {/* falas da adulta */}
      <div style={{ position: "absolute", right: 110, top: 330, width: 560, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end" }}>
        {[
          { t: "“Você está começando a gaguejar.”", k: kFrase1 },
          { t: "“Pare.”", k: kFrase2 },
          { t: "“Não fale se não conseguir falar direito.”", k: kFrase3 },
        ].map((b) =>
          b.k > 0.01 ? (
            <div key={b.t} style={{ transform: `scale(${b.k})`, transformOrigin: "right center", background: COR.branco, color: COR.azulEscuro, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 32, padding: "14px 24px", borderRadius: 22 }}>{b.t}</div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

export default Monstro;
