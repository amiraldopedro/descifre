/**
 * 006 — Teste 2: três portas.
 * fase "escolha": "Teste número dois. Três portas. Qual você abriria?" (+ contagem)
 * fase "revelar": "Porta vermelha: ... (0–.33) | Porta azul: ... (.33–.66) | Porta amarela: ... (.66–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Contador, Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02, fase: "escolha" },
  { som: "pop", p: 0.35, fase: "escolha" }, { som: "pop", p: 0.45, fase: "escolha" }, { som: "pop", p: 0.55, fase: "escolha" },
  { som: "tique", fim: 3, fase: "escolha" }, { som: "tique", fim: 2, fase: "escolha" }, { som: "tique", fim: 1, fase: "escolha" },
  { som: "porta", p: 0.03, fase: "revelar" },
  { som: "porta", p: 0.36, fase: "revelar" },
  { som: "porta", p: 0.69, fase: "revelar" },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

type Tipo = "vermelha" | "azul" | "amarela";
const PORTAS: { tipo: Tipo; cor: string; tracos: [string, string] }[] = [
  { tipo: "vermelha", cor: COR.vermelho, tracos: ["CORAGEM", "DURO CONSIGO"] },
  { tipo: "azul", cor: COR.azulClaro, tracos: ["LEAL", "CONFIOU DEMAIS"] },
  { tipo: "amarela", cor: COR.amarelo, tracos: ["CRIATIVO", "SE COBRA DEMAIS"] },
];

const Porta: React.FC<{ tipo: Tipo; cor: string; abre: number; f: number }> = ({ tipo, cor, abre, f }) => {
  const redonda = tipo === "amarela";
  const arco = tipo === "azul";
  const caminho = redonda
    ? "M30 380 L30 200 A150 150 0 0 1 330 200 L330 380 Z"
    : arco
      ? "M50 380 L50 140 Q180 20 310 140 L310 380 Z"
      : "M60 380 L60 40 L300 40 L300 380 Z";
  return (
    <svg width={360} height={400} viewBox="0 0 360 400">
      <defs>
        <clipPath id={`v-${tipo}`}>
          <path d={caminho} />
        </clipPath>
      </defs>
      {/* luz atrás da porta */}
      <path d={caminho} fill={COR.amarelo} opacity={0.9} />
      <g clipPath={`url(#v-${tipo})`}>
        <rect width={360} height={400} fill={`${COR.branco}`} opacity={0.35 + Math.sin(f / 6) * 0.1} />
      </g>
      {/* a folha da porta gira (encolhe no eixo x) */}
      <g transform={`translate(${redonda ? 30 : arco ? 50 : 60} 0) scale(${1 - abre * 0.82} 1) translate(${-(redonda ? 30 : arco ? 50 : 60)} 0)`}>
        <path d={caminho} fill={cor} stroke={COR.azulEscuro} strokeWidth={8} />
        {arco && <path d="M100 200 L260 200 M100 290 L260 290 M180 120 L180 380" stroke={COR.azulEscuro} strokeWidth={6} opacity={0.5} />}
        {redonda && <circle cx={180} cy={250} r={70} fill="none" stroke={COR.azulEscuro} strokeWidth={6} opacity={0.4} />}
        <circle cx={redonda ? 180 : 270} cy={redonda ? 260 : 220} r={14} fill={tipo === "amarela" ? COR.vermelho : COR.amarelo} stroke={COR.azulEscuro} strokeWidth={4} />
      </g>
      <rect x={10} y={378} width={340} height={14} rx={7} fill="#3B4466" />
    </svg>
  );
};

const Portas: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const revelar = props.fase === "revelar";
  const atual = revelar ? Math.min(2, Math.floor(p / 0.333)) : -1;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="TESTE 2 DE 4 · QUAL VOCÊ ABRIRIA?" />
      </div>
      <div style={{ position: "absolute", top: 160, width: "100%", display: "flex", justifyContent: "center", gap: 90 }}>
        {PORTAS.map((d, i) => {
          const k = revelar ? 1 : mola(fala * (0.35 + i * 0.1));
          const ativa = i === atual;
          const ini = i * 0.333;
          const abre = revelar ? (ativa ? cl(p, ini + 0.02, ini + 0.1) : i < atual ? 1 : 0) : 0;
          const apagada = revelar && !ativa ? 0.35 : 1;
          return (
            <div key={d.tipo} style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${k * (ativa ? 1.08 : 1)}) translateY(${(1 - k) * 60}px)`, opacity: apagada }}>
              <Porta tipo={d.tipo} cor={d.cor} abre={abre} f={f} />
              <div style={{ height: 130, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 14 }}>
                {ativa &&
                  d.tracos.map((t, j) => {
                    const kt = mola(fala * (ini + 0.08 + j * 0.1));
                    return (
                      <div key={t} style={{ transform: `scale(${kt})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 34, color: COR.azulEscuro, background: j ? COR.ciano : COR.branco, padding: "6px 20px", borderRadius: 14, whiteSpace: "nowrap" }}>
                        {t}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
      {!revelar && <Contador fala={fala} dur={dur} y={720} texto="ESCOLHA!" />}
    </AbsoluteFill>
  );
};

export default Portas;
