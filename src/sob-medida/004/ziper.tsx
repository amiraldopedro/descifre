/**
 * 004 — Armadilha 3: ilusão de profundidade explicativa (Rozenblit e Keil, 2002).
 * Fala: "De zero a dez, quanto você entende de como funciona um zíper? (0–.3) | Dá uma nota. (.3–.38)
 *        | Agora, explica em voz alta, passo a passo, como os dentinhos se prendem. (.38–1)"  (+ pausa: a nota despenca)
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "sobe", p: 0.2 },
  { som: "ding", p: 0.32 },
  { som: "mecanico", p: 0.45 },
  { som: "pop", p: 0.6 }, { som: "pop", p: 0.7 }, { som: "pop", p: 0.8 },
  { som: "desce", fim: 2.2 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Ziper: React.FC<{ fecho: number; zoom: number }> = ({ fecho, zoom }) => {
  const N = 11;
  const yCursor = 60 + (1 - fecho) * 380;
  return (
    <svg width={420} height={560} viewBox="0 0 420 560" style={{ transform: `scale(${1 + zoom * 0.12})` }}>
      <rect x={40} y={20} width={150} height={520} rx={16} fill="#2A3E86" />
      <rect x={230} y={20} width={150} height={520} rx={16} fill="#2A3E86" />
      {Array.from({ length: N }).map((_, i) => {
        const y = 50 + i * 44;
        const fechado = y < yCursor;
        const abre = fechado ? 0 : Math.min(40, (y - yCursor) * 0.25);
        return (
          <g key={i}>
            <rect x={170 - abre} y={y} width={44} height={20} rx={5} fill={COR.amarelo} stroke={COR.azulEscuro} strokeWidth={3} />
            <rect x={206 + abre} y={y + 22} width={44} height={20} rx={5} fill={COR.amarelo} stroke={COR.azulEscuro} strokeWidth={3} />
          </g>
        );
      })}
      <g transform={`translate(210 ${yCursor})`}>
        <path d="M-40 -20 L40 -20 L28 40 L-28 40 Z" fill="#C5CBE0" stroke={COR.azulEscuro} strokeWidth={5} />
        <rect x={-12} y={36} width={24} height={60} rx={10} fill="#C5CBE0" stroke={COR.azulEscuro} strokeWidth={5} />
      </g>
    </svg>
  );
};

const Interrog: React.FC<{ x: number; y: number; k: number; f: number }> = ({ x, y, k, f }) => (
  <div style={{ position: "absolute", left: x, top: y + Math.sin(f / 8 + x) * 8, transform: `scale(${k})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 80, color: COR.vermelho, textShadow: "0 6px 20px rgba(0,0,0,.5)" }}>?</div>
);

const ZiperCena: React.FC<PropsSobMedida> = ({ fala, dur }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kZ = mola(fala * 0.02);
  const fecho = 0.5 + Math.sin(f / 18) * 0.45;
  const sobe = cl(p, 0.18, 0.32);
  const cai = cl(f, fala, dur - 6);
  const nota = 8 * sobe - 5 * cai;
  const zoom = cl(p, 0.42, 0.55);
  const kQ = [mola(fala * 0.6), mola(fala * 0.7), mola(fala * 0.8)];
  const depois = cai > 0.1;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="ARMADILHA 3 DE 4" />
      </div>
      <div style={{ position: "absolute", left: 360, top: 200, transform: `scale(${kZ * 0.92})`, opacity: kZ }}>
        <Ziper fecho={fecho} zoom={zoom} />
        <Interrog x={-80} y={120} k={kQ[0]} f={f} />
        <Interrog x={420} y={60} k={kQ[1]} f={f} />
        <Interrog x={440} y={380} k={kQ[2]} f={f} />
      </div>
      {/* medidor de "quanto eu entendo" */}
      <div style={{ position: "absolute", left: 1080, top: 210, width: 560, opacity: kZ }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 32, color: COR.ciano, marginBottom: 20 }}>QUANTO VOCÊ ENTENDE?</div>
        <div style={{ position: "relative", height: 60, background: `${COR.branco}22`, borderRadius: 30 }}>
          <div style={{ width: `${(nota / 10) * 100}%`, height: "100%", borderRadius: 30, background: depois ? COR.vermelho : COR.amarelo }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 26, color: `${COR.branco}99`, marginTop: 8 }}>
          <span>0</span>
          <span>10</span>
        </div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 150, color: depois ? COR.vermelho : COR.branco, marginTop: 10 }}>{nota.toFixed(0)}</div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 36, color: depois ? COR.vermelho : COR.amarelo }}>
          {depois ? "DEPOIS DE EXPLICAR..." : p > 0.38 ? "AGORA EXPLICA!" : "SUA NOTA"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ZiperCena;
