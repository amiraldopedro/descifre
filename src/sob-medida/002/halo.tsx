/**
 * Prova 6 — Efeito halo.
 * Fala: "Imagina dois currículos idênticos, palavra por palavra. (0–.23) | Só muda a foto: uma pessoa sorrindo, bem arrumada, (.23–.52)
 *        | e outra de cara fechada. (.52–.68) | Quem parece mais competente, mais honesta e até mais inteligente? (.68–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "pop", p: 0.15 },
  { som: "pop", p: 0.3 },
  { som: "desce", p: 0.56 },
  { som: "brilho", p: 0.72 },
  { som: "pop", p: 0.75 }, { som: "pop", p: 0.84 }, { som: "pop", p: 0.93 },
];

const Rosto: React.FC<{ feliz: boolean }> = ({ feliz }) => (
  <svg width={200} height={200} viewBox="0 0 200 200">
    <rect width={200} height={200} rx={24} fill={feliz ? "#2D5BD8" : "#3A3F5E"} />
    <path d="M30 200 Q30 140 100 140 Q170 140 170 200 Z" fill={feliz ? COR.branco : "#6B6F8A"} />
    {feliz && <path d="M88 142 L100 175 L112 142 Z" fill={COR.vermelho} />}
    <circle cx={100} cy={92} r={46} fill="#F1D3B8" stroke={COR.azulEscuro} strokeWidth={5} />
    {feliz ? (
      <path d="M58 72 Q100 30 142 72 Q120 52 100 56 Q76 54 58 72 Z" fill="#3B2A20" />
    ) : (
      <path d="M56 80 L66 50 L80 66 L92 44 L106 64 L120 46 L132 66 L144 56 L144 82 Q100 58 56 80 Z" fill="#3B2A20" />
    )}
    <circle cx={84} cy={92} r={5} fill={COR.azulEscuro} />
    <circle cx={116} cy={92} r={5} fill={COR.azulEscuro} />
    {feliz ? (
      <path d="M78 110 Q100 132 122 110" fill="none" stroke={COR.azulEscuro} strokeWidth={6} strokeLinecap="round" />
    ) : (
      <>
        <path d="M82 120 Q100 110 118 120" fill="none" stroke={COR.azulEscuro} strokeWidth={6} strokeLinecap="round" />
        <path d="M74 80 L92 86 M126 80 L108 86" stroke={COR.azulEscuro} strokeWidth={5} strokeLinecap="round" />
      </>
    )}
  </svg>
);

const Curriculo: React.FC<{ k: number; foto: number; feliz: boolean; halo: number; apagado: number }> = ({ k, foto, feliz, halo, apagado }) => (
  <div
    style={{
      width: 520, height: 640, background: COR.branco, borderRadius: 30, padding: 36, position: "relative",
      transform: `translateY(${(1 - k) * 80}px) scale(${0.9 + 0.1 * k})`, opacity: k * (1 - apagado * 0.45),
      boxShadow: halo > 0 ? `0 0 ${80 * halo}px ${COR.amarelo}AA, 0 20px 50px rgba(0,0,0,.5)` : "0 20px 50px rgba(0,0,0,.5)",
    }}
  >
    <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
      <div style={{ position: "relative", width: 200, height: 200, borderRadius: 24, background: "#D9DEEE" }}>
        {halo > 0 && (
          <div style={{ position: "absolute", left: 30, top: -38, width: 140, height: 40, borderRadius: "50%", border: `10px solid ${COR.amarelo}`, opacity: halo, boxShadow: `0 0 30px ${COR.amarelo}` }} />
        )}
        <div style={{ transform: `scale(${foto})` }}>
          <Rosto feliz={feliz} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 34, color: COR.azulEscuro }}>CURRÍCULO</div>
        <div style={{ height: 14, background: "#C5CBE0", borderRadius: 7, marginTop: 16, width: "90%" }} />
        <div style={{ height: 14, background: "#C5CBE0", borderRadius: 7, marginTop: 12, width: "70%" }} />
      </div>
    </div>
    {[95, 80, 88, 60, 92, 75, 85, 55].map((w, i) => (
      <div key={i} style={{ height: 16, background: i % 4 === 0 ? "#8E99C2" : "#D3D8EA", borderRadius: 8, marginTop: i % 4 === 0 ? 32 : 14, width: `${w}%` }} />
    ))}
  </div>
);

const Etiqueta: React.FC<{ txt: string; k: number; y: number }> = ({ txt, k, y }) => (
  <div
    style={{
      position: "absolute", left: 340, top: y, transform: `scale(${k}) rotate(${-8 + y / 60}deg)`, opacity: Math.min(1, k * 2),
      background: COR.amarelo, color: COR.azulEscuro, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40,
      padding: "10px 26px", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,.4)",
    }}
  >
    ★ {txt}
  </div>
);

const Halo: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const q = (p: number) => p * fala;
  const kA = mola(q(0.02));
  const kB = mola(q(0.08));
  const igual = mola(q(0.15));
  const fotoA = mola(q(0.3), 9);
  const fotoB = mola(q(0.56), 9);
  const halo = mola(q(0.72), 15) * (0.85 + Math.sin(f / 6) * 0.15);
  const tags = [mola(q(0.75)), mola(q(0.84)), mola(q(0.93))];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 110 }}>
      <Rotulo texto="PROVA 6 DE 7" />
      <div style={{ display: "flex", alignItems: "center", gap: 70, marginTop: 30, position: "relative" }}>
        <Curriculo k={kA} foto={fotoA} feliz halo={halo} apagado={0} />
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 110, color: COR.ciano, transform: `scale(${igual})` }}>=</div>
        <Curriculo k={kB} foto={fotoB} feliz={false} halo={0} apagado={tags[0]} />
        <Etiqueta txt="COMPETENTE" k={tags[0]} y={250} />
        <Etiqueta txt="HONESTA" k={tags[1]} y={350} />
        <Etiqueta txt="INTELIGENTE" k={tags[2]} y={450} />
      </div>
      <div style={{ position: "absolute", top: 70, right: 120, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 28, color: COR.ciano, opacity: igual }}>
        MESMO TEXTO, PALAVRA POR PALAVRA
      </div>
    </AbsoluteFill>
  );
};

export default Halo;
