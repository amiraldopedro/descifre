/**
 * 007 — O efeito Flynn (Flynn, 1984 e 1987).
 * Fala: "E agora o dado que muda tudo. (0–.12) | Em 1984, James Flynn percebeu que as notas de QI subiam cerca de três
 *        pontos por década, em vários países. (.12–.6) | Medida com a régua de hoje, a pessoa média de cem anos atrás
 *        ficaria perto de setenta. (.6–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "glitch", p: 0.02 },
  { som: "sobe", p: 0.2 },
  { som: "pop", p: 0.45 },
  { som: "whoosh", p: 0.6 },
  { som: "mecanico", p: 0.72 },
  { som: "boom", p: 0.88 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const GX = 170, GW = 900, GY = 200, GH = 480;
const ANOS = [1920, 1940, 1960, 1980, 2000, 2020];
// QI médio medido com a régua de hoje (aprox. +3 por década)
const qi = (ano: number) => 70 + ((ano - 1920) / 10) * 3;
const gx = (ano: number) => GX + ((ano - 1920) / 100) * GW;
const gy = (v: number) => GY + GH - ((v - 60) / 50) * GH;

const Pessoa: React.FC<{ cor: string; antiga?: boolean }> = ({ cor, antiga }) => (
  <svg width={160} height={260} viewBox="0 0 160 260">
    <path d="M30 260 Q30 120 80 120 Q130 120 130 260 Z" fill={cor} stroke={COR.azulEscuro} strokeWidth={6} />
    <circle cx={80} cy={78} r={42} fill="#F1D3B8" stroke={COR.azulEscuro} strokeWidth={6} />
    {antiga && <path d="M34 52 L126 52 L114 30 L46 30 Z M20 54 L140 54" stroke={COR.azulEscuro} strokeWidth={8} fill="#3B4466" />}
  </svg>
);

const Flynn: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kGraf = mola(fala * 0.12);
  const linha = cl(p, 0.2, 0.42);
  const kSelo = mola(fala * 0.45);
  const kPessoas = mola(fala * 0.6);
  const regua = cl(p, 0.7, 0.82);
  const k70 = mola(fala * 0.86);
  const anoFim = 1920 + 100 * linha;
  const pts = ANOS.filter((a) => a <= anoFim + 0.1).map((a) => `${gx(a)} ${gy(qi(a))}`);
  if (linha > 0) pts.push(`${gx(anoFim)} ${gy(qi(anoFim))}`);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="O EFEITO FLYNN" />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: kGraf }}>
        <path d={`M${GX} ${GY} L${GX} ${GY + GH} L${GX + GW} ${GY + GH}`} stroke={`${COR.branco}66`} strokeWidth={4} fill="none" />
        {ANOS.map((a) => (
          <text key={a} x={gx(a)} y={GY + GH + 44} textAnchor="middle" fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={28} fill={`${COR.branco}AA`}>{a}</text>
        ))}
        {[70, 85, 100].map((v) => (
          <g key={v}>
            <path d={`M${GX} ${gy(v)} L${GX + GW} ${gy(v)}`} stroke={`${COR.branco}22`} strokeWidth={2} />
            <text x={GX - 16} y={gy(v) + 10} textAnchor="end" fontFamily={FONTE_TEXTO} fontWeight={800} fontSize={28} fill={`${COR.branco}AA`}>{v}</text>
          </g>
        ))}
        {pts.length > 1 && <path d={`M${pts.join(" L")}`} stroke={COR.amarelo} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {linha > 0 && <circle cx={gx(anoFim)} cy={gy(qi(anoFim))} r={14} fill={COR.amarelo} />}
      </svg>
      <div style={{ position: "absolute", left: 230, top: 210 }}>
        {kSelo > 0.01 && <Selo texto="+3 POR DÉCADA" k={kSelo} cor={COR.vermelho} rot={-5} />}
      </div>
      {/* hoje x cem anos atrás, medidos com a mesma régua */}
      <div style={{ position: "absolute", left: 1180, top: 210, display: "flex", gap: 60, alignItems: "flex-end", transform: `scale(${kPessoas})`, opacity: Math.min(1, kPessoas * 2) }}>
        {[
          { rot: "1920", cor: "#8E99C2", antiga: true, val: "~70", mostra: k70 },
          { rot: "HOJE", cor: COR.azulClaro, antiga: false, val: "100", mostra: regua },
        ].map((c) => (
          <div key={c.rot} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 80, color: c.antiga ? COR.amarelo : COR.branco, opacity: c.mostra, height: 100 }}>{c.val}</div>
            <Pessoa cor={c.cor} antiga={c.antiga} />
            <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: COR.ciano, marginTop: 10 }}>{c.rot}</div>
          </div>
        ))}
        {/* a régua de hoje deslizando por cima */}
        <div style={{ position: "absolute", left: -40 + (1 - regua) * 300, top: 110, width: 470, height: 40, borderRadius: 8, background: COR.amarelo, opacity: regua > 0 ? 0.9 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 22, color: COR.azulEscuro }}>
          RÉGUA DE HOJE
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Flynn;
