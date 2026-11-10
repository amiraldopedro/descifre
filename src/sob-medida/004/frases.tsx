/**
 * 004 — Armadilha 2: frases pseudo-profundas (Pennycook e colegas, 2015).
 * fase "pergunta": "Qual dessas frases é mais profunda? (0–.18) | A: água mole em pedra dura, tanto bate até que fura. (.18–.55)
 *                   | B: a consciência infinita desperta a energia oculta do agora. (.55–1)"  (+ contagem)
 * fase "revelar":  "Se a B te pareceu mais sábia, cuidado. (0–.35) | Ela não quer dizer nada. (.35–.6)
 *                   | Foi montada só com palavras bonitas. (.6–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Contador, Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02, fase: "pergunta" },
  { som: "pop", p: 0.18, fase: "pergunta" },
  { som: "brilho", p: 0.55, fase: "pergunta" },
  { som: "tique", fim: 3, fase: "pergunta" }, { som: "tique", fim: 2, fase: "pergunta" }, { som: "tique", fim: 1, fase: "pergunta" },
  { som: "click", p: 0.05, fase: "revelar" },
  { som: "boom", p: 0.38, fase: "revelar" },
  { som: "mecanico", p: 0.62, fase: "revelar" },
  { som: "pop", p: 0.9, fase: "revelar" },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const PALAVRAS = ["A CONSCIÊNCIA", "INFINITA", "DESPERTA", "A ENERGIA", "OCULTA", "DO AGORA"];
// ordem embaralhada (continua "soando profunda")
const EMBARALHADA = [3, 1, 2, 0, 4, 5];

const Cartao: React.FC<{ letra: string; texto: string; k: number; brilhante?: boolean; apagar?: number; destaque?: number }> = ({ letra, texto, k, brilhante, apagar = 0, destaque = 0 }) => (
  <div
    style={{
      width: 700, height: 380, borderRadius: 34, padding: 40, position: "relative", display: "flex", alignItems: "center",
      background: brilhante ? `linear-gradient(160deg, #6B3FA0, ${COR.vermelho} 55%, ${COR.amarelo})` : "#0E1C55",
      border: `5px solid ${brilhante ? COR.amarelo : COR.ciano + "88"}`, transform: `translateY(${(1 - k) * 70}px) scale(${1 + destaque * 0.04})`,
      opacity: k * (1 - apagar), boxShadow: brilhante ? `0 0 60px ${COR.vermelho}66` : "none",
    }}
  >
    <div style={{ position: "absolute", top: -34, left: 34, width: 70, height: 70, borderRadius: 35, background: COR.branco, color: COR.azulEscuro, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{letra}</div>
    <div style={{ fontFamily: brilhante ? FONTE_TITULO : FONTE_TEXTO, fontWeight: 800, fontSize: brilhante ? 44 : 46, color: COR.branco, lineHeight: 1.3, fontStyle: brilhante ? "normal" : "italic" }}>
      {texto}
    </div>
  </div>
);

const Frases: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const revelar = props.fase === "revelar";
  const q = (p: number) => fala * p;
  const p = f / Math.max(1, fala);

  if (!revelar) {
    const kA = mola(q(0.18));
    const kB = mola(q(0.55));
    return (
      <AbsoluteFill>
        <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
          <Rotulo texto="ARMADILHA 2 DE 4 · QUAL É MAIS PROFUNDA?" />
        </div>
        <div style={{ position: "absolute", top: 220, width: "100%", display: "flex", justifyContent: "center", gap: 80 }}>
          <Cartao letra="A" texto="“Água mole em pedra dura, tanto bate até que fura.”" k={kA} />
          <Cartao letra="B" texto="A consciência infinita desperta a energia oculta do agora." k={kB} brilhante />
        </div>
        <Contador fala={fala} dur={dur} y={720} texto="A OU B?" />
      </AbsoluteFill>
    );
  }

  // revelar: o cartão B se desmancha em peças soltas, que se recombinam e continuam "soando profundas"
  const solta = cl(p, 0.1, 0.36);
  const kVazia = mola(q(0.38));
  const mistura = cl(p, 0.62, 0.8);
  const kSelo = mola(q(0.88));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="ARMADILHA 2 DE 4" />
      </div>
      <div style={{ position: "absolute", top: 220, left: 180 }}>
        <Cartao letra="A" texto="“Água mole em pedra dura, tanto bate até que fura.”" k={1} apagar={0.55} />
      </div>
      <div style={{ position: "absolute", top: 220, left: 1040, width: 700, height: 380 }}>
        {PALAVRAS.map((w, i) => {
          const linha = Math.floor(i / 2);
          const x0 = (i % 2) * 330 + 30;
          const y0 = linha * 110 + 40;
          const alvoI = EMBARALHADA.indexOf(i);
          const x1 = (alvoI % 2) * 330 + 30;
          const y1 = Math.floor(alvoI / 2) * 110 + 40;
          const dx = (random(`fx${i}`) - 0.5) * 140 * solta * (1 - mistura);
          const dy = (random(`fy${i}`) - 0.5) * 120 * solta * (1 - mistura);
          const x = x0 + (x1 - x0) * mistura + dx;
          const y = y0 + (y1 - y0) * mistura + dy;
          return (
            <div
              key={w}
              style={{
                position: "absolute", left: x, top: y, transform: `rotate(${(random(`fr${i}`) - 0.5) * 30 * solta * (1 - mistura)}deg)`,
                fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 38, color: COR.azulEscuro, background: COR.amarelo,
                padding: "8px 20px", borderRadius: 14, whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,.4)",
              }}
            >
              {w}
            </div>
          );
        })}
        <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", justifyContent: "center" }}>
          {kVazia > 0.01 && mistura < 0.5 && <Selo texto="VAZIA" k={kVazia} cor={COR.vermelho} rot={-10} style={{ fontSize: 90 }} />}
        </div>
      </div>
      <div style={{ position: "absolute", top: 660, width: "100%", display: "flex", justifyContent: "center" }}>
        {kSelo > 0.01 && <Selo texto="EMBARALHE E CONTINUA “PROFUNDA”" k={kSelo} cor={COR.azulClaro} rot={-3} style={{ fontSize: 50 }} />}
      </div>
    </AbsoluteFill>
  );
};

export default Frases;
