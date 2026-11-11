/**
 * d03/gerador — painel do gerador de choques do experimento de Milgram (2D).
 * Narração: "Lá dentro, o voluntário fazia o papel de professor. A cada erro do aluno, numa sala ao lado,
 * ele devia dar um choque, começando em 15 volts (p 0.30) e subindo até 450 (p 0.30→0.55).
 * O aluno era um ator. Os choques eram falsos (p 0.70). Mas o professor não sabia disso."
 * 30 chaves de 15 em 15 volts; faixas com os nomes das intensidades (como no aparelho original, traduzidos).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TEXTO, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "mecanico", p: 0.3 },
  { som: "zap", p: 0.55 },
  { som: "boom", p: 0.555, vol: 0.6 },
  { som: "batida", p: 0.7 },
];

const FAIXAS = ["LEVE", "MODERADO", "FORTE", "MUITO FORTE", "INTENSO", "EXTREMO", "PERIGO", "XXX"];
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const corDaChave = (i: number) => (i < 12 ? COR.ciano : i < 22 ? COR.amarelo : COR.vermelho);

const Gerador: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const entra = mola(0, 14);
  const ini = 0.3 * fala;
  const fim = 0.55 * fala;
  const ligadas = Math.floor(interpolate(f, [ini, fim], [0, 30], cl));
  const volts = ligadas === 0 ? 0 : ligadas * 15;
  const falso = mola(0.7 * fala, 11);
  const tremor = ligadas >= 28 ? Math.sin(f * 2.3) * 3 : 0;

  const X0 = 210;
  const passo = 50;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #1D2A66 0%, ${COR.azulEscuro} 70%)` }} />
      <div
        style={{
          position: "absolute", left: 150, top: 90, width: 1620, height: 620, borderRadius: 26,
          background: "linear-gradient(180deg, #2A3566 0%, #161F48 100%)", border: `4px solid ${COR.ciano}44`,
          boxShadow: "0 30px 80px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.12)",
          transform: `translateY(${(1 - entra) * 300}px) translateX(${tremor}px)`, opacity: Math.min(1, entra * 1.5),
        }}
      >
        <div style={{ position: "absolute", left: 60, top: 34, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: COR.branco, letterSpacing: 4 }}>
          GERADOR DE CHOQUE
        </div>
        <div style={{ position: "absolute", left: 62, top: 90, fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 24, color: `${COR.branco}99` }}>
          15 a 450 volts · 30 chaves
        </div>
        {/* mostrador */}
        <div
          style={{
            position: "absolute", right: 60, top: 26, width: 330, height: 110, borderRadius: 18, background: "#060B24",
            border: `3px solid ${corDaChave(Math.max(0, ligadas - 1))}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: corDaChave(Math.max(0, ligadas - 1)),
            boxShadow: `0 0 ${ligadas ? 30 : 0}px ${corDaChave(Math.max(0, ligadas - 1))}66`,
          }}
        >
          {volts} V
        </div>
        <svg width={1620} height={620} style={{ position: "absolute", left: 0, top: 0 }}>
          {FAIXAS.map((nome, g) => {
            const i0 = g * 4;
            const n = g === 7 ? 2 : 4;
            const x = X0 - 160 + i0 * passo - 10;
            return (
              <g key={nome}>
                <rect x={x} y={196} width={n * passo - 6} height={44} rx={8} fill={g >= 6 ? `${COR.vermelho}33` : "#0B1235"} stroke={g >= 6 ? COR.vermelho : `${COR.ciano}55`} strokeWidth={2} />
                <text x={x + (n * passo - 6) / 2} y={225} textAnchor="middle" fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={n === 2 ? 19 : 20} fill={g >= 6 ? COR.vermelho : COR.branco}>
                  {nome}
                </text>
              </g>
            );
          })}
          {new Array(30).fill(0).map((_, i) => {
            const x = X0 - 160 + i * passo;
            const on = i < ligadas;
            const c = corDaChave(i);
            const recemLigada = on && i === ligadas - 1;
            return (
              <g key={i}>
                <circle cx={x + 12} cy={278} r={10} fill={on ? c : "#0B1235"} stroke={on ? c : `${COR.branco}33`} strokeWidth={2} opacity={on ? 1 : 0.8} />
                {on && <circle cx={x + 12} cy={278} r={recemLigada ? 22 : 15} fill={c} opacity={recemLigada ? 0.35 : 0.18} />}
                <rect x={x} y={310} width={24} height={120} rx={8} fill="#0B1235" stroke={`${COR.branco}44`} strokeWidth={2} />
                <rect x={x + 3} y={on ? 316 : 368} width={18} height={56} rx={6} fill={on ? c : "#8C96B8"} />
                <text x={x + 12} y={470} textAnchor="middle" fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={20} fill={on ? c : `${COR.branco}AA`}>
                  {(i + 1) * 15}
                </text>
              </g>
            );
          })}
          <text x={810} y={540} textAnchor="middle" fontFamily={FONTE_TEXTO} fontWeight={600} fontSize={26} fill={`${COR.branco}88`}>
            o “professor” apertava uma chave a mais a cada erro do “aluno”
          </text>
        </svg>
      </div>
      {f >= 0.7 * fala && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 600 }}>
          <Selo texto="O ALUNO ERA UM ATOR · CHOQUES FALSOS" k={falso} cor={COR.vermelho} rot={-3} style={{ fontSize: 46 }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export default Gerador;
