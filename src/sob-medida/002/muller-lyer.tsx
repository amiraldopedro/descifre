/**
 * Prova 1 — Ilusão de Müller-Lyer.
 * fase "pergunta": "Olha essas duas linhas. Qual é a maior: a de cima ou a de baixo? Responde rápido." (+ pausa 3 s com contador)
 * fase "revelacao": "Agora olha de novo, sem as setinhas. As duas têm exatamente o mesmo tamanho. É a ilusão de Müller-Lyer..."
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Contador, Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "pop", p: 0.1, fase: "pergunta" },
  { som: "pop", p: 0.2, fase: "pergunta" },
  { som: "tique", fim: 3, fase: "pergunta" }, { som: "tique", fim: 2, fase: "pergunta" }, { som: "tique", fim: 1, fase: "pergunta" },
  { som: "desce", p: 0.1, fase: "revelacao" },
  { som: "sobe", p: 0.3, fase: "revelacao" },
  { som: "boom", p: 0.5, fase: "revelacao" },
];

const L = 640; // comprimento das duas linhas
const cl = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Seta: React.FC<{ x: number; y: number; dir: 1 | -1; aberta: boolean; op: number }> = ({ x, y, dir, aberta, op }) => {
  // aberta = ">—<" (linha parece maior); fechada = "<—>"
  const d = aberta ? -dir : dir;
  const a = 70;
  return (
    <path d={`M${x + d * a} ${y - a} L${x} ${y} L${x + d * a} ${y + a}`} fill="none" stroke={COR.branco} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={op} />
  );
};

const MullerLyer: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const revelar = props.fase === "revelacao";
  const k1 = revelar ? 1 : mola(fala * 0.1);
  const k2 = revelar ? 1 : mola(fala * 0.2);
  const semSetas = revelar ? cl(f, fala * 0.08, fala * 0.22) : 0;
  const regua = revelar ? cl(f, fala * 0.3, fala * 0.45) : 0;
  const juntar = revelar ? cl(f, fala * 0.45, fala * 0.55) : 0;
  const selo = revelar ? mola(fala * 0.5) : 0;
  const x0 = 960 - L / 2;
  const y1 = 330 + juntar * 120;
  const y2 = 600 - juntar * 120;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 80 }}>
        <Rotulo texto="PROVA 1 DE 7" />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {/* linha de cima: setas fechadas <—> */}
        <g opacity={k1} transform={`translate(0 ${(1 - k1) * -40})`}>
          <line x1={x0} y1={y1} x2={x0 + L} y2={y1} stroke={revelar ? COR.amarelo : COR.branco} strokeWidth={16} strokeLinecap="round" />
          <Seta x={x0} y={y1} dir={1} aberta={false} op={1 - semSetas} />
          <Seta x={x0 + L} y={y1} dir={-1} aberta={false} op={1 - semSetas} />
        </g>
        {/* linha de baixo: setas abertas >—< */}
        <g opacity={k2} transform={`translate(0 ${(1 - k2) * 40})`}>
          <line x1={x0} y1={y2} x2={x0 + L} y2={y2} stroke={revelar ? COR.amarelo : COR.branco} strokeWidth={16} strokeLinecap="round" />
          <Seta x={x0} y={y2} dir={1} aberta op={1 - semSetas} />
          <Seta x={x0 + L} y={y2} dir={-1} aberta op={1 - semSetas} />
        </g>
        {/* guias verticais que provam: começam e terminam no mesmo lugar */}
        {[x0, x0 + L].map((x) => (
          <line key={x} x1={x} y1={260} x2={x} y2={260 + 410 * regua} stroke={COR.ciano} strokeWidth={5} strokeDasharray="14 12" />
        ))}
        {!revelar && (
          <>
            <text x={x0 - 120} y={y1 + 18} fontFamily={FONTE_TITULO} fontWeight={800} fontSize={56} fill={COR.vermelho} opacity={k1}>A</text>
            <text x={x0 - 120} y={y2 + 18} fontFamily={FONTE_TITULO} fontWeight={800} fontSize={56} fill={COR.azulClaro} opacity={k2}>B</text>
          </>
        )}
      </svg>
      {revelar && (
        <div style={{ position: "absolute", top: 700 }}>
          <Selo texto="MESMO TAMANHO!" k={selo} cor={COR.vermelho} />
        </div>
      )}
      {!revelar && <Contador fala={fala} dur={dur} texto="QUAL É MAIOR?" y={760} />}
    </AbsoluteFill>
  );
};

export default MullerLyer;
