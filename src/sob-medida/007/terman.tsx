/**
 * 007 — O estudo de Terman (desde 1921) e os dois recusados que ganharam o Nobel.
 * Fala: "Em 1921, Lewis Terman começou a acompanhar mais de mil e quinhentas crianças com QI altíssimo. (0–.3)
 *        | Muitas tiveram ótimas carreiras. (.3–.4) | Mas nenhuma ganhou um Nobel. (.4–.5) | E dois meninos testados e
 *        recusados, por não terem QI alto o bastante, (.5–.78) | ganharam o Nobel de Física: William Shockley e Luis Alvarez. (.78–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "sobe", p: 0.06 },
  { som: "brilho", p: 0.32 },
  { som: "desce", p: 0.42 },
  { som: "whoosh", p: 0.52 },
  { som: "batida", p: 0.62 }, { som: "batida", p: 0.66 },
  { som: "ding", p: 0.8 }, { som: "ding", p: 0.88 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const COLS = 20, LINHAS = 7;

const Medalha: React.FC<{ k: number }> = ({ k }) => (
  <svg width={110} height={130} viewBox="0 0 110 130" style={{ transform: `scale(${k})` }}>
    <path d="M30 0 L50 50 L60 50 L80 0 Z" fill={COR.vermelho} />
    <circle cx={55} cy={85} r={40} fill={COR.amarelo} stroke="#C99A1E" strokeWidth={6} />
    <text x={55} y={96} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={26} fill={COR.azulEscuro}>NOBEL</text>
  </svg>
);

const Ficha: React.FC<{ nome: string; ano: string; k: number; carimbo: number; medalha: number }> = ({ nome, ano, k, carimbo, medalha }) => (
  <div style={{ position: "relative", width: 380, height: 360, background: COR.branco, borderRadius: 22, padding: 24, transform: `translateX(${(1 - k) * 500}px) rotate(${(1 - k) * 10}deg)`, boxShadow: "0 16px 40px rgba(0,0,0,.5)" }}>
    <svg width={90} height={90} viewBox="0 0 120 120">
      <path d="M20 120 Q20 70 60 70 Q100 70 100 120 Z" fill={COR.azulClaro} />
      <circle cx={60} cy={42} r={28} fill="#F1D3B8" />
    </svg>
    <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 34, color: COR.azulEscuro, marginTop: 10 }}>{nome}</div>
    <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: COR.azul }}>TESTADO NA INFÂNCIA</div>
    <div style={{ position: "absolute", top: 26, right: 16, transform: `scale(${carimbo}) rotate(-12deg)`, opacity: carimbo, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 34, color: COR.vermelho, border: `6px solid ${COR.vermelho}`, padding: "4px 14px", borderRadius: 10 }}>RECUSADO</div>
    {medalha > 0.01 && (
      <div style={{ position: "absolute", right: -20, bottom: -150, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Medalha k={medalha} />
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 28, color: COR.amarelo, opacity: medalha, textShadow: "0 4px 12px rgba(0,0,0,.7)" }}>FÍSICA · {ano}</div>
      </div>
    )}
  </div>
);

const Terman: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const grade = cl(p, 0.04, 0.24);
  const encolhe = cl(p, 0.5, 0.58);
  const total = Math.round(grade * 1528);
  const kNobel0 = mola(fala * 0.42);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="LEWIS TERMAN · DESDE 1921" />
      </div>
      {/* a multidão de crianças superdotadas */}
      <div style={{ position: "absolute", left: 130 + encolhe * -40, top: 150, transform: `scale(${1 - encolhe * 0.42})`, transformOrigin: "top left" }}>
        <svg width={1200} height={460} viewBox="0 0 1200 460">
          {Array.from({ length: COLS * LINHAS }).map((_, i) => {
            const x = (i % COLS) * 60 + 30;
            const y = Math.floor(i / COLS) * 64 + 30;
            const ap = cl(grade * COLS * LINHAS - i, 0, 1);
            const carreira = p > 0.32 && random(`c${i}`) < 0.3;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${ap})`}>
                <circle cx={0} cy={-8} r={10} fill="#F1D3B8" />
                <path d="M-14 22 Q-14 4 0 4 Q14 4 14 22 Z" fill={carreira ? COR.amarelo : COR.ciano} />
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 10 }}>
          <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: COR.branco }}>{total.toLocaleString("pt-BR")} CRIANÇAS</div>
          <div style={{ transform: `scale(${kNobel0})`, opacity: Math.min(1, kNobel0 * 2), fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: COR.azulEscuro, background: COR.vermelho, padding: "6px 28px", borderRadius: 18 }}>NOBEL: 0</div>
        </div>
      </div>
      {/* os dois recusados */}
      <div style={{ position: "absolute", right: 120, top: 200, display: "flex", gap: 40 }}>
        {[
          { nome: "SHOCKLEY", ano: "1956", t: 0.53, m: 0.82 },
          { nome: "ALVAREZ", ano: "1968", t: 0.57, m: 0.9 },
        ].map((c) => {
          const k = mola(fala * c.t, 14);
          if (p < c.t - 0.01) return null;
          return <Ficha key={c.nome} nome={c.nome} ano={c.ano} k={k} carimbo={mola(fala * (c.t + 0.08))} medalha={mola(fala * c.m)} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Terman;
