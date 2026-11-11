import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, FundoCosmico } from "./Fundo";
import { CamadaAnimacao, legendaNoTopo, usaFundoCosmico } from "./Animacoes";
import { Legenda } from "./Legenda";
import { Mascote } from "./Mascote";
import { Ilustracao } from "./Ilustracoes";
import { Palco } from "./personagens/Palco";
import { CamadaEspecial } from "./CamadaEspecial";
import { COR, Cena, FONTE_TITULO, Manifesto } from "./tema";
import { FUSAO, GlitchEntrada, TipoTransicao, cameraDaCena, sobra, transicaoDaCena, tremidaGlitch, useCamera, useTransicao } from "./Camera";

type PropsCena = { cena: Cena; entrada: TipoTransicao; saida: TipoTransicao };

const CenaView: React.FC<PropsCena> = ({ cena, entrada, saida }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const falando = cena.palavras.some((p) => t >= p.t0 && t <= p.t1);
  const cam = useCamera(cameraDaCena(cena), cena.duracao + sobra(saida, FUSAO.longo), cena.id);
  const tr = useTransicao(entrada, saida, cena.duracao, FUSAO.longo);
  const cosmico = usaFundoCosmico(cena.animacao) || !cena.broll;
  const atores = cena.personagens ?? [];
  const temPalco = atores.length > 0;
  const il = cena.animacao.tipo === "ilustracao" ? cena.animacao : null;
  const temOverlayGrande = cena.animacao.tipo !== "nenhuma" || temPalco;

  return (
    <AbsoluteFill style={{ opacity: tr.opacidade, transform: entrada === "glitch" ? `translateX(${tremidaGlitch(f)}px)` : undefined }}>
      {/* fundo: anda mais devagar que o primeiro plano (parallax) */}
      <AbsoluteFill style={{ transform: cam.fundo }}>
        {cosmico ? <FundoCosmico /> : <BRoll src={cena.broll!} duracao={cena.duracao} clipe={cena.brollFrames} lofi={cena.lofi} />}
      </AbsoluteFill>
      {temOverlayGrande && !cosmico && <AbsoluteFill style={{ backgroundColor: "rgba(7,15,51,.45)" }} />}
      <AbsoluteFill style={{ transform: cam.frente }}>
        <CamadaAnimacao anim={cena.animacao} falando={falando} fala={cena.fala} duracao={cena.duracao} />
        <CamadaEspecial cena={cena} falando={falando} />
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
      </AbsoluteFill>
      {cena.animacao.tipo !== "encerramento" && <Legenda palavras={cena.palavras} topo={false} />}
      {entrada === "glitch" && <GlitchEntrada />}
      {tr.preto > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: tr.preto }} />}
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
      {m.cenas.map((c, i) => {
        const entrada = transicaoDaCena(c, m.cenas[i - 1]);
        const prox = m.cenas[i + 1];
        const saida = prox ? transicaoDaCena(prox, c) : "corte";
        return (
          <Sequence key={c.id} from={c.inicio} durationInFrames={c.duracao + sobra(saida, FUSAO.longo)} layout="none">
            <AbsoluteFill>
              <CenaView cena={c} entrada={entrada} saida={saida} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <MarcaDagua />
      <Progresso total={m.totalFrames} />
      {m.narracao && <Audio src={staticFile(m.narracao)} />}
      {m.musica && <Audio src={staticFile(m.musica)} volume={0.07} loop />}
    </AbsoluteFill>
  );
};
