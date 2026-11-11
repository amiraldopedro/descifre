/**
 * Blocos de "documentário animado" (estrutura de vídeo-documentário, arte própria do Descifre):
 *   local{texto, ano?}                       etiqueta discreta "LUGAR · ANO" no canto superior esquerdo
 *   documento{titulo, autor, ano, revista?, trecho, destaque, nota?, p0?, p1?}
 *                                            página de estudo em papel envelhecido; o marca-texto passa no
 *                                            "destaque" entre p0 e p1 (proporção da fala, padrão 0,25→0,8)
 *   carimbo{texto, frase?, p?}               carimbo que bate na tela (MITO, VERDADE, EM DEBATE); com "frase",
 *                                            a afirmação aparece antes e o carimbo bate em p (padrão 0,3) da fala
 *   capitulo{numero, titulo}                 cartela cheia, entra e sai com fade para o preto
 *   fim{texto?, thumb?}                      (Shorts) cartela "VÍDEO COMPLETO NO CANAL" com a thumb do longo
 * Os sons de cada bloco estão em scripts/montar.py (mesmos tempos usados aqui).
 */
import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/400-italic.css";
import "@fontsource/libre-baskerville/700.css";
import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCosmico } from "./Fundo";
import { Mascote } from "./Mascote";
import { Thumb } from "./Thumb";
import { Vinheta } from "./Vinheta";
import { Animacao, Cena, COR, FONTE_TEXTO, FONTE_TITULO } from "./tema";

const SERIFA = "'Libre Baskerville', Georgia, serif";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useMola = (atraso = 0, damping = 13) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - atraso, fps, config: { damping, mass: 0.6 } });
};

const useVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

/* ------------------------------------------------------------------ local */

export const Local: React.FC<{ texto: string; ano?: string | number }> = ({ texto, ano }) => {
  const f = useCurrentFrame();
  const vertical = useVertical();
  const abre = interpolate(f, [4, 16], [0, 100], cl);
  const completo = ano !== undefined && ano !== "" ? `${texto.toUpperCase()} · ${ano}` : texto.toUpperCase();
  const n = Math.floor(interpolate(f, [10, 10 + completo.length * 0.8], [0, completo.length], cl));
  const visivel = completo.slice(0, n);
  const [lugar, data] = visivel.split(" · ");
  return (
    <div
      style={{
        position: "absolute", left: vertical ? 40 : 44, top: vertical ? 140 : 92,
        display: "flex", alignItems: "center", gap: 14,
        background: "rgba(7,15,51,.74)", borderLeft: `6px solid ${COR.ciano}`, borderRadius: "0 10px 10px 0",
        padding: vertical ? "14px 26px 14px 20px" : "12px 24px 12px 18px",
        clipPath: `inset(0 ${100 - abre}% 0 0)`, boxShadow: "0 8px 24px rgba(0,0,0,.35)",
        maxWidth: vertical ? 1000 : 1200,
      }}
    >
      <svg width={vertical ? 30 : 26} height={vertical ? 38 : 34} viewBox="0 0 26 34">
        <path d="M13 33 C13 33 2 19 2 12 A11 11 0 0 1 24 12 C24 19 13 33 13 33 Z" fill={COR.ciano} />
        <circle cx={13} cy={12} r={4.5} fill={COR.azulEscuro} />
      </svg>
      <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: vertical ? 38 : 33, letterSpacing: 4, color: COR.branco, whiteSpace: "nowrap", minHeight: "1.2em" }}>
        {lugar}
        {data !== undefined && (
          <>
            <span style={{ color: COR.ciano }}> · </span>
            <span style={{ color: COR.amarelo }}>{data}</span>
          </>
        )}
        <span style={{ opacity: n < completo.length && f % 10 < 5 ? 1 : 0, color: COR.ciano }}>▍</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- documento */

type PropsDoc = Extract<Animacao, { tipo: "documento" }> & { fala: number };

const Linhas: React.FC<{ n: number; semente: string; cor?: string }> = ({ n, semente, cor = "#6B5A3E" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 13, margin: "6px 0" }}>
    {new Array(n).fill(0).map((_, i) => (
      <div key={i} style={{ height: 9, borderRadius: 4, background: cor, opacity: 0.22, width: `${i === n - 1 ? 40 + random(`${semente}${i}`) * 30 : 88 + random(`${semente}${i}`) * 12}%` }} />
    ))}
  </div>
);

export const Documento: React.FC<PropsDoc> = ({ titulo, autor, ano, revista, trecho, destaque, nota, p0 = 0.25, p1 = 0.8, fala }) => {
  const f = useCurrentFrame();
  const vertical = useVertical();
  const entra = useMola(0, 15);
  const ini = Math.round(p0 * fala);
  const fim = Math.max(ini + 8, Math.round(p1 * fala));
  const prog = interpolate(f, [ini, fim], [0, 1], cl);
  const zoom = 1 + 0.05 * interpolate(f, [ini - 10, fim + 20], [0, 1], cl);

  // divide o trecho em antes / destaque / depois
  const i0 = trecho.indexOf(destaque);
  const antes = i0 >= 0 ? trecho.slice(0, i0) : trecho + " ";
  const depois = i0 >= 0 ? trecho.slice(i0 + destaque.length) : "";
  const palavras = destaque.split(" ");
  const N = palavras.length;

  const W = vertical ? 940 : 1240;
  const fonte = vertical ? (trecho.length > 170 ? 40 : 46) : trecho.length > 170 ? 36 : 41;

  return (
    <AbsoluteFill>
      {/* mesa escura com luz de abajur */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 38%, #24305E 0%, ${COR.azulEscuro} 62%, #03071C 100%)` }} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: vertical ? 250 : 40 }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "50% 62%" }}>
          <div
            style={{
              width: W, position: "relative", padding: vertical ? "64px 64px 56px" : "40px 84px 36px",
              background: "linear-gradient(170deg, #F5EBD2 0%, #EADBB8 55%, #DDC89C 100%)",
              boxShadow: "0 30px 80px rgba(0,0,0,.6), inset 0 0 90px rgba(120,84,30,.35)",
              transform: `translateY(${(1 - entra) * 520}px) rotate(${-1.4 + (1 - entra) * 6}deg)`,
              opacity: Math.min(1, entra * 1.6), color: "#2B2117", fontFamily: SERIFA,
            }}
          >
            {/* manchas de papel velho */}
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", left: `${10 + random(`mx${i}`) * 75}%`, top: `${8 + random(`my${i}`) * 80}%`, width: 90 + random(`mr${i}`) * 120, height: 70 + random(`mh${i}`) * 90, borderRadius: "50%", background: "radial-gradient(circle, rgba(140,98,40,.16) 0%, transparent 70%)" }} />
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "italic", fontSize: vertical ? 26 : 23, color: "#6B5A3E", borderBottom: "2px solid #6B5A3E55", paddingBottom: 10 }}>
              <span>{revista ?? "Estudo científico"}</span>
              <span>{ano}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: vertical ? 54 : (titulo.length > 34 ? 46 : 54), textAlign: "center", marginTop: vertical ? 34 : 20, lineHeight: 1.2 }}>{titulo}</div>
            <div style={{ fontStyle: "italic", fontSize: vertical ? 32 : 29, textAlign: "center", marginTop: 8, color: "#4A3B27" }}>{autor}</div>
            <div style={{ width: 120, height: 2, background: "#6B5A3E66", margin: vertical ? "30px auto 26px" : "16px auto 14px" }} />
            <Linhas n={vertical ? 3 : 2} semente="a" />
            <div style={{ fontSize: fonte, lineHeight: 1.6, margin: vertical ? "22px 0" : "14px 0", textAlign: "left" }}>
              {antes}
              {palavras.map((w, i) => {
                const k = Math.min(1, Math.max(0, prog * N - i));
                return (
                  <span
                    key={i}
                    style={{
                      backgroundImage: `linear-gradient(${COR.amarelo}D9, ${COR.amarelo}D9)`,
                      backgroundRepeat: "no-repeat", backgroundPosition: "0 70%",
                      backgroundSize: `${k * 100}% 78%`, fontWeight: k > 0 ? 700 : 400,
                    }}
                  >
                    {w}
                    {i < N - 1 ? " " : ""}
                  </span>
                );
              })}
              {depois}
            </div>
            <Linhas n={vertical ? 4 : 2} semente="b" />
            {nota && <div style={{ fontStyle: "italic", fontSize: vertical ? 24 : 20, color: "#6B5A3E", marginTop: 8, textAlign: "right" }}>{nota}</div>}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- carimbo */

const COR_CARIMBO: Record<string, string> = { MITO: COR.vermelho, VERDADE: COR.ciano, "EM DEBATE": COR.amarelo };
export const corCarimbo = (t: string) => COR_CARIMBO[t.toUpperCase()] ?? COR.vermelho;
/** Frame em que o carimbo bate (o montar.py usa a mesma conta para o som). */
export const batidaCarimbo = (a: { frase?: string; p?: number }, fala: number) => (a.frase ? Math.round((a.p ?? 0.3) * fala) : 6);

export const Carimbo: React.FC<{ texto: string; frase?: string; p?: number; fala: number }> = ({ texto, frase, p, fala }) => {
  const f = useCurrentFrame();
  const vertical = useVertical();
  const hit = batidaCarimbo({ frase, p }, fala);
  const cor = corCarimbo(texto);
  const rotulo = texto.toUpperCase();
  const e = useMola(0, 14);
  const d = f - hit; // frames desde a batida
  const escala = d < -3 ? 0 : d < 0 ? 1.4 : interpolate(d, [0, 5], [1.4, 1], cl);
  const opac = d < -3 ? 0 : interpolate(d, [-3, 0], [0, 1], cl);
  const tr = d >= 0 && d < 12 ? (1 - d / 12) * 16 : 0;
  const shake = { x: Math.sin(d * 7.3) * tr, y: Math.cos(d * 9.1) * tr };
  const fs = vertical ? (rotulo.length > 6 ? 118 : 150) : rotulo.length > 6 ? 120 : 150;
  const largura = rotulo.length * fs * 0.86 + 90;
  const altura = fs * 1.5;

  return (
    <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
      {frase && (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: vertical ? 380 : 170 }}>
          <div
            style={{
              maxWidth: vertical ? 900 : 1400, textAlign: "center", padding: vertical ? "34px 44px" : "30px 60px",
              background: "rgba(7,15,51,.78)", border: `3px solid ${COR.branco}33`, borderRadius: 28,
              fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: vertical ? 64 : (frase.length > 40 ? 56 : 66), lineHeight: 1.2, color: COR.branco,
              transform: `scale(${0.85 + 0.15 * e})`, opacity: e * (d > 0 ? 0.85 : 1),
            }}
          >
            “{frase}”
          </div>
        </AbsoluteFill>
      )}
      {/* respingo de tinta na batida */}
      {d >= 0 && d < 10 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: vertical ? 0 : 120, paddingTop: vertical ? (frase ? 420 : 0) : frase ? 260 : 0 }}>
          <div style={{ width: largura * (1 + d * 0.08), height: altura * (1 + d * 0.2), borderRadius: "50%", border: `6px solid ${cor}`, opacity: 0.5 * (1 - d / 10) }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: vertical ? 0 : 120, paddingTop: vertical ? (frase ? 420 : 0) : frase ? 260 : 0 }}>
        <svg
          width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`}
          style={{ overflow: "visible", transform: `scale(${escala}) rotate(-11deg)`, opacity: opac, filter: `drop-shadow(0 10px 24px rgba(0,0,0,.5))` }}
        >
          <defs>
            <filter id={`gasto-${rotulo}`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="r" />
              <feColorMatrix in="r" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.4" result="m" />
              <feComposite in="SourceGraphic" in2="m" operator="in" />
            </filter>
          </defs>
          <g filter={`url(#gasto-${rotulo})`}>
            <rect x={8} y={8} width={largura - 16} height={altura - 16} rx={22} fill={`${COR.azulEscuro}E6`} stroke={cor} strokeWidth={14} />
            <rect x={26} y={26} width={largura - 52} height={altura - 52} rx={12} fill="none" stroke={cor} strokeWidth={4} />
            <text x={largura / 2} y={altura / 2 + fs * 0.36} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={800} fontSize={fs} fill={cor} letterSpacing={6}>
              {rotulo}
            </text>
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- capítulo */

export const Capitulo: React.FC<{ numero: number; titulo: string; rotulo?: string }> = ({ numero, titulo, rotulo }) => {
  // rotulo: "PRÓLOGO" / "EPÍLOGO" no lugar de "CAPÍTULO N" (o número grande do fundo some)
  const f = useCurrentFrame();
  const vertical = useVertical();
  const e1 = useMola(8, 16);
  const e2 = useMola(14, 15);
  const barra = interpolate(f, [20, 34], [0, 1], cl);
  const tam = vertical ? (titulo.length > 14 ? 92 : 110) : titulo.length > 22 ? 92 : 116;
  return (
    <AbsoluteFill>
      <FundoCosmico />
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${COR.azul}CC 0%, ${COR.azulEscuro}F0 70%)` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: vertical ? 900 : 760, lineHeight: 1, color: "transparent", WebkitTextStroke: `3px ${COR.ciano}`, opacity: 0.1, transform: `scale(${1.08 - 0.08 * e1})` }}>
          {rotulo ? "" : numero}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: vertical ? "0 70px" : "0 160px" }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: vertical ? 44 : 36, letterSpacing: 18, color: COR.ciano, opacity: e1, transform: `translateY(${(1 - e1) * 20}px)` }}>
          {rotulo ? rotulo.toUpperCase() : `CAPÍTULO ${numero}`}
        </div>
        <div
          style={{
            fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: tam, lineHeight: 1.08, color: COR.branco, textAlign: "center",
            textTransform: "uppercase", marginTop: 18, opacity: e2, transform: `translateY(${(1 - e2) * 40}px)`,
            textShadow: `0 12px 40px rgba(0,0,0,.55), 0 0 40px ${COR.azulClaro}66`,
          }}
        >
          {titulo}
        </div>
        <div style={{ width: 240 * barra, height: 10, borderRadius: 5, background: COR.vermelho, marginTop: 34 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------- fim */

export const Fim: React.FC<{ texto?: string; thumb?: string | { linha1: string; destaque: string; selo?: string }; falando: boolean }> = ({ texto, thumb, falando }) => {
  const f = useCurrentFrame();
  const vertical = useVertical();
  const e = useMola(0, 12);
  const et = useMola(6, 11);
  const em = useMola(14, 11);
  const linhas = (texto ?? "VÍDEO COMPLETO|NO CANAL").toUpperCase().split("|");
  const TW = vertical ? 960 : 1040;
  const esc = TW / 1280;
  const pulso = 1 + Math.sin(f / 6) * 0.015;
  const capa =
    typeof thumb === "string" ? (
      <Img src={staticFile(thumb)} style={{ width: 1280, height: 720, objectFit: "cover" }} />
    ) : (
      <Thumb {...(thumb ?? { linha1: "Assista o", destaque: "vídeo completo" })} />
    );
  return (
    <AbsoluteFill>
      <FundoCosmico />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${COR.vermelho}33 0%, transparent 55%)` }} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: vertical ? 210 : 60 }}>
        <div style={{ textAlign: "center", maxWidth: vertical ? 1000 : 1700, transform: `scale(${0.5 + 0.5 * e})`, opacity: e }}>
          {linhas.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: vertical ? 96 : 76, lineHeight: 1.12, color: i === linhas.length - 1 ? COR.amarelo : COR.branco, WebkitTextStroke: `12px ${COR.azulEscuro}`, paintOrder: "stroke fill", textShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
              {l}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: vertical ? 50 : 30, width: TW, height: 720 * esc, position: "relative", borderRadius: 28, overflow: "hidden",
            border: `8px solid ${COR.branco}`, boxShadow: `0 24px 60px rgba(0,0,0,.6), 0 0 ${50 + Math.sin(f / 6) * 20}px ${COR.ciano}66`,
            transform: `scale(${(0.6 + 0.4 * et) * pulso}) rotate(${-2 * et}deg)`, opacity: Math.min(1, et * 1.5),
          }}
        >
          <div style={{ width: 1280, height: 720, transform: `scale(${esc})`, transformOrigin: "top left" }}>{capa}</div>
          <div style={{ position: "absolute", right: 22, bottom: 22 }}>
            <svg width={110} height={110} viewBox="0 0 150 150">
              <circle cx={75} cy={75} r={70} fill={COR.vermelho} stroke={COR.branco} strokeWidth={6} />
              <path d="M60 45 L108 75 L60 105 Z" fill={COR.branco} />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: vertical ? 40 : 40, bottom: vertical ? 300 : -10, transform: `scale(${em}) rotate(-8deg)`, transformOrigin: "bottom left" }}>
        <Mascote tamanho={vertical ? 520 : 380} gesto="apontar" falando={falando} expressao="feliz" />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- camada (switch) */

/** Tipos que desenham o próprio fundo (tela cheia). */
export const DOC_TELA_CHEIA = new Set(["documento", "capitulo", "fim", "vinheta"]);

export const CamadaDocumentario: React.FC<{ cena: Cena; falando: boolean }> = ({ cena, falando }) => {
  const a = cena.animacao;
  switch (a.tipo) {
    case "documento":
      return <Documento {...a} fala={cena.fala} />;
    case "carimbo":
      return <Carimbo texto={a.texto} frase={a.frase} p={a.p} fala={cena.fala} />;
    case "capitulo":
      return <Capitulo numero={a.numero} titulo={a.titulo} rotulo={a.rotulo} />;
    case "fim":
      return <Fim texto={a.texto} thumb={a.thumb} falando={falando} />;
    case "vinheta":
      return <Vinheta />;
    default:
      return null;
  }
};

/** Etiqueta de lugar: vem da animação "local" ou do campo "local" da cena (fica fora do movimento da câmera). */
export const EtiquetaLocal: React.FC<{ cena: Cena }> = ({ cena }) => {
  const l = cena.animacao.tipo === "local" ? cena.animacao : cena.local;
  if (!l) return null;
  return <Local texto={l.texto} ano={l.ano} />;
};
