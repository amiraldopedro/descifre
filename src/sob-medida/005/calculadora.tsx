/**
 * 005 — Razão 1: a calculadora social desliga com a família.
 * Fala: "Com um estranho ou com o chefe, o seu cérebro faz uma conta o tempo todo: quanto eu perco se for grosso agora? (0–.45)
 *        | Com a família, essa calculadora desliga. (.45–.68) | A gente sente que o amor deles está garantido. (.68–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "tique", p: 0.15 }, { som: "tique", p: 0.22 }, { som: "tique", p: 0.29 }, { som: "tique", p: 0.36 },
  { som: "ding", p: 0.42 },
  { som: "pop", p: 0.47 },
  { som: "desce", p: 0.55 },
  { som: "brilho", p: 0.75 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Calculadora: React.FC<{ visor: string; ligada: number; cor: string; f: number }> = ({ visor, ligada, cor, f }) => (
  <svg width={380} height={500} viewBox="0 0 380 500">
    <rect x={10} y={10} width={360} height={480} rx={40} fill="#2A3E86" stroke={COR.azulEscuro} strokeWidth={8} />
    <rect x={40} y={40} width={300} height={120} rx={18} fill={ligada > 0.5 ? "#0B2A1E" : "#05091F"} />
    <text x={320} y={118} textAnchor="end" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={50} fill={cor} opacity={ligada}>{visor}</text>
    {Array.from({ length: 12 }).map((_, i) => {
      const x = 40 + (i % 3) * 104;
      const y = 190 + Math.floor(i / 3) * 74;
      const aceso = ligada > 0.5 && Math.floor(f / 5 + i * 3) % 7 === 0;
      return <rect key={i} x={x} y={y} width={88} height={58} rx={14} fill={aceso ? COR.amarelo : "#14318F"} stroke={COR.azulEscuro} strokeWidth={4} />;
    })}
  </svg>
);

const Painel: React.FC<{ titulo: string; sub: string; k: number; children: React.ReactNode }> = ({ titulo, sub, k, children }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: `translateY(${(1 - k) * 60}px)`, opacity: k }}>
    <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 46, color: COR.branco }}>{titulo}</div>
    <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 26, color: COR.ciano, marginBottom: 6 }}>{sub}</div>
    {children}
  </div>
);

const CalculadoraCena: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kA = mola(fala * 0.02);
  const kB = mola(fala * 0.46);
  const contando = p < 0.42;
  const visorA = contando ? `${Math.floor(random(`c${Math.floor(f / 4)}`) * 900 + 100)}` : "ALTO!";
  const desliga = 1 - cl(p, 0.55, 0.62);
  const kGar = mola(fala * 0.75);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="QUANTO EU PERCO SE FOR GROSSO?" />
      </div>
      <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", gap: 200 }}>
        <Painel titulo="COM O CHEFE" sub="CALCULANDO O CUSTO..." k={kA}>
          <Calculadora visor={visorA} ligada={1} cor={contando ? "#7CFFB2" : COR.vermelho} f={f} />
        </Painel>
        <Painel titulo="COM A MÃE" sub={desliga < 0.5 ? "CALCULADORA DESLIGADA" : "CALCULANDO..."} k={kB}>
          <div style={{ position: "relative" }}>
            <Calculadora visor="0" ligada={desliga} cor="#7CFFB2" f={f} />
            <div style={{ position: "absolute", top: 50, left: 0, width: 380, textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 54, color: `${COR.branco}55`, opacity: 1 - desliga }}>
              OFF
            </div>
          </div>
        </Painel>
      </div>
      <div style={{ position: "absolute", top: 640, left: 950, width: 600, display: "flex", justifyContent: "center" }}>
        {kGar > 0.01 && <Selo texto="AMOR GARANTIDO" k={kGar} cor={COR.vermelho} rot={-6} style={{ fontSize: 46 }} />}
      </div>
    </AbsoluteFill>
  );
};

export default CalculadoraCena;
