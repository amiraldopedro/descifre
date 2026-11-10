import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import elencoJson from "../../elenco.json";
import { Mascote } from "../Mascote";
import { COR, FONTE_TITULO } from "../tema";
import { Boneco, Expressao, Gesto, Visual } from "./Boneco";

export type AtorCena = {
  id: string;
  gesto?: Gesto;
  gestoAnterior?: Gesto;
  expressao?: Expressao;
  entrada?: "pop" | "deslizar" | "teletransporte" | "cair";
  lado?: "esquerda" | "direita" | "centro";
  novo?: boolean; // preenchido pelo montar.py: acabou de entrar em cena
  apresentar?: boolean; // primeira aparição no vídeo: mostra a plaquinha com o nome
};

type Ficha = { nome: string; tipo: string; visual?: Visual };
const ELENCO = elencoJson as unknown as Record<string, Ficha>;

const Ator: React.FC<{ a: AtorCena; lado: "esquerda" | "direita" | "centro"; falando: boolean; apagado: boolean; alt: number; x: number; base: number }> = ({
  a,
  lado,
  falando,
  apagado,
  alt,
  x,
  base,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ficha = ELENCO[a.id] ?? ELENCO.homem;
  const entrada = a.novo ? a.entrada ?? "pop" : null;
  const k = entrada ? spring({ frame: f, fps, config: { damping: entrada === "cair" ? 8 : 12, stiffness: 170, mass: 0.7 } }) : 1;
  const dir = lado === "direita" ? 1 : -1;
  let tf = "";
  let op = 1;
  if (entrada === "pop") tf = `scale(${k})`;
  if (entrada === "deslizar") tf = `translateX(${(1 - k) * 700 * dir}px)`;
  if (entrada === "cair") tf = `translateY(${-(1 - k) * 1000}px)`;
  if (entrada === "teletransporte") {
    const t = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
    tf = `scale(${0.15 + 0.85 * t}, ${1.6 - 0.6 * t})`;
    op = f < 10 ? (f % 2 ? 1 : 0.35) : 1;
  }
  const largura = ficha.tipo === "mascote" ? alt * 0.92 : (alt * 400) / 560;
  const destaque = falando ? 1.04 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - largura / 2,
        bottom: base,
        width: largura,
        transform: tf,
        transformOrigin: "50% 100%",
        opacity: op,
        filter: apagado ? "brightness(.72) saturate(.8)" : undefined,
      }}
    >
      {entrada === "teletransporte" && f < 16 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: 26 + f * 10,
            height: alt * 1.6,
            marginLeft: -(13 + f * 5),
            background: `linear-gradient(180deg, transparent, ${COR.ciano}, #fff)`,
            opacity: interpolate(f, [0, 16], [0.95, 0]),
            filter: "blur(6px)",
          }}
        />
      )}
      <div style={{ transform: `scale(${destaque}) scaleX(${lado === "direita" ? -1 : 1})`, transformOrigin: "50% 100%", lineHeight: 0 }}>
        {ficha.tipo === "mascote" ? (
          <Mascote tamanho={largura} falando={falando} gesto={a.gesto} gestoAnterior={a.gestoAnterior} expressao={a.expressao} />
        ) : (
          <Boneco visual={ficha.visual!} altura={alt} falando={falando} gesto={a.gesto} gestoAnterior={a.gestoAnterior} expressao={a.expressao} seed={a.id.length} />
        )}
      </div>
      {a.apresentar && ficha.nome && ficha.tipo !== "mascote" && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -alt * 0.12,
            transform: `translateX(-50%) scale(${spring({ frame: f - 10, fps, config: { damping: 11 } })}) rotate(-2deg)`,
            background: COR.amarelo,
            color: COR.azulEscuro,
            fontFamily: FONTE_TITULO,
            fontWeight: 800,
            fontSize: alt * 0.062,
            padding: "8px 22px",
            borderRadius: 12,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 0 rgba(0,0,0,.35)",
          }}
        >
          {ficha.nome.toUpperCase()}
        </div>
      )}
    </div>
  );
};

/** Palco: posiciona até 2 (máx. 3) personagens e anima quem fala. */
export const Palco: React.FC<{ atores: AtorCena[]; quemFala: string; falando: boolean; temAnim: boolean }> = ({ atores, quemFala, falando, temAnim }) => {
  const { width: W, height: H } = useVideoConfig();
  const vertical = H > W;
  const alt = vertical ? 500 : temAnim ? 520 : 640;
  const base = vertical ? 470 : 170;
  const xs = vertical ? { esquerda: 0.26, centro: 0.5, direita: 0.74 } : { esquerda: 0.17, centro: 0.5, direita: 0.83 };
  const padrao = (i: number): "esquerda" | "direita" | "centro" =>
    atores.length === 1 ? (temAnim ? "esquerda" : "centro") : i === 0 ? "esquerda" : i === 1 ? "direita" : "centro";
  const alguemFala = atores.some((a) => a.id === quemFala);
  return (
    <>
      {atores.map((a, i) => {
        const lado = a.lado ?? padrao(i);
        return (
          <Ator
            key={a.id + i}
            a={a}
            lado={lado}
            falando={falando && a.id === quemFala}
            apagado={atores.length > 1 && alguemFala && a.id !== quemFala}
            alt={alt}
            x={W * xs[lado]}
            base={base}
          />
        );
      })}
    </>
  );
};
