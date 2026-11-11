/**
 * Vaso de Rubin: um vaso branco OU dois rostos de perfil, frente a frente.
 * props.fase: "teste" | "revelar" (contorna os rostos e o vaso, um de cada vez)
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

export const vertical = true;
export const sons: SomCena[] = [{ som: "pop", p: 0.02 }, { som: "ding", p: 0.3, fase: "revelar" }, { som: "ding", p: 0.65, fase: "revelar" }];

// perfil do lado esquerdo (testa, nariz, boca, queixo, pescoço) em coordenadas 0..100 x 0..160
const PERFIL = "M0 0 L34 0 C36 18 38 26 44 34 C47 40 46 44 42 46 C46 52 52 58 50 62 C46 64 44 64 44 68 C47 70 47 74 44 76 C46 80 46 84 42 88 C38 94 34 100 34 112 C34 128 40 140 46 160 L0 160 Z";

const Vaso: React.FC<PropsSobMedida> = ({ fala, props }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const p = f / Math.max(1, fala);
  const revelar = props.fase === "revelar";
  const kRostos = revelar ? interpolate(p, [0.2, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const kVaso = revelar ? interpolate(p, [0.55, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const s = Math.min(W, H * 0.6) / 200;
  const tilt = Math.sin(f / 40) * 0.6;
  return (
    <AbsoluteFill style={{ background: COR.azulEscuro }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(${W / 2} ${H * 0.5}) scale(${s}) rotate(${tilt}) translate(-100 -80)`}>
          <rect x={0} y={0} width={200} height={160} fill="#FFFFFF" />
          <path d={PERFIL} fill="#111" />
          <path d={PERFIL} fill="#111" transform="translate(200 0) scale(-1 1)" />
          <path d={PERFIL} fill="none" stroke={COR.vermelho} strokeWidth={2.5} opacity={kRostos} />
          <path d={PERFIL} fill="none" stroke={COR.vermelho} strokeWidth={2.5} opacity={kRostos} transform="translate(200 0) scale(-1 1)" />
          <rect x={30} y={0} width={140} height={160} fill="none" stroke={COR.amarelo} strokeWidth={0} />
          <path d={PERFIL.replace("M0 0 L34 0", "M34 0").replace(" L0 160 Z", "")} fill="none" stroke={COR.amarelo} strokeWidth={3} opacity={kVaso} transform="translate(1 0)" />
          <path d={PERFIL.replace("M0 0 L34 0", "M34 0").replace(" L0 160 Z", "")} fill="none" stroke={COR.amarelo} strokeWidth={3} opacity={kVaso} transform="translate(199 0) scale(-1 1)" />
        </g>
      </svg>
      <div style={{ position: "absolute", top: H * 0.1, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: W * 0.07, color: COR.branco }}>
        {!revelar ? "O QUE VOCÊ VIU PRIMEIRO?" : kVaso > 0.5 ? "OU UM VASO" : kRostos > 0.5 ? "DOIS ROSTOS..." : "A RESPOSTA"}
      </div>
    </AbsoluteFill>
  );
};
export default Vaso;
