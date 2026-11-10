/**
 * Cena sob medida 2D — "O experimento das linhas de Asch".
 * Uma linha de referência, três opções. Sete pessoas respondem "C" (errado),
 * a última (você) hesita... e cede. Resposta certa: B.
 */
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

// proporções da fala: as respostas começam quando a narração fala dos "sete atores"
const P0 = 0.5; // primeira resposta
const PASSO = 0.045; // entre respostas
const N = 7;
const P_VOCE = P0 + N * PASSO + 0.03; // ~0.845: "você" hesita
const P_CEDE = P_VOCE + 0.1; // e cede

export const sons: SomCena[] = [
  { som: "pop", t: 0.2 },
  { som: "click", p: 0.5 }, { som: "click", p: 0.545 }, { som: "click", p: 0.59 }, { som: "click", p: 0.635 },
  { som: "click", p: 0.68 }, { som: "click", p: 0.725 }, { som: "click", p: 0.77 },
  { som: "tique", p: 0.845 },
  { som: "glitch", p: 0.945 },
];

const LinhasAsch: React.FC<PropsSobMedida> = ({ vertical, fala }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = f / fps;
  const seg = (p: number) => (p * fala) / fps; // proporção da fala -> segundos
  const T0 = seg(P0);
  const T_VOCE = seg(P_VOCE);
  const T_CEDE = seg(P_CEDE);
  const passo = seg(PASSO);
  const mola = (t: number) => spring({ frame: f - t * fps, fps, config: { damping: 12, mass: 0.6 } });
  const linhas = [{ l: "A", h: 170 }, { l: "B", h: 260 }, { l: "C", h: 330 }];
  const k0 = mola(0.1);
  const voceDuvida = s > T_VOCE && s < T_CEDE;
  const voceCede = s >= T_CEDE;
  const escala = vertical ? 0.82 : 1;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: vertical ? 300 : 180 }}>
      <div style={{ transform: `scale(${escala})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 50 }}>
        {/* cartões */}
        <div style={{ display: "flex", gap: vertical ? 40 : 90, flexDirection: vertical ? "column" : "row", alignItems: "center", opacity: k0, transform: `translateY(${(1 - k0) * 40}px)` }}>
          <Cartao titulo="REFERÊNCIA">
            <Linha h={260} cor={COR.amarelo} />
          </Cartao>
          <Cartao titulo="QUAL É IGUAL?">
            <div style={{ display: "flex", gap: 60, alignItems: "flex-end" }}>
              {linhas.map(({ l, h }) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <Linha h={h} cor={voceCede && l === "C" ? COR.vermelho : l === "B" && s > T_CEDE + 1 ? COR.ciano : COR.branco} />
                  <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, color: COR.branco }}>{l}</div>
                </div>
              ))}
            </div>
          </Cartao>
        </div>
        {/* participantes */}
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center", maxWidth: vertical ? 900 : 1500 }}>
          {Array.from({ length: N + 1 }).map((_, i) => {
            const voce = i === N;
            const t = voce ? T_VOCE : T0 + i * passo;
            const k = mola(t);
            const texto = voce ? (voceCede ? "C..." : voceDuvida ? "?" : "") : "C";
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    minWidth: 86, height: 70, borderRadius: 20, padding: "0 14px",
                    background: voce ? COR.vermelho : COR.branco, color: voce ? COR.branco : COR.azulEscuro,
                    fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transform: `scale(${s >= t ? k : 0}) translateY(${voceDuvida ? Math.sin(f / 2) * 3 : 0}px)`,
                  }}
                >
                  {texto}
                </div>
                <svg width={90} height={110} viewBox="0 0 90 110">
                  <circle cx={45} cy={32} r={26} fill={voce ? COR.vermelho : COR.azulClaro} stroke={COR.azulEscuro} strokeWidth={6} />
                  <path d="M10 108 Q10 64 45 64 Q80 64 80 108 Z" fill={voce ? COR.vermelho : COR.azulClaro} stroke={COR.azulEscuro} strokeWidth={6} />
                </svg>
                <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: voce ? COR.amarelo : "transparent" }}>VOCÊ</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Cartao: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <div
    style={{
      background: "rgba(7,15,51,.8)", border: `3px solid ${COR.ciano}55`, borderRadius: 30,
      padding: "28px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, minHeight: 420,
    }}
  >
    <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: COR.ciano }}>{titulo}</div>
    <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>{children}</div>
  </div>
);

const Linha: React.FC<{ h: number; cor: string }> = ({ h, cor }) => (
  <div style={{ width: 18, height: h, borderRadius: 9, background: cor, boxShadow: `0 0 20px ${cor}88` }} />
);

export default LinhasAsch;
