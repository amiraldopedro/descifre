/**
 * 003 — Desordem chama desordem (Keizer, Lindenberg e Steg, 2008).
 * Fala: "Agora, um experimento curioso. (0–.12) | Em 2008, pesquisadores holandeses prenderam panfletos no guidão de
 *        bicicletas num beco. (.12–.45) | Com a parede limpa, cerca de um terço das pessoas jogou o panfleto no chão. (.45–.72)
 *        | Com a parede pichada, mais de dois terços. (.72–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.12 },
  { som: "pop", p: 0.3 }, { som: "pop", p: 0.33 }, { som: "pop", p: 0.36 },
  { som: "desce", p: 0.5 },
  { som: "glitch", p: 0.73 },
  { som: "sobe", p: 0.8 },
  { som: "boom", p: 0.95 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Bike: React.FC<{ x: number; panfleto: number }> = ({ x, panfleto }) => (
  <g transform={`translate(${x} 300)`}>
    <circle cx={-46} cy={40} r={34} fill="none" stroke={COR.azulEscuro} strokeWidth={8} />
    <circle cx={46} cy={40} r={34} fill="none" stroke={COR.azulEscuro} strokeWidth={8} />
    <path d="M-46 40 L-10 -4 L30 -4 L46 40 M-10 -4 L4 40 L-46 40 M30 -4 L36 -28" stroke={COR.vermelho} strokeWidth={7} fill="none" strokeLinejoin="round" />
    <path d="M24 -30 L50 -30" stroke={COR.azulEscuro} strokeWidth={8} strokeLinecap="round" />
    <path d="M-20 -12 L0 -12" stroke={COR.azulEscuro} strokeWidth={8} strokeLinecap="round" />
    <g transform={`translate(40 -46) scale(${panfleto}) rotate(-12)`}>
      <rect x={-18} y={-26} width={36} height={48} rx={4} fill={COR.branco} stroke={COR.amarelo} strokeWidth={3} />
      <path d="M-10 -12 H10 M-10 -2 H10 M-10 8 H4" stroke="#8E99C2" strokeWidth={3} />
    </g>
  </g>
);

const Painel: React.FC<{ titulo: string; pichado: number; pct: number; alvo: number; k: number; f: number; chao: number }> = ({ titulo, pichado, pct, alvo, k, f, chao }) => (
  <div style={{ width: 720, transform: `translateY(${(1 - k) * 60}px)`, opacity: k }}>
    <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 38, color: pichado > 0.5 ? COR.vermelho : COR.ciano, textAlign: "center", marginBottom: 14 }}>{titulo}</div>
    <svg width={720} height={400} viewBox="0 0 720 400" style={{ borderRadius: 26, overflow: "hidden" }}>
      <rect width={720} height={400} fill="#2A3E86" />
      {/* tijolos */}
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 10 }).map((__, c) => (
          <rect key={`${r}-${c}`} x={c * 76 - (r % 2) * 38} y={r * 36} width={72} height={32} rx={3} fill={(r + c) % 3 ? "#8E5A44" : "#7A4B39"} />
        )),
      )}
      {/* pichação */}
      <g opacity={pichado}>
        <path d="M60 80 Q120 20 180 90 T300 70 Q340 140 260 160" stroke={COR.vermelho} strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d="M380 60 L420 160 L470 60 L520 160 M560 70 Q640 40 650 120 Q600 170 560 120" stroke={COR.ciano} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d="M120 190 Q240 150 420 200 T680 180" stroke={COR.amarelo} strokeWidth={12} fill="none" strokeLinecap="round" />
      </g>
      <rect y={340} width={720} height={60} fill="#3B4466" />
      {/* papéis no chão */}
      {Array.from({ length: Math.round(chao) }).map((_, i) => (
        <rect key={i} x={60 + ((i * 137) % 600)} y={350 + ((i * 29) % 30)} width={30} height={20} rx={3} fill={COR.branco} transform={`rotate(${(i * 47) % 60 - 30} ${75 + ((i * 137) % 600)} ${360 + ((i * 29) % 30)})`} />
      ))}
      <Bike x={170} panfleto={cl(f, 0, 1)} />
      <Bike x={360} panfleto={cl(f, 0, 1)} />
      <Bike x={550} panfleto={cl(f, 0, 1)} />
    </svg>
    <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ flex: 1, height: 44, background: `${COR.branco}22`, borderRadius: 22, overflow: "hidden" }}>
        <div style={{ width: `${pct * alvo}%`, height: "100%", background: pichado > 0.5 ? COR.vermelho : COR.ciano, borderRadius: 22 }} />
      </div>
      <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52, color: COR.branco, width: 150, textAlign: "right" }}>{Math.round(pct * alvo)}%</div>
    </div>
    <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: `${COR.branco}AA`, marginTop: 4 }}>JOGARAM O PANFLETO NO CHÃO</div>
  </div>
);

const Beco: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kA = mola(fala * 0.12);
  const kB = mola(fala * 0.16);
  const panf = cl(p, 0.3, 0.38);
  const pctA = cl(p, 0.5, 0.68);
  const pich = cl(p, 0.72, 0.78);
  const pctB = cl(p, 0.8, 0.95);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 70 }}>
        <Rotulo texto="HOLANDA · 2008" />
      </div>
      <div style={{ position: "absolute", top: 130, display: "flex", gap: 90 }}>
        <Painel titulo="PAREDE LIMPA" pichado={0} pct={pctA} alvo={33} k={kA} f={panf} chao={pctA * 3} />
        <Painel titulo="PAREDE PICHADA" pichado={pich} pct={pctB} alvo={69} k={kB} f={panf} chao={pctB * 7} />
      </div>
    </AbsoluteFill>
  );
};

export default Beco;
