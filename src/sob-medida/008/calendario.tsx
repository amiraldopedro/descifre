/**
 * 008 — Stanford (1971): o plano de 14 dias, encerrado no 6º.
 * Fala: "Em poucos dias, alguns guardas começaram a humilhar os presos: contagens no meio da noite, flexões como castigo,
 *        um quartinho escuro como solitária. (0–.6) | Presos entraram em crise. (.6–.72)
 *        | No sexto dia, o experimento foi encerrado. (.72–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "click", p: 0.12 }, { som: "click", p: 0.24 }, { som: "click", p: 0.36 },
  { som: "click", p: 0.48 }, { som: "click", p: 0.6 }, { som: "click", p: 0.74 },
  { som: "boom", p: 0.8 },
];

const cl = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const MARCAS = [0.12, 0.24, 0.36, 0.48, 0.6, 0.74];
const FATOS = [
  { t: "CONTAGENS À NOITE", p: 0.16 },
  { t: "FLEXÕES DE CASTIGO", p: 0.3 },
  { t: "SOLITÁRIA ESCURA", p: 0.44 },
  { t: "PRESOS EM CRISE", p: 0.62 },
];

const Calendario: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kSelo = mola(fala * 0.8);
  const fim = p > 0.78;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="PLANO: 14 DIAS" />
      </div>
      <div style={{ position: "absolute", left: 150, top: 170, display: "grid", gridTemplateColumns: "repeat(7, 130px)", gap: 14 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const marcado = i < 6 && p >= MARCAS[i];
          const k = marcado ? mola(fala * MARCAS[i]) : 0;
          const cancelado = fim && i >= 6;
          return (
            <div key={i} style={{ position: "relative", height: 150, borderRadius: 16, background: cancelado ? "#1A2150" : COR.branco, opacity: cancelado ? 0.45 : 1, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: 12, boxShadow: "0 8px 20px rgba(0,0,0,.35)" }}>
              <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: cancelado ? "#5A6390" : COR.azulEscuro }}>{i + 1}</div>
              {marcado && (
                <svg style={{ position: "absolute", inset: 0 }} width={130} height={150} viewBox="0 0 130 150">
                  <path d={`M20 30 L${20 + 90 * k} ${30 + 90 * k}`} stroke={COR.vermelho} strokeWidth={12} strokeLinecap="round" />
                  <path d={`M110 30 L${110 - 90 * k} ${30 + 90 * k}`} stroke={COR.vermelho} strokeWidth={12} strokeLinecap="round" />
                </svg>
              )}
              {cancelado && <div style={{ position: "absolute", left: 10, right: 10, top: 72, height: 6, background: "#5A6390" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 110, top: 180, display: "flex", flexDirection: "column", gap: 16 }}>
        {FATOS.map((x) => {
          const k = mola(fala * x.p);
          return (
            <div key={x.t} style={{ transform: `translateX(${(1 - k) * 120}px)`, opacity: k, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 30, color: COR.branco, background: x.t === "PRESOS EM CRISE" ? COR.vermelho : "rgba(7,15,51,.85)", borderLeft: `6px solid ${COR.vermelho}`, padding: "12px 22px", borderRadius: "0 14px 14px 0" }}>
              {x.t}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 150, top: 540, width: 1000, display: "flex", justifyContent: "center", opacity: cl(p, 0.78, 0.8) }}>
        {kSelo > 0.01 && <Selo texto="ENCERRADO NO DIA 6" k={kSelo} cor={COR.vermelho} rot={-4} />}
      </div>
    </AbsoluteFill>
  );
};

export default Calendario;
