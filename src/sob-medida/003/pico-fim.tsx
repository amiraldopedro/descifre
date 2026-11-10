/**
 * 003 — Regra do pico e do fim (Kahneman e colegas, 1993: a água gelada).
 * Fala: "O psicólogo Daniel Kahneman mostrou que a gente lembra de uma experiência pelo momento mais intenso
 *        e pelo jeito que ela terminou. (0–.4) | Num estudo de 1993, pessoas colocaram a mão em água gelada. (.4–.58)
 *        | E a maioria preferiu repetir a versão mais longa, só porque o final era um pouco menos gelado. (.58–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "ding", p: 0.22 },
  { som: "ding", p: 0.32 },
  { som: "brilho", p: 0.36 },
  { som: "whoosh", p: 0.41 },
  { som: "pop", p: 0.46 }, { som: "pop", p: 0.5 },
  { som: "boom", p: 0.8 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// curva de desconforto ao longo da experiência (0..1 no tempo)
const PTS = [0.2, 0.35, 0.3, 0.55, 0.9, 0.6, 0.45, 0.5, 0.4, 0.3];
const GX = 260, GW = 1400, GY = 230, GH = 420;
const ponto = (i: number) => ({ x: GX + (i / (PTS.length - 1)) * GW, y: GY + GH - PTS[i] * GH });

const Mao: React.FC<{ titulo: string; detalhe: string; tempo: number; extra: boolean; k: number; destaque: number }> = ({ titulo, detalhe, tempo, extra, k, destaque }) => (
  <div
    style={{
      width: 640, padding: 30, borderRadius: 30, background: "#0E1C55", border: `5px solid ${destaque > 0.5 ? COR.amarelo : COR.ciano + "66"}`,
      transform: `scale(${(0.9 + 0.1 * k) * (1 + destaque * 0.05)})`, opacity: k, boxShadow: destaque > 0.5 ? `0 0 50px ${COR.amarelo}66` : "none",
    }}
  >
    <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, color: COR.branco }}>{titulo}</div>
    <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 30, color: COR.ciano, marginTop: 6 }}>{detalhe}</div>
    <svg width={580} height={250} viewBox="0 0 580 250" style={{ marginTop: 14 }}>
      {/* bacia com água */}
      <path d="M80 110 L500 110 L460 240 L120 240 Z" fill="#2F6BFF55" stroke={COR.ciano} strokeWidth={6} />
      <path d="M90 130 Q180 118 290 130 T490 130" stroke={COR.branco} strokeWidth={4} fill="none" opacity={0.6} />
      {/* mão */}
      <path d="M260 0 L320 0 L320 150 Q320 190 290 190 Q260 190 260 150 Z" fill="#F1D3B8" stroke={COR.azulEscuro} strokeWidth={6} />
      {/* barra de tempo */}
      <rect x={60} y={20} width={150 * tempo} height={26} rx={13} fill={COR.azulClaro} />
      {extra && <rect x={60 + 150 * tempo} y={20} width={75 * tempo} height={26} rx={13} fill={COR.amarelo} />}
    </svg>
  </div>
);

const PicoFim: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const parte1 = 1 - cl(p, 0.38, 0.42);
  const desenho = cl(p, 0.03, 0.2);
  const kPico = mola(fala * 0.22);
  const kFim = mola(fala * 0.32);
  const kMem = mola(fala * 0.36);
  const parte2 = cl(p, 0.4, 0.44);
  const kA = mola(fala * 0.45);
  const kB = mola(fala * 0.5);
  const tempo = cl(p, 0.5, 0.62);
  const escolha = mola(fala * 0.8);

  const n = PTS.length;
  const visiveis = Math.max(2, Math.ceil(desenho * n));
  const d = Array.from({ length: visiveis }, (_, i) => `${i ? "L" : "M"}${ponto(i).x} ${ponto(i).y}`).join(" ");
  const pico = ponto(4);
  const fim = ponto(n - 1);
  const memY = GY + GH - ((PTS[4] + PTS[n - 1]) / 2) * GH;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="REGRA DO PICO E DO FIM" />
      </div>
      {parte1 > 0.01 && (
        <AbsoluteFill style={{ opacity: parte1 }}>
          <svg width={1920} height={1080}>
            <path d={`M${GX} ${GY} L${GX} ${GY + GH} L${GX + GW} ${GY + GH}`} stroke={`${COR.branco}66`} strokeWidth={4} fill="none" />
            <text x={GX - 20} y={GY - 20} fill={`${COR.branco}AA`} fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={26}>DESCONFORTO</text>
            <text x={GX + GW - 100} y={GY + GH + 44} fill={`${COR.branco}AA`} fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={26}>TEMPO</text>
            <path d={d} stroke={COR.ciano} strokeWidth={10} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <g transform={`translate(${pico.x} ${pico.y}) scale(${kPico})`}>
              <circle r={22} fill={COR.vermelho} />
              <text y={-38} textAnchor="middle" fill={COR.vermelho} fontFamily={FONTE_TITULO} fontWeight={800} fontSize={40}>PICO</text>
            </g>
            <g transform={`translate(${fim.x} ${fim.y}) scale(${kFim})`}>
              <circle r={22} fill={COR.amarelo} />
              <text y={-38} textAnchor="middle" fill={COR.amarelo} fontFamily={FONTE_TITULO} fontWeight={800} fontSize={40}>FIM</text>
            </g>
            <g opacity={kMem}>
              <path d={`M${GX} ${memY} L${GX + GW} ${memY}`} stroke={COR.branco} strokeWidth={5} strokeDasharray="18 14" />
              <text x={GX + 30} y={memY - 18} fill={COR.branco} fontFamily={FONTE_TITULO} fontWeight={800} fontSize={34}>O QUE FICA NA MEMÓRIA</text>
            </g>
          </svg>
        </AbsoluteFill>
      )}
      {parte2 > 0.01 && (
        <AbsoluteFill style={{ opacity: parte2, alignItems: "center", paddingTop: 150 }}>
          <div style={{ display: "flex", gap: 80 }}>
            <Mao titulo="VERSÃO CURTA" detalhe="60 s de água a 14 °C" tempo={tempo} extra={false} k={kA} destaque={0} />
            <Mao titulo="VERSÃO LONGA" detalhe="60 s a 14 °C + 30 s a 15 °C" tempo={tempo} extra k={kB} destaque={escolha} />
          </div>
          <div style={{ marginTop: 40 }}>
            {escolha > 0.01 && <Selo texto="A MAIORIA QUIS REPETIR A LONGA" k={escolha} cor={COR.vermelho} rot={-3} />}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export default PicoFim;
