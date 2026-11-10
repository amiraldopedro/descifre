import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Cena3D } from "./3d/cenas3d";
import { SOB_MEDIDA } from "./sob-medida";
import { Cena, COR, FONTE_TEXTO } from "./tema";

/** Desenha cenas 3D padrão e cenas sob medida (história do vídeo), em tela cheia. */
export const CamadaEspecial: React.FC<{ cena: Cena; falando: boolean }> = ({ cena, falando }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const a = cena.animacao;
  if (a.tipo === "cena3d") return <Cena3D nome={a.nome} texto={a.texto} dur={cena.duracao} vertical={vertical} />;
  if (a.tipo === "sobmedida") {
    const mod = SOB_MEDIDA[a.nome];
    if (!mod) return <Faltando nome={a.nome} />;
    const C = mod.default;
    return (
      <AbsoluteFill>
        <C dur={cena.duracao} fala={cena.fala} falando={falando} vertical={vertical} props={a.props ?? {}} />
      </AbsoluteFill>
    );
  }
  return null;
};

export const ehEspecial = (c: Cena) => c.animacao.tipo === "cena3d" || c.animacao.tipo === "sobmedida";

const Faltando: React.FC<{ nome: string }> = ({ nome }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 40, color: COR.amarelo, opacity: 0.6 + Math.sin(f / 5) * 0.4 }}>
        cena sob medida não encontrada: {nome}
      </div>
    </AbsoluteFill>
  );
};
