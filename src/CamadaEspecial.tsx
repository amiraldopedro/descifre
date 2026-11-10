import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Cena3D } from "./3d/cenas3d";
import { TamanhoPalco } from "./3d/kit";
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
    const el = <C dur={cena.duracao} fala={cena.fala} falando={falando} vertical={vertical} props={a.props ?? {}} />;
    // cena feita só para tela deitada: no Short ela roda numa "telinha" 1920x1080 no meio do quadro
    if (vertical && !mod.vertical) return <Telinha>{el}</Telinha>;
    return <AbsoluteFill>{el}</AbsoluteFill>;
  }
  return null;
};

const Telinha: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useVideoConfig();
  const f = useCurrentFrame();
  const k = Math.min(1, f / 8);
  const ESC = (width - 48) / 1920; // cena inteira, sem cortar as bordas
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 470 }}>
      <div
        style={{
          width: width - 40, height: 1080 * ESC + 8, borderRadius: 36, overflow: "hidden", position: "relative",
          background: COR.azulEscuro, border: `4px solid ${COR.ciano}66`, boxShadow: `0 0 60px ${COR.ciano}33`,
          transform: `scale(${0.92 + 0.08 * k})`, opacity: k,
        }}
      >
        <div style={{ position: "absolute", left: (width - 40 - 1920 * ESC) / 2, top: 0, width: 1920, height: 1080, transform: `scale(${ESC})`, transformOrigin: "top left" }}>
          <TamanhoPalco.Provider value={{ width: 1920, height: 1080 }}>
            <AbsoluteFill>{children}</AbsoluteFill>
          </TamanhoPalco.Provider>
        </div>
      </div>
    </AbsoluteFill>
  );
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
