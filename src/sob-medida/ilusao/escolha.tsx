/**
 * Três cartas para escolher. props.cartas: [{titulo, frase, emoji}] ; props.abrir: índice da carta em destaque (ou -1)
 * Sem "abrir", as cartas entram uma a uma (p 0.1, 0.35, 0.6).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const vertical = true;
export const sons: SomCena[] = [{ som: "pop", p: 0.1 }, { som: "pop", p: 0.35 }, { som: "pop", p: 0.6 }];

const Escolha: React.FC<PropsSobMedida> = ({ fala, props }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const mola = useMolaEm();
  const cartas = (props.cartas as { titulo: string; frase: string; emoji: string }[]) ?? [];
  const abrir = (props.abrir as number) ?? -1;
  const vert = H > W;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #1A2A7A, ${COR.azulEscuro})` }}>
      <div style={{ position: "absolute", top: vert ? H * 0.08 : 40, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: W * (vert ? 0.075 : 0.04), color: COR.amarelo }}>
        {(props.titulo as string) ?? "QUAL VOCÊ ESCOLHERIA?"}
      </div>
      <div style={{ position: "absolute", top: vert ? H * 0.2 : 150, left: 0, right: 0, display: "flex", flexDirection: vert ? "column" : "row", alignItems: "center", justifyContent: "center", gap: vert ? 28 : 40 }}>
        {cartas.map((c, i) => {
          const k = abrir >= 0 ? 1 : mola(fala * [0.1, 0.35, 0.6][i]);
          const foco = abrir === i;
          const apagada = abrir >= 0 && !foco;
          const bal = Math.sin((f + i * 20) / 18) * 2;
          return (
            <div key={i} style={{ width: vert ? W * 0.82 : 480, minHeight: vert ? H * 0.17 : 360, transform: `scale(${(foco ? 1.08 : 1) * k}) rotate(${bal}deg)`, opacity: apagada ? 0.3 : k, background: COR.branco, borderRadius: 28, padding: "22px 30px", display: "flex", alignItems: "center", gap: 26, boxShadow: foco ? `0 0 0 8px ${COR.vermelho}, 0 20px 50px rgba(0,0,0,.5)` : "0 16px 40px rgba(0,0,0,.45)" }}>
              <div style={{ fontSize: vert ? W * 0.13 : 110 }}>{c.emoji}</div>
              <div>
                <div style={{ fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: vert ? W * 0.055 : 44, color: COR.azulEscuro }}>{i + 1}. {c.titulo}</div>
                <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 700, fontSize: vert ? W * 0.038 : 28, color: "#3A4170", marginTop: 6 }}>{c.frase}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
export default Escolha;
