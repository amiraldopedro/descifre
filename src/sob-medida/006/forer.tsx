/**
 * 006 — A revelação: o experimento de Bertram Forer (1949).
 * Fala: "Em 1949, o psicólogo Bertram Forer aplicou um teste de personalidade nos seus alunos. (0–.24)
 *        | Depois, entregou a cada um uma análise personalizada. (.24–.4) | De zero a cinco, a nota média de precisão
 *        foi quatro vírgula vinte e seis. (.4–.62) | Só que todos tinham recebido exatamente o mesmo texto, (.62–.82)
 *        | tirado em boa parte de um livro de astrologia. (.82–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "pop", p: 0.26 }, { som: "pop", p: 0.29 }, { som: "pop", p: 0.32 }, { som: "pop", p: 0.35 },
  { som: "sobe", p: 0.44 },
  { som: "ding", p: 0.58 },
  { som: "glitch", p: 0.66 },
  { som: "boom", p: 0.74 },
  { som: "brilho", p: 0.86 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const NOMES = ["ANA", "BETO", "CAIO", "DANI", "EDU", "FÊ"];

const Aluno: React.FC = () => (
  <svg width={120} height={120} viewBox="0 0 120 120">
    <path d="M20 120 Q20 70 60 70 Q100 70 100 120 Z" fill={COR.azulClaro} stroke={COR.azulEscuro} strokeWidth={5} />
    <circle cx={60} cy={42} r={28} fill="#F1D3B8" stroke={COR.azulEscuro} strokeWidth={5} />
  </svg>
);

const Documento: React.FC<{ nome: string; k: number; igual: number }> = ({ nome, k, igual }) => (
  <div style={{ width: 210, height: 270, background: COR.branco, borderRadius: 16, padding: 16, transform: `scale(${k})`, opacity: Math.min(1, k * 2), boxShadow: igual > 0.5 ? `0 0 30px ${COR.vermelho}AA` : "0 12px 30px rgba(0,0,0,.4)", border: igual > 0.5 ? `5px solid ${COR.vermelho}` : "5px solid transparent" }}>
    <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 16, color: COR.azul }}>ANÁLISE PESSOAL</div>
    <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 26, color: COR.azulEscuro, marginTop: 4 }}>{nome}</div>
    {[90, 75, 85, 60, 88, 70, 80].map((w, i) => (
      <div key={i} style={{ height: 11, width: `${w}%`, borderRadius: 6, background: igual > 0.5 && i < 4 ? COR.vermelho : "#C5CBE0", marginTop: 12 }} />
    ))}
  </div>
);

const Forer: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const alunos = 1 - cl(p, 0.22, 0.26);
  const nota = cl(p, 0.44, 0.58) * 4.26;
  const kNota = mola(fala * 0.42);
  const igual = cl(p, 0.64, 0.7);
  const kSelo = mola(fala * 0.74);
  const kLivro = mola(fala * 0.85);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="BERTRAM FORER · 1949" />
      </div>
      <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", gap: 26 }}>
        {NOMES.map((n, i) => {
          const kA = mola(fala * (0.03 + i * 0.03));
          const kD = mola(fala * (0.26 + i * 0.025));
          return (
            <div key={n} style={{ position: "relative", width: 220, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {alunos > 0.01 && (
                <div style={{ position: "absolute", transform: `scale(${kA})`, opacity: alunos, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Aluno />
                  <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 26, color: COR.branco }}>{n}</div>
                </div>
              )}
              {p > 0.24 && <Documento nome={n} k={kD} igual={igual} />}
            </div>
          );
        })}
      </div>
      {/* a nota de precisão */}
      <div style={{ position: "absolute", top: 470, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 30, transform: `scale(${kNota})`, opacity: Math.min(1, kNota * 2) * (1 - cl(p, 0.82, 0.86) * 0.6) }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 34, color: COR.ciano }}>PRECISÃO</div>
        <div style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const cheia = Math.max(0, Math.min(1, nota - i));
            return (
              <svg key={i} width={70} height={70} viewBox="0 0 100 100">
                <defs>
                  <clipPath id={`est${i}`}>
                    <rect width={100 * cheia} height={100} />
                  </clipPath>
                </defs>
                <path d="M50 5 L62 38 L97 38 L69 59 L79 93 L50 73 L21 93 L31 59 L3 38 L38 38 Z" fill={`${COR.branco}22`} />
                <path d="M50 5 L62 38 L97 38 L69 59 L79 93 L50 73 L21 93 L31 59 L3 38 L38 38 Z" fill={COR.amarelo} clipPath={`url(#est${i})`} />
              </svg>
            );
          })}
        </div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 80, color: COR.branco }}>{nota.toFixed(2).replace(".", ",")}</div>
      </div>
      <div style={{ position: "absolute", top: 600, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        {kSelo > 0.01 && <Selo texto="TODOS O MESMO TEXTO" k={kSelo} cor={COR.vermelho} rot={-3} />}
        {kLivro > 0.01 && (
          <div style={{ transform: `scale(${kLivro}) rotate(4deg)`, display: "flex", alignItems: "center", gap: 14, background: "#6B3FA0", padding: "14px 26px", borderRadius: 18, border: `4px solid ${COR.amarelo}` }}>
            <svg width={56} height={56} viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={26} fill={COR.amarelo} />
              {Array.from({ length: 8 }).map((_, i) => (
                <path key={i} d="M50 6 L50 18" stroke={COR.amarelo} strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 45} 50 50)`} />
              ))}
            </svg>
            <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: COR.branco }}>LIVRO DE ASTROLOGIA</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default Forer;
