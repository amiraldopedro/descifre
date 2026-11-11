/**
 * Ilusão dos passos (Anstis, 2001): dois caminhões andam na MESMA velocidade o tempo todo,
 * mas sobre listras pretas e brancas parecem frear e acelerar, um de cada vez.
 * props.fase: "teste" (com listras) | "revelar" (as listras somem aos poucos: dá pra ver que andam juntos)
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

export const vertical = true;
export const sons: SomCena[] = [{ som: "whoosh", p: 0.02 }, { som: "brilho", p: 0.35, fase: "revelar" }];

const Caminhao: React.FC<{ x: number; y: number; cor: string; w: number }> = ({ x, y, cor, w }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={0} y={0} width={w * 0.7} height={w * 0.32} rx={6} fill={cor} />
    <rect x={w * 0.7} y={w * 0.08} width={w * 0.3} height={w * 0.24} rx={8} fill={cor} />
    <rect x={w * 0.78} y={w * 0.11} width={w * 0.16} height={w * 0.09} rx={3} fill="#CFEFFF" />
    {[0.15, 0.55, 0.85].map((k) => <circle key={k} cx={w * k} cy={w * 0.34} r={w * 0.06} fill="#222" />)}
  </g>
);

const Passos: React.FC<PropsSobMedida> = ({ fala, props }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const revelado = props.fase === "revelado";
  const revelar = props.fase === "revelar" || revelado;
  const listras = revelado ? 0 : revelar ? interpolate(f, [fala * 0.25, fala * 0.55], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const faixa = W / 16;
  const w = W * 0.34;
  const vel = W / 420; // px por frame, constante
  const x = ((f * vel + W * 0.25) % (W + w)) - w;
  const yA = H * 0.34, yB = H * 0.5;
  return (
    <AbsoluteFill style={{ background: "#808080" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g opacity={listras}>
          {Array.from({ length: 17 }).map((_, i) => <rect key={i} x={i * faixa} y={0} width={faixa / 2} height={H} fill="#000" />)}
          {Array.from({ length: 17 }).map((_, i) => <rect key={"b" + i} x={i * faixa + faixa / 2} y={0} width={faixa / 2} height={H} fill="#FFF" />)}
        </g>
        <Caminhao x={x} y={yA} cor="#FFD84D" w={w} />
        <Caminhao x={x} y={yB} cor="#2A3FCF" w={w} />
        {revelar && listras < 0.5 && <line x1={x + w / 2} y1={yA - 30} x2={x + w / 2} y2={yB + w * 0.45} stroke={COR.vermelho} strokeWidth={6} strokeDasharray="14 10" />}
      </svg>
      <div style={{ position: "absolute", top: H * 0.12, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: W * 0.075, color: COR.branco, textShadow: "0 4px 0 #000, 0 0 30px #000" }}>
        {revelar && listras < 0.5 ? "OS DOIS ANDAM JUNTOS" : "QUAL ESTÁ FREANDO?"}
      </div>
    </AbsoluteFill>
  );
};
export default Passos;
