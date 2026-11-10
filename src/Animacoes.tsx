import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Animacao, COR, FONTE_TEXTO, FONTE_TITULO } from "./tema";
import { Mascote } from "./Mascote";

const useEntrada = (atraso = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - atraso, fps, config: { damping: 14, mass: 0.7 } });
};

const Cartao: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(7,15,51,.78)",
      border: `3px solid ${COR.ciano}55`,
      borderRadius: 32,
      boxShadow: `0 20px 60px rgba(0,0,0,.45), 0 0 40px ${COR.azulClaro}33`,
      backdropFilter: "blur(6px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Titulo: React.FC<{ texto: string }> = ({ texto }) => {
  const e = useEntrada();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 160 }}>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 96,
          color: COR.branco,
          textAlign: "center",
          maxWidth: 1500,
          lineHeight: 1.1,
          textTransform: "uppercase",
          transform: `scale(${0.6 + 0.4 * e})`,
          opacity: e,
          textShadow: `0 10px 40px rgba(0,0,0,.6), 0 0 30px ${COR.azulClaro}88`,
        }}
      >
        {texto}
      </div>
      <div style={{ width: 220 * e, height: 10, borderRadius: 5, background: COR.vermelho, marginTop: 28 }} />
    </AbsoluteFill>
  );
};

const Pergunta: React.FC<{ numero: number; texto: string; a: string; b: string; relogio?: number }> = ({
  numero,
  texto,
  a,
  b,
  relogio,
}) => {
  const e = useEntrada();
  const ea = useEntrada(8);
  const eb = useEntrada(14);
  const opcao = (letra: string, txt: string, cor: string, s: number) => (
    <Cartao
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "26px 36px",
        width: 720,
        transform: `translateY(${(1 - s) * 60}px)`,
        opacity: s,
      }}
    >
      <div
        style={{
          minWidth: 92,
          height: 92,
          borderRadius: 46,
          background: cor,
          color: COR.branco,
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {letra}
      </div>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 38, color: COR.branco, lineHeight: 1.2 }}>{txt}</div>
    </Cartao>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 8,
          color: COR.ciano,
          opacity: e,
        }}
      >
        SITUAÇÃO {numero} DE 7
      </div>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 66,
          color: COR.branco,
          marginTop: 18,
          textAlign: "center",
          maxWidth: 1500,
          transform: `scale(${0.8 + 0.2 * e})`,
          opacity: e,
          textShadow: "0 8px 30px rgba(0,0,0,.6)",
        }}
      >
        {texto}
      </div>
      <div style={{ display: "flex", gap: 48, marginTop: 56 }}>
        {opcao("A", a, COR.vermelho, ea)}
        {opcao("B", b, COR.azulClaro, eb)}
      </div>
      {relogio !== undefined && relogio > 0 && <Relogio segundos={relogio} />}
    </AbsoluteFill>
  );
};

/** Contagem regressiva "PENSE..." (3, 2, 1). */
const Relogio: React.FC<{ segundos: number }> = ({ segundos }) => {
  const { fps } = useVideoConfig();
  const n = Math.ceil(segundos);
  const frac = segundos - Math.floor(segundos);
  const pulso = 1 + (frac > 0.8 ? (frac - 0.8) * 1.2 : 0);
  return (
    <div style={{ marginTop: 60, display: "flex", alignItems: "center", gap: 30 }}>
      <svg width={150} height={150} style={{ transform: `scale(${pulso})` }}>
        <circle cx={75} cy={75} r={64} fill={COR.azulEscuro} stroke={`${COR.ciano}44`} strokeWidth={10} />
        <circle
          cx={75}
          cy={75}
          r={64}
          fill="none"
          stroke={COR.amarelo}
          strokeWidth={10}
          strokeDasharray={2 * Math.PI * 64}
          strokeDashoffset={2 * Math.PI * 64 * (1 - (segundos % 1 || 1))}
          transform="rotate(-90 75 75)"
          strokeLinecap="round"
        />
        <text x={75} y={98} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={64} fill={COR.branco}>
          {n}
        </text>
      </svg>
      <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 60, color: COR.amarelo, letterSpacing: 6 }}>
        PENSE...
      </div>
    </div>
  );
};

const Conceito: React.FC<{ nome: string; frase: string }> = ({ nome, frase }) => {
  const e = useEntrada();
  const e2 = useEntrada(10);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 170 }}>
      <Cartao style={{ padding: "44px 80px", textAlign: "center", transform: `scale(${0.7 + 0.3 * e})`, opacity: e }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 32, letterSpacing: 10, color: COR.vermelho }}>
          GATILHO MENTAL
        </div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 104, color: COR.branco, marginTop: 6 }}>{nome}</div>
        <div
          style={{
            fontFamily: FONTE_TEXTO,
            fontWeight: 600,
            fontSize: 42,
            color: COR.ciano,
            marginTop: 10,
            opacity: e2,
            transform: `translateY(${(1 - e2) * 20}px)`,
          }}
        >
          {frase}
        </div>
      </Cartao>
    </AbsoluteFill>
  );
};

const Citacao: React.FC<{ texto: string; autor: string }> = ({ texto, autor }) => {
  const e = useEntrada();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 170 }}>
      <Cartao style={{ padding: "40px 70px", maxWidth: 1300, opacity: e, transform: `translateX(${(1 - e) * -80}px)` }}>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: COR.branco }}>“{texto}”</div>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 38, color: COR.ciano, marginTop: 14 }}>— {autor}</div>
      </Cartao>
    </AbsoluteFill>
  );
};

const Lista: React.FC<{ itens: string[] }> = ({ itens }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 180, paddingBottom: 170 }}>
      {itens.map((it, i) => {
        // itens já mostrados antes aparecem direto; só o último entra animado
        const novo = i === itens.length - 1;
        const s = novo ? spring({ frame: f - 4, fps, config: { damping: 14 } }) : 1;
        return (
          <Cartao
            key={i}
            style={{
              padding: "22px 40px",
              marginBottom: 22,
              width: "fit-content",
              opacity: s,
              transform: `translateX(${(1 - s) * -120}px)`,
              borderColor: novo ? COR.amarelo : `${COR.ciano}55`,
            }}
          >
            <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 56, color: novo ? COR.amarelo : COR.branco }}>{it}</div>
          </Cartao>
        );
      })}
    </AbsoluteFill>
  );
};

const Resultado: React.FC<{ faixa: string; titulo: string }> = ({ faixa, titulo }) => {
  const e = useEntrada();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 170 }}>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 48, color: COR.ciano, letterSpacing: 6, opacity: e }}>
        {faixa.toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 130,
          color: COR.branco,
          transform: `scale(${0.5 + 0.5 * e}) rotate(${(1 - e) * -6}deg)`,
          textShadow: `0 0 40px ${COR.vermelho}aa, 0 10px 30px rgba(0,0,0,.6)`,
        }}
      >
        {titulo.toUpperCase()}
      </div>
    </AbsoluteFill>
  );
};

const FalaMascote: React.FC<{ texto: string; falando: boolean }> = ({ texto, falando }) => {
  const e = useEntrada();
  const e2 = useEntrada(8);
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40, paddingBottom: 150 }}>
      <div style={{ transform: `scale(${e})` }}>
        <Mascote tamanho={560} falando={falando} />
      </div>
      <Cartao
        style={{
          padding: "36px 56px",
          maxWidth: 820,
          opacity: e2,
          transform: `translateX(${(1 - e2) * 60}px)`,
          borderRadius: "40px 40px 40px 8px",
        }}
      >
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 68, color: COR.branco, lineHeight: 1.15 }}>{texto}</div>
      </Cartao>
    </AbsoluteFill>
  );
};

const Encerramento: React.FC<{ falando: boolean }> = ({ falando }) => {
  const e = useEntrada();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 120 }}>
      <div style={{ transform: `scale(${e})` }}>
        <Mascote tamanho={520} falando={falando} />
      </div>
      <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 120, color: COR.branco, opacity: e }}>
        DES<span style={{ color: COR.vermelho }}>C</span>IFRE
      </div>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 40, color: COR.ciano, letterSpacing: 14 }}>
        DESCIFRE E DOMINE
      </div>
    </AbsoluteFill>
  );
};

export const CamadaAnimacao: React.FC<{ anim: Animacao; falando: boolean; fala: number; duracao: number }> = ({
  anim,
  falando,
  fala,
  duracao,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  switch (anim.tipo) {
    case "titulo":
      return <Titulo texto={anim.texto} />;
    case "pergunta":
      return <Pergunta {...anim} />;
    case "contagem": {
      if (!anim.pergunta) return null;
      const restante = f >= fala ? (duracao - f) / fps : undefined;
      return <Pergunta {...anim.pergunta} relogio={restante} />;
    }
    case "conceito":
      return <Conceito {...anim} />;
    case "citacao":
      return <Citacao {...anim} />;
    case "lista":
      return <Lista itens={anim.itens} />;
    case "resultado":
      return <Resultado {...anim} />;
    case "mascote":
      return <FalaMascote texto={anim.texto} falando={falando} />;
    case "encerramento":
      return <Encerramento falando={falando} />;
    default:
      return null;
  }
};

/** Usa layout com legenda no topo quando a animação ocupa a parte de baixo. */
export const legendaNoTopo = (a: Animacao) => a.tipo === "pergunta" || a.tipo === "contagem";
export const usaFundoCosmico = (a: Animacao) => a.tipo === "mascote" || a.tipo === "encerramento";
export { interpolate };
