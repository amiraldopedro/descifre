/**
 * 008 — A Terceira Onda (1967): o quadro-negro, o cartão de membro e o símbolo da onda.
 * Fala: "Na terça, veio força pela comunidade, com uma saudação própria. (0–.3) | Na quarta, força pela ação: cartões de
 *        membro, a missão de recrutar e até de denunciar quem não seguisse as regras. (.3–.78)
 *        | O movimento ganhou um nome: a Terceira Onda. (.78–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "click", p: 0.04 },
  { som: "click", p: 0.32 },
  { som: "pop", p: 0.45 },
  { som: "pop", p: 0.56 },
  { som: "pop", p: 0.66 },
  { som: "boom", p: 0.8 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const LINHAS = [
  { t: "FORÇA PELA DISCIPLINA", p: -1 },
  { t: "FORÇA PELA COMUNIDADE", p: 0.04 },
  { t: "FORÇA PELA AÇÃO", p: 0.32 },
];

const Onda: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kCartao = mola(fala * 0.45);
  const icones = [
    { t: "RECRUTAR", p: 0.56 },
    { t: "DENUNCIAR", p: 0.66 },
  ];
  const kNome = mola(fala * 0.8, 10);
  const final = cl(p, 0.78, 0.84);
  return (
    <AbsoluteFill>
      {/* quadro-negro */}
      <div style={{ position: "absolute", left: 140, top: 120, width: 980, height: 560, background: "#1F3B2E", border: "18px solid #6B4A2E", borderRadius: 10, padding: "50px 60px", opacity: 1 - final * 0.88, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        {LINHAS.map((l, i) => {
          const n = l.p < 0 ? l.t.length : Math.floor(cl(p, l.p, l.p + 0.12) * l.t.length);
          return (
            <div key={l.t} style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 46, color: "#ECF1E6", marginBottom: 40, whiteSpace: "nowrap", letterSpacing: 2, opacity: 0.92 }}>
              {l.t.slice(0, n)}
              {n > 0 && n < l.t.length && <span style={{ opacity: 0.6 }}>|</span>}
              {i === 2 && n === l.t.length && <span style={{ color: COR.amarelo }}> !</span>}
            </div>
          );
        })}
      </div>
      {/* cartão de membro */}
      <div style={{ position: "absolute", left: 1220, top: 160, width: 520, transform: `rotate(${6 - kCartao * 2}deg) scale(${kCartao})`, opacity: kCartao * (1 - final * 0.9), background: "#F3EAD3", borderRadius: 20, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 22, color: "#6B4A2E" }}>CARTÃO DE MEMBRO</div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, color: COR.azulEscuro, marginTop: 8 }}>Nº 017</div>
        <svg width={120} height={60} viewBox="0 0 120 60" style={{ marginTop: 10 }}>
          <path d="M5 40 Q25 10 45 40 T85 40 T125 40" stroke={COR.azulEscuro} strokeWidth={8} fill="none" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 1220, top: 470, display: "flex", gap: 24 }}>
        {icones.map((ic) => {
          const k = mola(fala * ic.p);
          return (
            <div key={ic.t} style={{ transform: `scale(${k})`, opacity: k * (1 - final * 0.9), background: ic.t === "DENUNCIAR" ? COR.vermelho : COR.azulClaro, color: COR.branco, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 34, padding: "14px 24px", borderRadius: 16 }}>
              {ic.t}
            </div>
          );
        })}
      </div>
      {/* o nome */}
      {kNome > 0.01 && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transform: `scale(${kNome})`, paddingBottom: 140 }}>
          <svg width={360} height={140} viewBox="0 0 360 140">
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M10 ${50 + i * 30} Q60 ${10 + i * 30} 110 ${50 + i * 30} T210 ${50 + i * 30} T310 ${50 + i * 30} T410 ${50 + i * 30}`} stroke={i === 2 ? COR.vermelho : COR.ciano} strokeWidth={12} fill="none" strokeLinecap="round" transform={`translate(${-((f * 2 + i * 30) % 100)} 0)`} />
            ))}
          </svg>
          <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 110, color: COR.branco, textShadow: "0 10px 40px rgba(0,0,0,.6)" }}>A TERCEIRA ONDA</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Onda;
