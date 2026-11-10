import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, FundoCosmico } from "./Fundo";
import { CamadaAnimacao, legendaNoTopo, usaFundoCosmico } from "./Animacoes";
import { Legenda } from "./Legenda";
import { Mascote } from "./Mascote";
import { Ilustracao } from "./Ilustracoes";
import { Palco } from "./personagens/Palco";
import { COR, Cena, FONTE_TITULO, Manifesto } from "./tema";

const TRANSICAO = 8; // frames de fade entre cenas

const CenaView: React.FC<{ cena: Cena }> = ({ cena }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const falando = cena.palavras.some((p) => t >= p.t0 && t <= p.t1);
  const fade = interpolate(f, [0, TRANSICAO], [0, 1], { extrapolateRight: "clamp" });
  const cosmico = usaFundoCosmico(cena.animacao) || !cena.broll;
  const atores = cena.personagens ?? [];
  const temPalco = atores.length > 0;
  const il = cena.animacao.tipo === "ilustracao" ? cena.animacao : null;
  const temOverlayGrande = cena.animacao.tipo !== "nenhuma" || temPalco;

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {cosmico ? <FundoCosmico /> : <BRoll src={cena.broll!} duracao={cena.duracao} clipe={cena.brollFrames} />}
      {temOverlayGrande && !cosmico && <AbsoluteFill style={{ backgroundColor: "rgba(7,15,51,.45)" }} />}
      <CamadaAnimacao anim={cena.animacao} falando={falando} fala={cena.fala} duracao={cena.duracao} />
      {/* sem b-roll: o Cifrinho ocupa o centro da tela, conversando */}
      {il && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: temPalco ? "flex-start" : "center", paddingTop: temPalco ? 90 : 0, paddingBottom: temPalco ? 0 : 190 }}>
          <Ilustracao nome={il.nome} texto={il.texto} tamanho={temPalco ? 420 : 540} />
        </AbsoluteFill>
      )}
      {temPalco && <Palco atores={atores} quemFala={cena.quem ?? "cifrinho"} falando={falando} temAnim={cena.animacao.tipo !== "nenhuma"} />}
      {cena.animacao.tipo === "nenhuma" && cosmico && !temPalco && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 200 }}>
          <Mascote tamanho={640} falando={falando} seed={cena.id} />
        </AbsoluteFill>
      )}
      {cena.animacao.tipo !== "encerramento" && <Legenda palavras={cena.palavras} topo={false} />}
    </AbsoluteFill>
  );
};

const MarcaDagua: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 36,
      left: 44,
      fontFamily: FONTE_TITULO,
      fontWeight: 800,
      fontSize: 30,
      color: COR.branco,
      opacity: 0.8,
      letterSpacing: 2,
    }}
  >
    DES<span style={{ color: COR.vermelho }}>C</span>IFRE
  </div>
);

const Progresso: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${(f / total) * 100}%`, background: COR.vermelho }} />
  );
};

export const Video: React.FC<Manifesto> = (m) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COR.azulEscuro }}>
      {m.cenas.map((c) => (
        <Sequence key={c.id} from={c.inicio} durationInFrames={c.duracao + TRANSICAO} layout="none">
          <AbsoluteFill>
            <CenaView cena={c} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <MarcaDagua />
      <Progresso total={m.totalFrames} />
      {m.narracao && <Audio src={staticFile(m.narracao)} />}
      {m.musica && <Audio src={staticFile(m.musica)} volume={0.07} loop />}
    </AbsoluteFill>
  );
};
