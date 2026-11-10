import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BRoll, FundoCosmico } from "./Fundo";
import { Mascote } from "./Mascote";
import { Ilustracao } from "./Ilustracoes";
import { Palco } from "./personagens/Palco";
import { CamadaEspecial, ehEspecial } from "./CamadaEspecial";
import { COR, Cena, FONTE_TEXTO, FONTE_TITULO, Manifesto, Palavra } from "./tema";

/* ---------- utilitários de "dopamina" ---------- */

const useMola = (atraso = 0, rigidez = 220) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - atraso, fps, config: { damping: 9, stiffness: rigidez, mass: 0.6 } });
};

/** Tremida curta (decai em ~10 frames). */
const tremer = (f: number, forca = 18, dur = 10) => {
  if (f > dur) return { x: 0, y: 0 };
  const k = (1 - f / dur) * forca;
  return { x: Math.sin(f * 7.3) * k, y: Math.cos(f * 9.1) * k };
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 4], [0.75, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ backgroundColor: "#fff", opacity: o, mixBlendMode: "screen" }} />;
};

const texto3D = (borda = 14): React.CSSProperties => ({
  WebkitTextStroke: `${borda}px ${COR.azulEscuro}`,
  paintOrder: "stroke fill",
  textShadow: `0 10px 0 ${COR.azulEscuro}, 0 18px 40px rgba(0,0,0,.6)`,
});

/* ---------- legenda gigante (1 a 3 palavras por vez) ---------- */

function blocos(ps: Palavra[]): Palavra[][] {
  const out: Palavra[][] = [];
  let a: Palavra[] = [];
  for (const p of ps) {
    a.push(p);
    if (a.length >= 3 || /[.!?,:]$/.test(p.w)) {
      out.push(a);
      a = [];
    }
  }
  if (a.length) out.push(a);
  return out;
}

const LegendaGigante: React.FC<{ palavras: Palavra[]; y: number }> = ({ palavras, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const gs = blocos(palavras);
  const gi = gs.findIndex((g) => t >= g[0].t0 - 0.04 && t <= g[g.length - 1].t1 + 0.12);
  if (gi < 0) return null;
  const g = gs[gi];
  const inicio = Math.round(g[0].t0 * fps);
  const pop = spring({ frame: f - inicio, fps, config: { damping: 8, stiffness: 260, mass: 0.5 } });
  const giro = gi % 2 === 0 ? -2.5 : 2.5;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: y,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 52px",
        transform: `scale(${0.5 + 0.5 * pop}) rotate(${giro * (1 - pop)}deg)`,
      }}
    >
      {g.map((p, i) => {
        const ativa = t >= p.t0 && t <= p.t1 + 0.04;
        const palavra = p.w.replace(/[,.:;!?]$/, "");
        const tam = palavra.length > 9 ? Math.floor((108 * 9) / palavra.length) : 108; // palavra longa encolhe para caber
        return (
          <span
            key={i}
            style={{
              fontFamily: FONTE_TITULO,
              fontWeight: 800,
              fontSize: tam,
              lineHeight: 1.08,
              textTransform: "uppercase",
              display: "inline-block",
              color: ativa ? COR.amarelo : COR.branco,
              transform: ativa ? "scale(1.08)" : "none",
              ...texto3D(),
            }}
          >
            {palavra}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- camadas por tipo de cena ---------- */

const Gancho: React.FC<{ texto: string }> = ({ texto }) => {
  const f = useCurrentFrame();
  const e = useMola(0, 300);
  const s = tremer(f, 26, 14);
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 50,
          right: 50,
          textAlign: "center",
          transform: `translate(${s.x}px, ${s.y}px) scale(${3 - 2 * e})`,
          opacity: Math.min(1, e * 2),
        }}
      >
        <span
          style={{
            background: COR.vermelho,
            color: COR.branco,
            fontFamily: FONTE_TITULO,
            fontWeight: 800,
            fontSize: 112,
            lineHeight: 1.25,
            padding: "6px 26px",
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            borderRadius: 18,
            boxShadow: `0 16px 0 ${COR.vermelhoEsc}`,
          }}
        >
          {texto}
        </span>
      </div>
      <div style={{ position: "absolute", right: -30, top: 640, transform: `scale(${useMola(8)}) rotate(10deg)` }}>
        <Mascote tamanho={460} falando />
      </div>
    </>
  );
};

const Cartoes: React.FC<{ texto: string; a: string; b: string; relogio?: number }> = ({ texto, a, b, relogio }) => {
  const e = useMola(0);
  const ea = useMola(5);
  const eb = useMola(10);
  const f = useCurrentFrame();
  const card = (letra: string, txt: string, cor: string, s: number, lado: number) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        background: "rgba(7,15,51,.88)",
        border: `5px solid ${cor}`,
        borderRadius: 34,
        padding: "26px 34px",
        width: 900,
        transform: `translateX(${(1 - s) * 900 * lado}px) rotate(${(1 - s) * 8 * lado}deg)`,
        boxShadow: `0 14px 0 ${cor}88`,
      }}
    >
      <div
        style={{
          minWidth: 110,
          height: 110,
          borderRadius: 55,
          background: cor,
          color: COR.branco,
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {letra}
      </div>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 56, color: COR.branco, lineHeight: 1.1 }}>{txt}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, gap: 34 }}>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 92,
          color: COR.branco,
          textAlign: "center",
          transform: `scale(${0.4 + 0.6 * e})`,
          ...texto3D(12),
        }}
      >
        {texto}
      </div>
      {card("A", a, COR.vermelho, ea, -1)}
      {card("B", b, COR.azulClaro, eb, 1)}
      {relogio !== undefined && relogio > 0 && (
        <div
          style={{
            marginTop: 30,
            fontFamily: FONTE_TITULO,
            fontWeight: 800,
            fontSize: 220,
            color: COR.amarelo,
            transform: `scale(${1 + 0.25 * Math.max(0, (relogio % 0.66) / 0.66 - 0.6) * 2.5}) rotate(${Math.sin(f / 2) * 3}deg)`,
            ...texto3D(16),
          }}
        >
          {Math.ceil(relogio / 0.66)}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Conceito: React.FC<{ nome: string; frase: string; rotulo?: string }> = ({ nome, frase, rotulo = "GATILHO MENTAL" }) => {
  const f = useCurrentFrame();
  const e = useMola(0, 280);
  const glitch = f < 12 ? Math.sin(f * 3) * 10 : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 46, letterSpacing: 14, color: COR.ciano, opacity: e }}>
        {rotulo}
      </div>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: nome.length > 9 ? 100 : 132,
          color: COR.branco,
          transform: `scale(${0.3 + 0.7 * e})`,
          textShadow: `${glitch}px 0 0 ${COR.vermelho}, ${-glitch}px 0 0 ${COR.ciano}, 0 14px 40px rgba(0,0,0,.6)`,
          WebkitTextStroke: `12px ${COR.azulEscuro}`,
          paintOrder: "stroke fill",
        }}
      >
        {nome}
      </div>
      <div
        style={{
          marginTop: 10,
          background: COR.amarelo,
          color: COR.azulEscuro,
          fontFamily: FONTE_TEXTO,
          fontWeight: 800,
          fontSize: 54,
          padding: "8px 28px",
          borderRadius: 14,
          transform: `scale(${useMola(8)}) rotate(-2deg)`,
        }}
      >
        {frase}
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ texto: string; falando: boolean }> = ({ texto, falando }) => {
  const f = useCurrentFrame();
  const e = useMola(0);
  const seta = Math.abs(Math.sin(f / 5)) * 40;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
      <div
        style={{
          fontFamily: FONTE_TITULO,
          fontWeight: 800,
          fontSize: 96,
          color: COR.branco,
          textAlign: "center",
          padding: "0 50px",
          transform: `scale(${0.4 + 0.6 * e})`,
          ...texto3D(),
        }}
      >
        {texto}
      </div>
      <div style={{ transform: `scale(${useMola(6)})`, marginTop: 10 }}>
        <Mascote tamanho={640} falando={falando} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${seta}px)`,
        }}
      >
        <div
          style={{
            background: COR.vermelho,
            color: COR.branco,
            fontFamily: FONTE_TITULO,
            fontWeight: 800,
            fontSize: 58,
            padding: "14px 36px",
            borderRadius: 999,
            boxShadow: `0 12px 0 ${COR.vermelhoEsc}`,
          }}
        >
          VÍDEO COMPLETO
        </div>
        <svg width={120} height={110} viewBox="0 0 120 110">
          <path d="M60 100 L10 40 H40 V5 H80 V40 H110 Z" fill={COR.amarelo} stroke={COR.azulEscuro} strokeWidth={8} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- cena ---------- */

const CenaShort: React.FC<{ cena: Cena; ultima: number | null }> = ({ cena, ultima }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const falando = cena.palavras.some((p) => t >= p.t0 && t <= p.t1);
  const a = cena.animacao;
  const cosmico = !cena.broll || a.tipo === "cta";
  // zoom de impacto no corte + deriva lenta
  const zoom = interpolate(f, [0, 6, cena.duracao], [1.35, 1.12, 1.22], { extrapolateRight: "clamp" });
  const s = a.tipo === "gancho" ? tremer(f, 30, 14) : tremer(f, 8, 6);
  const atores = cena.personagens ?? [];
  const temPalco = atores.length > 0;
  const legendaY = temPalco ? 1500 : a.tipo === "nenhuma" ? 1020 : 1420;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) scale(${zoom})` }}>
        {cosmico ? <FundoCosmico /> : <BRoll src={cena.broll!} duracao={cena.duracao} clipe={cena.brollFrames} lofi={cena.lofi ?? (a.tipo === "gancho" ? "forte" : "leve")} />}
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(7,15,51,.55) 0%, rgba(7,15,51,.1) 35%, rgba(7,15,51,.2) 60%, rgba(7,15,51,.8) 100%)" }}
      />
      {a.tipo !== "nenhuma" && a.tipo !== "gancho" && <AbsoluteFill style={{ backgroundColor: "rgba(7,15,51,.35)" }} />}
      {ehEspecial(cena) && <CamadaEspecial cena={cena} falando={falando} />}
      {a.tipo === "gancho" && <Gancho texto={a.texto} />}
      {a.tipo === "pergunta" && <Cartoes texto={a.texto} a={a.a} b={a.b} />}
      {a.tipo === "contagem" && a.pergunta && (
        <Cartoes texto={a.pergunta.texto} a={a.pergunta.a} b={a.pergunta.b} relogio={f >= cena.fala ? (cena.duracao - f) / fps : undefined} />
      )}
      {a.tipo === "conceito" && <Conceito nome={a.nome} frase={a.frase} rotulo={a.rotulo} />}
      {a.tipo === "cta" && <Cta texto={a.texto} falando={falando} />}
      {a.tipo === "ilustracao" && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: temPalco ? 190 : 330 }}>
          <Ilustracao nome={a.nome} texto={a.texto} tamanho={temPalco ? 520 : 680} />
        </AbsoluteFill>
      )}
      {temPalco && <Palco atores={atores} quemFala={cena.quem ?? "cifrinho"} falando={falando} temAnim={a.tipo !== "nenhuma"} />}
      {a.tipo === "nenhuma" && !cena.broll && !temPalco && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
          <Mascote tamanho={700} falando={falando} seed={cena.id} />
        </AbsoluteFill>
      )}
      {a.tipo !== "cta" && <LegendaGigante palavras={cena.palavras} y={legendaY} />}
      <Flash />
    </AbsoluteFill>
  );
};

const BarraProgresso: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 40, left: 40, right: 40, height: 14, borderRadius: 7, background: "rgba(255,255,255,.25)" }}>
      <div style={{ width: `${(f / total) * 100}%`, height: "100%", borderRadius: 7, background: COR.amarelo }} />
    </div>
  );
};

export const ShortVideo: React.FC<Manifesto & { sfx?: string | null }> = (m) => (
  <AbsoluteFill style={{ backgroundColor: COR.azulEscuro }}>
    {m.cenas.map((c) => (
      <Sequence key={c.id} from={c.inicio} durationInFrames={c.duracao} layout="none">
        <AbsoluteFill>
          <CenaShort cena={c} ultima={null} />
        </AbsoluteFill>
      </Sequence>
    ))}
    <BarraProgresso total={m.totalFrames} />
    <div style={{ position: "absolute", top: 76, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: COR.branco, opacity: 0.85 }}>
      DES<span style={{ color: COR.vermelho }}>C</span>IFRE
    </div>
    {m.narracao && <Audio src={staticFile(m.narracao)} />}
    {m.sfx && <Audio src={staticFile(m.sfx)} volume={0.6} />}
    {m.musica && <Audio src={staticFile(m.musica)} volume={0.12} loop />}
  </AbsoluteFill>
);
