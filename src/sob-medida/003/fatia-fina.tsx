/**
 * 003 — Fatias finas (Ambady e Rosenthal, 1993).
 * Fala: "Em 1993, Nalini Ambady e Robert Rosenthal mostraram a estranhos vídeos de professores dando aula. (0–.33)
 *        | Trinta segundos, sem som. (.33–.43) | E as notas desses estranhos bateram com as avaliações que os alunos
 *        deram depois de um semestre inteiro. (.43–.82) | Até com clipes de seis segundos. (.82–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "click", p: 0.34 },
  { som: "tique", p: 0.37 }, { som: "tique", p: 0.4 },
  { som: "sobe", p: 0.48 },
  { som: "pop", p: 0.62 },
  { som: "brilho", p: 0.75 },
  { som: "zap", p: 0.84 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const NOTAS = [0.82, 0.45, 0.68, 0.3]; // 4 professores

const Professor: React.FC<{ f: number }> = ({ f }) => {
  const braco = Math.sin(f / 7) * 22;
  return (
    <g>
      <rect x={60} y={60} width={300} height={150} rx={10} fill="#1F4D3A" stroke="#8A6A45" strokeWidth={10} />
      <path d="M100 120 L180 120 M100 150 L250 150 M100 180 L210 180" stroke="#E8F0E8" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      <g transform="translate(420 150)">
        <path d="M-50 250 Q-50 120 0 120 Q50 120 50 250 Z" fill={COR.azulClaro} stroke={COR.azulEscuro} strokeWidth={6} />
        <path d={`M-40 140 L-110 ${60 - braco}`} stroke={COR.azulClaro} strokeWidth={26} strokeLinecap="round" />
        <circle cx={0} cy={80} r={42} fill="#F1D3B8" stroke={COR.azulEscuro} strokeWidth={6} />
        <path d="M-30 98 Q0 118 30 98" stroke={COR.azulEscuro} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

const FatiaFina: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kClip = mola(fala * 0.02);
  const mudo = mola(fala * 0.34);
  const seis = p >= 0.83;
  const seg = seis ? Math.max(0, 6 - Math.floor((p - 0.83) * 40)) : Math.max(0, 30 - Math.floor(cl(p, 0.34, 0.8) * 30));
  const kGraf = mola(fala * 0.46);
  const est = cl(p, 0.48, 0.62);
  const alu = cl(p, 0.62, 0.74);
  const bate = mola(fala * 0.75);
  const selo6 = mola(fala * 0.85);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 70 }}>
        <Rotulo texto="FATIAS FINAS · 1993" />
      </div>
      {/* o clipe */}
      <div style={{ position: "absolute", left: 180, top: 170, transform: `scale(${kClip})`, opacity: kClip }}>
        <svg width={700} height={500} viewBox="0 0 700 500">
          <rect x={10} y={10} width={680} height={480} rx={30} fill="#0E1C55" stroke={COR.ciano} strokeWidth={6} />
          <g transform="translate(40 40)">
            <Professor f={f} />
          </g>
          {/* mudo */}
          <g transform={`translate(560 70) scale(${mudo})`}>
            <circle r={44} fill={COR.vermelho} />
            <path d="M-22 -10 L-8 -10 L8 -24 L8 24 L-8 10 L-22 10 Z" fill={COR.branco} />
            <path d="M16 -12 L32 12 M32 -12 L16 12" stroke={COR.branco} strokeWidth={6} strokeLinecap="round" />
          </g>
        </svg>
        <div
          style={{
            position: "absolute", left: 30, bottom: 30, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52,
            color: seis ? COR.amarelo : COR.branco, background: "rgba(7,15,51,.85)", padding: "6px 22px", borderRadius: 14,
          }}
        >
          0:{String(seg).padStart(2, "0")}
        </div>
      </div>
      {/* o gráfico: estranhos x alunos */}
      <div style={{ position: "absolute", left: 1000, top: 190, width: 740, opacity: kGraf, transform: `translateX(${(1 - kGraf) * 60}px)` }}>
        <div style={{ display: "flex", gap: 30, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 28, marginBottom: 20 }}>
          <span style={{ color: COR.ciano }}>■ ESTRANHOS (30 s, sem som)</span>
        </div>
        <div style={{ display: "flex", gap: 30, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 28, marginBottom: 30 }}>
          <span style={{ color: COR.amarelo }}>■ ALUNOS (1 semestre)</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 46, height: 320, borderBottom: `4px solid ${COR.branco}55`, paddingLeft: 20 }}>
          {NOTAS.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ width: 58, height: 300 * n * est, background: COR.ciano, borderRadius: "10px 10px 0 0" }} />
              <div style={{ width: 58, height: 300 * (n + (i % 2 ? 0.03 : -0.02)) * alu, background: COR.amarelo, borderRadius: "10px 10px 0 0", boxShadow: bate > 0.5 ? `0 0 24px ${COR.amarelo}88` : "none" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 46, paddingLeft: 20, marginTop: 12, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: `${COR.branco}AA` }}>
          {["PROF. 1", "PROF. 2", "PROF. 3", "PROF. 4"].map((t) => (
            <div key={t} style={{ width: 126, textAlign: "center" }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", top: 700, left: 1000, width: 760, display: "flex", justifyContent: "center" }}>
        {bate > 0.01 && !seis && <Selo texto="BATERAM!" k={bate} cor={COR.azulClaro} rot={-4} />}
        {seis && <Selo texto="SÓ 6 SEGUNDOS!" k={selo6} cor={COR.vermelho} rot={-4} />}
      </div>
    </AbsoluteFill>
  );
};

export default FatiaFina;
