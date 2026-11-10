/**
 * 007 — A régua do QI (curva normal: média 100, desvio 15).
 * Fala: "Primeiro, a régua. (0–.08) | O teste é calibrado pra média ser cem. (.08–.25) | Cerca de dois terços das pessoas
 *        ficam entre 85 e 115. (.25–.52) | Só uns dois por cento passam de 130. (.52–.7)
 *        | E 160? Mais ou menos uma pessoa em cada trinta mil. (.7–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "ding", p: 0.14 },
  { som: "sobe", p: 0.3 },
  { som: "pop", p: 0.56 },
  { som: "zap", p: 0.76 },
  { som: "brilho", p: 0.85 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const X0 = 180, X1 = 1740, Y0 = 760, ALT = 480;
const MIN = 50, MAX = 175;
const px = (qi: number) => X0 + ((qi - MIN) / (MAX - MIN)) * (X1 - X0);
const py = (qi: number) => Y0 - Math.exp(-0.5 * ((qi - 100) / 15) ** 2) * ALT;
const caminho = (de: number, ate: number, fechar = false) => {
  const pts: string[] = [];
  for (let q = de; q <= ate + 0.01; q += 1) pts.push(`${px(q).toFixed(1)} ${py(q).toFixed(1)}`);
  const d = `M${pts.join(" L")}`;
  return fechar ? `${d} L${px(ate)} ${Y0} L${px(de)} ${Y0} Z` : d;
};

const Curva: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const desenho = cl(p, 0.02, 0.18);
  const kMedia = mola(fala * 0.14);
  const kMeio = cl(p, 0.3, 0.38);
  const kTopo = cl(p, 0.56, 0.62);
  const k160 = mola(fala * 0.76);
  const kSelo = mola(fala * 0.85);
  const ate = MIN + (MAX - MIN) * desenho;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="A RÉGUA DO QI" />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path d={`M${X0} ${Y0} L${X1} ${Y0}`} stroke={`${COR.branco}66`} strokeWidth={4} />
        {[55, 70, 85, 100, 115, 130, 145, 160].map((q) => (
          <g key={q} opacity={cl(ate, q - 5, q)}>
            <path d={`M${px(q)} ${Y0} L${px(q)} ${Y0 + 14}`} stroke={`${COR.branco}88`} strokeWidth={4} />
            <text x={px(q)} y={Y0 + 50} textAnchor="middle" fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={30} fill={q === 100 ? COR.amarelo : `${COR.branco}AA`}>{q}</text>
          </g>
        ))}
        {/* faixa do meio: 85–115 */}
        <path d={caminho(85, 115, true)} fill={COR.ciano} opacity={0.55 * kMeio} />
        <text x={px(100)} y={py(100) + 170} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={74} fill={COR.azulEscuro} opacity={kMeio}>68%</text>
        {/* acima de 130 */}
        <path d={caminho(130, 175, true)} fill={COR.vermelho} opacity={0.8 * kTopo} />
        <g opacity={kTopo}>
          <path d={`M${px(138)} ${py(138) - 10} L${px(142)} ${Y0 - 230}`} stroke={COR.vermelho} strokeWidth={4} />
          <text x={px(142)} y={Y0 - 245} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={56} fill={COR.vermelho}>2%</text>
        </g>
        <path d={caminho(MIN, ate)} stroke={COR.branco} strokeWidth={8} fill="none" strokeLinejoin="round" />
        {/* média */}
        <g opacity={kMedia}>
          <path d={`M${px(100)} ${Y0} L${px(100)} ${py(100) - 20}`} stroke={COR.amarelo} strokeWidth={5} strokeDasharray="14 10" />
          <text x={px(100)} y={py(100) - 40} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={44} fill={COR.amarelo}>MÉDIA 100</text>
        </g>
        {/* 160 */}
        <g transform={`translate(${px(160)} ${Y0 - 6}) scale(${k160})`}>
          <circle r={16} fill={COR.amarelo} />
          <circle r={34 + Math.sin(f / 4) * 6} fill="none" stroke={COR.amarelo} strokeWidth={4} />
          <path d="M0 -40 L0 -150" stroke={COR.amarelo} strokeWidth={4} />
          <text y={-165} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={48} fill={COR.branco}>160</text>
        </g>
      </svg>
      <div style={{ position: "absolute", top: 260, left: 1240 }}>
        {kSelo > 0.01 && <Selo texto="1 EM 30 MIL" k={kSelo} cor={COR.azulClaro} rot={-5} />}
      </div>
    </AbsoluteFill>
  );
};

export default Curva;
