/**
 * 005 — A mensagem de reparo de uma linha.
 * Fala: "Então aqui vai a mensagem de uma linha. (0–.22) | No mesmo dia, manda: desculpa pelo jeito que eu falei. (.22–.6)
 *        | Eu tava cansado, e você não merecia isso. (.6–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "click", p: 0.3 }, { som: "click", p: 0.38 }, { som: "click", p: 0.46 },
  { som: "pop", p: 0.56 },
  { som: "click", p: 0.68 }, { som: "click", p: 0.76 }, { som: "click", p: 0.84 },
  { som: "pop", p: 0.9 },
  { som: "brilho", p: 0.97 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const MSG1 = "Desculpa pelo jeito que eu falei.";
const MSG2 = "Eu tava cansado, e você não merecia isso.";

const Coracao: React.FC<{ tam: number; cor?: string }> = ({ tam, cor = COR.vermelho }) => (
  <svg width={tam} height={tam} viewBox="0 0 100 100" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M50 88 L14 52 Q0 36 12 20 Q28 4 50 26 Q72 4 88 20 Q100 36 86 52 Z" fill={cor} />
  </svg>
);

const Balao: React.FC<{ texto: string; meu: boolean; k: number; vistos?: boolean }> = ({ texto, meu, k, vistos }) => (
  <div style={{ display: "flex", justifyContent: meu ? "flex-end" : "flex-start", opacity: Math.min(1, k * 3) }}>
    <div
      style={{
        maxWidth: 470, padding: "18px 24px", borderRadius: meu ? "26px 26px 6px 26px" : "26px 26px 26px 6px",
        background: meu ? COR.azulClaro : COR.branco, color: meu ? COR.branco : COR.azulEscuro,
        fontFamily: FONTE_TEXTO, fontWeight: 700, fontSize: 34, lineHeight: 1.25, transform: `scale(${0.9 + 0.1 * k})`,
      }}
    >
      {texto || " "}
      {vistos && <span style={{ fontSize: 22, color: COR.ciano, marginLeft: 10 }}>✓✓</span>}
    </div>
  </div>
);

const Mensagem: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kTel = mola(fala * 0.02);
  const t1 = MSG1.slice(0, Math.round(cl(p, 0.26, 0.54) * MSG1.length));
  const t2 = MSG2.slice(0, Math.round(cl(p, 0.64, 0.88) * MSG2.length));
  const env1 = p > 0.56;
  const env2 = p > 0.9;
  const kResp = mola(fala * 0.96);
  const digitando = p > 0.24 && !env2;
  const txtInput = env1 ? (env2 ? "" : t2) : t1;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 40, transform: `translateY(${(1 - kTel) * 200}px)`, opacity: kTel }}>
        <div style={{ width: 600, height: 760, borderRadius: 60, background: "#05091F", border: `10px solid #2A3E86`, padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 12px 18px", borderBottom: `2px solid ${COR.branco}22` }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: COR.vermelho, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Coracao tam={36} cor={COR.branco} />
            </div>
            <div>
              <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 34, color: COR.branco }}>Mãe</div>
              <div style={{ fontFamily: FONTE_TEXTO, fontSize: 22, color: COR.ciano }}>{p > 0.24 ? "online" : "visto por último hoje"}</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 16, padding: "16px 8px" }}>
            {env1 && <Balao texto={MSG1} meu k={mola(fala * 0.56)} vistos />}
            {env2 && <Balao texto={MSG2} meu k={mola(fala * 0.9)} vistos />}
            {kResp > 0.01 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: Math.min(1, kResp * 3) }}>
                <Balao texto="Tá tudo bem, filho." meu={false} k={kResp} />
                <div style={{ transform: `scale(${kResp * (1 + Math.sin(f / 4) * 0.1)})` }}>
                  <Coracao tam={60} />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 6px 4px" }}>
            <div style={{ flex: 1, minHeight: 64, borderRadius: 32, background: "#14318F", padding: "14px 22px", fontFamily: FONTE_TEXTO, fontSize: 28, color: COR.branco, lineHeight: 1.2 }}>
              {txtInput}
              {digitando && Math.floor(f / 8) % 2 === 0 && <span style={{ color: COR.ciano }}>|</span>}
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: COR.ciano, display: "flex", alignItems: "center", justifyContent: "center", }}><svg width={30} height={30} viewBox="0 0 30 30"><path d="M4 4 L28 15 L4 26 L9 15 Z" fill={COR.azulEscuro} /></svg></div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Mensagem;
