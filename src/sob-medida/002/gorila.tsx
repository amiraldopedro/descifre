/**
 * Prova 2 — Gorila invisível (Simons e Chabris, 1999).
 * fase "contar":  "...pediram uma coisa simples: conte quantos passes o time de camiseta branca faz."
 * fase "revelar": "No meio do vídeo, uma pessoa fantasiada de gorila atravessa a quadra, para no meio e bate no peito.
 *                  E cerca de metade dos participantes simplesmente não viu o gorila."
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.05, fase: "contar" },
  { som: "pop", p: 0.75, fase: "contar" },
  { som: "passos", p: 0.15, fase: "revelar" },
  { som: "batida", p: 0.47, fase: "revelar" }, { som: "batida", p: 0.51, fase: "revelar" },
  { som: "batida", p: 0.55, fase: "revelar" }, { som: "batida", p: 0.59, fase: "revelar" },
  { som: "boom", p: 0.74, fase: "revelar" },
];

const cl = (f: number, a: number, b: number, x = 0, y = 1) => interpolate(f, [a, b], [x, y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const QX = 360, QY = 170, QW = 1200, QH = 620; // quadra
const PASSE = 26; // frames por passe

const pos = (i: number, f: number, time: number) => {
  const a = f / 50 + i * 2.1 + time * 1.05;
  const r = 180 + 40 * Math.sin(f / 37 + i);
  return { x: 960 + Math.cos(a) * (r + 120) * 1.25, y: QY + QH / 2 + Math.sin(a * 1.3) * r * 0.85 };
};

const Jogador: React.FC<{ x: number; y: number; cor: string; f: number; i: number }> = ({ x, y, cor, f, i }) => {
  const pulo = Math.abs(Math.sin(f / 6 + i)) * 8;
  return (
    <g transform={`translate(${x} ${y - pulo})`}>
      <ellipse cx={0} cy={60 + pulo} rx={34} ry={9} fill="rgba(0,0,0,.3)" />
      <path d="M-30 58 Q-30 8 0 8 Q30 8 30 58 Z" fill={cor} stroke={COR.azulEscuro} strokeWidth={6} />
      <circle cx={0} cy={-14} r={22} fill="#F1D3B8" stroke={COR.azulEscuro} strokeWidth={6} />
    </g>
  );
};

const Gorila: React.FC<{ x: number; y: number; batendo: number; f: number }> = ({ x, y, batendo, f }) => {
  const bate = batendo > 0 ? Math.sin(f * 0.9) * 26 * batendo : 0;
  const passo = batendo > 0 ? 0 : Math.sin(f / 4) * 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={118} rx={80} ry={16} fill="rgba(0,0,0,.35)" />
      <path d={`M-38 70 L-46 ${116 + passo} M38 70 L46 ${116 - passo}`} stroke="#23243A" strokeWidth={34} strokeLinecap="round" />
      <path d="M-70 80 Q-78 -40 0 -46 Q78 -40 70 80 Z" fill="#2B2D45" stroke={COR.azulEscuro} strokeWidth={6} />
      <ellipse cx={0} cy={10} rx={36} ry={40} fill="#4A4C66" />
      {/* braços: batendo no peito */}
      <path d={`M-62 -24 Q-96 30 ${-30 + bate * 0.3} ${4 - Math.abs(bate)}`} fill="none" stroke="#23243A" strokeWidth={30} strokeLinecap="round" />
      <path d={`M62 -24 Q96 30 ${30 - bate * 0.3} ${4 - Math.abs(bate)}`} fill="none" stroke="#23243A" strokeWidth={30} strokeLinecap="round" />
      <circle cx={0} cy={-78} r={38} fill="#2B2D45" stroke={COR.azulEscuro} strokeWidth={6} />
      <ellipse cx={0} cy={-68} rx={24} ry={18} fill="#5A5C78" />
      <path d="M-24 -92 Q0 -102 24 -92" stroke="#15162A" strokeWidth={10} strokeLinecap="round" fill="none" />
      <circle cx={-11} cy={-82} r={4.5} fill="#fff" />
      <circle cx={11} cy={-82} r={4.5} fill="#fff" />
    </g>
  );
};

const GorilaCena: React.FC<PropsSobMedida> = ({ fala, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const revelar = props.fase === "revelar";
  const kQuadra = revelar ? 1 : mola(fala * 0.03);
  const inicioContagem = revelar ? -200 : fala * 0.75;
  const passes = Math.max(0, Math.floor((f - inicioContagem) / PASSE));
  const brancos = [0, 1, 2].map((i) => pos(i, f, 0));
  const pretos = [0, 1, 2].map((i) => pos(i, f, 1));
  // bola passa entre os brancos
  const ciclo = (f % (PASSE * 3)) / PASSE;
  const de = Math.floor(ciclo), t = ciclo - de;
  const b1 = brancos[de % 3], b2 = brancos[(de + 1) % 3];
  const bola = { x: b1.x + (b2.x - b1.x) * t, y: b1.y + (b2.y - b1.y) * t - Math.sin(t * Math.PI) * 60 };
  // gorila
  const gx = revelar
    ? f < fala * 0.45 ? cl(f, fala * 0.15, fala * 0.45, QX + QW + 120, 960) : cl(f, fala * 0.62, fala * 0.85, 960, QX - 140)
    : -500;
  const batendo = revelar ? cl(f, fala * 0.45, fala * 0.48) * (1 - cl(f, fala * 0.6, fala * 0.63)) : 0;
  const destaque = revelar ? mola(fala * 0.72) : 0;
  const gy = QY + QH / 2 + 10;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="PROVA 2 DE 7" />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", transform: `scale(${0.9 + 0.1 * kQuadra})`, opacity: kQuadra }}>
        <rect x={QX} y={QY} width={QW} height={QH} rx={30} fill="#1B3A8F" stroke={COR.ciano} strokeWidth={6} />
        <line x1={960} y1={QY} x2={960} y2={QY + QH} stroke={`${COR.ciano}66`} strokeWidth={5} />
        <circle cx={960} cy={QY + QH / 2} r={110} fill="none" stroke={`${COR.ciano}66`} strokeWidth={5} />
        {pretos.map((p, i) => <Jogador key={`p${i}`} {...p} cor="#1A1C2E" f={f} i={i + 3} />)}
        {revelar && gx > QX - 200 && gx < QX + QW + 200 && <Gorila x={gx} y={gy} batendo={batendo} f={f} />}
        {brancos.map((p, i) => <Jogador key={`b${i}`} {...p} cor={COR.branco} f={f} i={i} />)}
        <circle cx={bola.x} cy={bola.y - 30} r={16} fill={COR.amarelo} stroke={COR.azulEscuro} strokeWidth={5} />
        {revelar && destaque > 0 && (
          <circle cx={gx} cy={gy - 10} r={170 * destaque} fill="none" stroke={COR.vermelho} strokeWidth={12} strokeDasharray="30 14" />
        )}
      </svg>
      {!revelar && f >= inicioContagem && (
        <div style={{ position: "absolute", right: 120, top: 70, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 54, color: COR.amarelo }}>
          PASSES: {passes}
        </div>
      )}
      {revelar && (
        <div style={{ position: "absolute", top: 650, width: "100%", display: "flex", justifyContent: "center" }}>
          <Selo texto="METADE NÃO VIU" k={destaque} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export default GorilaCena;
