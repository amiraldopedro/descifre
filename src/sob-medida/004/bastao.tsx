/**
 * 004 — Armadilha 1: o taco e a bola (Frederick, 2005).
 * fase "pergunta": "Um taco e uma bola custam, juntos, um real e dez centavos. (0–.38) | O taco custa um real a mais
 *                   que a bola. (.38–.7) | Quanto custa a bola? (.7–1)"  (+ pausa com contagem)
 * fase "revelar":  "Se você pensou dez centavos, bem-vindo ao clube. (0–.25) | Mas aí o taco custaria um real e dez,
 *                   e os dois juntos dariam um real e vinte. (.25–.72) | A resposta certa é cinco centavos. (.72–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Contador, Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02, fase: "pergunta" },
  { som: "pop", p: 0.12, fase: "pergunta" },
  { som: "pop", p: 0.45, fase: "pergunta" },
  { som: "ding", p: 0.75, fase: "pergunta" },
  { som: "tique", fim: 3, fase: "pergunta" }, { som: "tique", fim: 2, fase: "pergunta" }, { som: "tique", fim: 1, fase: "pergunta" },
  { som: "pop", p: 0.04, fase: "revelar" },
  { som: "pop", p: 0.36, fase: "revelar" },
  { som: "glitch", p: 0.58, fase: "revelar" },
  { som: "zap", p: 0.74, fase: "revelar" },
  { som: "brilho", p: 0.8, fase: "revelar" },
];

const Etiqueta: React.FC<{ texto: string; k: number; cor: string; corTexto?: string }> = ({ texto, k, cor, corTexto = COR.azulEscuro }) => (
  <div
    style={{
      fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: corTexto, background: cor, padding: "10px 34px",
      borderRadius: 20, transform: `scale(${k}) rotate(-4deg)`, opacity: Math.min(1, k * 2), boxShadow: "0 12px 30px rgba(0,0,0,.4)", whiteSpace: "nowrap",
    }}
  >
    {texto}
  </div>
);

const Taco: React.FC = () => (
  <svg width={520} height={220} viewBox="0 0 520 220">
    <path d="M20 150 L60 120 L470 40 Q505 36 508 62 Q512 88 480 98 L80 170 L40 182 Q14 184 20 150 Z" fill="#C98B4E" stroke={COR.azulEscuro} strokeWidth={8} />
    <path d="M30 150 L80 132" stroke={COR.vermelho} strokeWidth={22} strokeLinecap="round" />
  </svg>
);

const Bola: React.FC<{ giro: number }> = ({ giro }) => (
  <svg width={200} height={200} viewBox="0 0 200 200">
    <g transform={`rotate(${giro} 100 100)`}>
      <circle cx={100} cy={100} r={86} fill={COR.branco} stroke={COR.azulEscuro} strokeWidth={8} />
      <path d="M40 40 Q90 100 40 160 M160 40 Q110 100 160 160" stroke={COR.vermelho} strokeWidth={7} fill="none" strokeDasharray="10 8" />
    </g>
  </svg>
);

const Bastao: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const revelar = props.fase === "revelar";
  const q = (p: number) => fala * p;
  const kObj = mola(revelar ? -10 : q(0.02));

  // pergunta
  const kTotal = mola(q(0.12));
  const kRegra = mola(q(0.45));
  const kInterr = mola(q(0.75));
  // revelar
  const errado = revelar && f < q(0.74);
  const kB10 = mola(q(0.04));
  const kT110 = mola(q(0.36));
  const kSoma = mola(q(0.58));
  const kCerto = mola(q(0.74));
  const kSelo = mola(q(0.82));

  const etqBola = revelar ? (errado ? <Etiqueta texto="R$ 0,10" k={kB10} cor={COR.amarelo} /> : <Etiqueta texto="R$ 0,05" k={kCerto} cor={COR.ciano} />)
    : <Etiqueta texto="?" k={kInterr * (1 + Math.sin(f / 4) * 0.06)} cor={COR.amarelo} />;
  const etqTaco = revelar ? (errado ? <Etiqueta texto="R$ 1,10" k={kT110} cor={COR.amarelo} /> : <Etiqueta texto="R$ 1,05" k={kCerto} cor={COR.ciano} />) : null;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="ARMADILHA 1 DE 4" />
      </div>
      <div style={{ position: "absolute", top: 200, left: 0, width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 160, transform: `scale(${kObj})` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ height: 100, display: "flex", alignItems: "center" }}>{etqTaco}</div>
          <Taco />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ height: 100, display: "flex", alignItems: "center" }}>{etqBola}</div>
          <Bola giro={f * 2} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 600, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {!revelar && (
          <>
            <div style={{ transform: `scale(${kTotal})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 54, color: COR.branco }}>
              JUNTOS: <span style={{ color: COR.amarelo }}>R$ 1,10</span>
            </div>
            <div style={{ transform: `scale(${kRegra})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, color: COR.ciano }}>
              TACO = BOLA + R$ 1,00
            </div>
          </>
        )}
        {revelar && errado && (
          <div style={{ transform: `scale(${kSoma})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 60, color: COR.vermelho }}>
            1,10 + 0,10 = 1,20 ✗
          </div>
        )}
        {revelar && !errado && (
          <>
            <div style={{ transform: `scale(${kCerto})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 60, color: COR.ciano }}>
              1,05 + 0,05 = 1,10 ✓
            </div>
            {kSelo > 0.01 && <Selo texto="5 CENTAVOS!" k={kSelo} cor={COR.vermelho} rot={-4} />}
          </>
        )}
      </div>
      {!revelar && <Contador fala={fala} dur={dur} y={800} texto="QUANTO CUSTA?" />}
    </AbsoluteFill>
  );
};

export default Bastao;
