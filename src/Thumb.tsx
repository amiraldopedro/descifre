import React from "react";
import { AbsoluteFill } from "remotion";
import { FundoCosmico } from "./Fundo";
import { Mascote } from "./Mascote";
import { COR, FONTE_TITULO } from "./tema";

export type ThumbProps = { linha1: string; destaque: string; selo?: string };

/** Thumbnail 1280x720: texto curto e forte + Cifrinho. */
export const Thumb: React.FC<ThumbProps> = ({ linha1, destaque, selo }) => (
  <AbsoluteFill>
    <FundoCosmico />
    <AbsoluteFill style={{ background: `radial-gradient(circle at 75% 55%, ${COR.vermelho}55 0%, transparent 45%)` }} />
    <div style={{ position: "absolute", right: -90, top: 130 }}>
      <Mascote tamanho={640} />
    </div>
    <div style={{ position: "absolute", left: 60, top: 90, width: 720 }}>
      {selo && (
        <div
          style={{
            display: "inline-block",
            background: COR.amarelo,
            color: COR.azulEscuro,
            fontFamily: FONTE_TITULO,
            fontWeight: 800,
            fontSize: 40,
            padding: "8px 22px",
            borderRadius: 12,
            transform: "rotate(-3deg)",
            marginBottom: 24,
          }}
        >
          {selo}
        </div>
      )}
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.02,
          color: COR.branco,
          textTransform: "uppercase",
          WebkitTextStroke: `14px ${COR.azulEscuro}`,
          paintOrder: "stroke fill",
        }}
      >
        {linha1}
        <br />
        <span style={{ color: COR.vermelho }}>{destaque}</span>
      </div>
    </div>
  </AbsoluteFill>
);
