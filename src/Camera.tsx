/**
 * Câmera "documentário": toda cena tem um movimento lento e contínuo, e a troca de cena é uma fusão.
 *
 * No roteiro (opcional, por cena):
 *   "camera":    "push" (aproxima 1,00→1,07) | "pan" (desliza de lado) | "parada"
 *   "transicao": "fusao" (padrão, ~0,5 s) | "corte" (seco) | "preto" (fade para o preto, entre capítulos)
 * Sem "camera", alterna push/pan pela id da cena (sempre igual a cada render).
 * Cena com "lofi": "forte" entra com glitch em vez de fusão.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Cena, COR } from "./tema";

export type TipoCamera = "push" | "pan" | "parada";
export type TipoTransicao = "fusao" | "corte" | "preto" | "glitch";

export const FUSAO = { longo: 15, short: 12 }; // frames da fusão (0,5 s / 0,4 s)
export const PRETO = 12; // frames de cada metade do fade para o preto

const SEMPRE_PARADA = new Set(["vinheta", "fim"]);
const SEMPRE_PUSH = new Set(["documento", "capitulo", "carimbo"]);

export const cameraDaCena = (c: Cena): TipoCamera => {
  if (c.camera) return c.camera;
  const t = c.animacao.tipo;
  if (SEMPRE_PARADA.has(t)) return "parada";
  if (SEMPRE_PUSH.has(t)) return "push";
  return c.id % 2 === 1 ? "push" : "pan";
};

export const transicaoDaCena = (c: Cena, anterior?: Cena): TipoTransicao => {
  if (!anterior) return "corte"; // primeira cena do vídeo
  if (c.transicao) return c.transicao;
  const capitulo = (x: Cena) => (x.animacao.tipo as string) === "capitulo";
  if (capitulo(c) || capitulo(anterior)) return "preto";
  if (c.lofi === "forte") return "glitch";
  return "fusao";
};

const suave = Easing.bezier(0.45, 0, 0.55, 1);

/** Transformações de fundo e primeiro plano (parallax: o fundo anda menos). */
export const useCamera = (tipo: TipoCamera, total: number, id: number) => {
  const f = useCurrentFrame();
  const p = suave(Math.min(1, Math.max(0, f / Math.max(1, total))));
  if (tipo === "parada") return { fundo: "scale(1)", frente: "scale(1)" };
  if (tipo === "push") {
    const forte = 0.06 + random(`cam${id}`) * 0.02; // 1,06 a 1,08
    return {
      fundo: `scale(${1.02 + forte * 0.5 * p})`,
      frente: `scale(${1 + forte * p})`,
    };
  }
  const lado = Math.floor(id / 2) % 2 === 0 ? 1 : -1; // alterna a direção do pan
  const x = (p - 0.5) * 2 * lado;
  return {
    fundo: `scale(1.06) translateX(${x * 16}px)`,
    frente: `scale(1.035) translateX(${x * 34}px)`,
  };
};

/** Opacidade de entrada da cena (fusão) e véu preto (fade para o preto). */
export const useTransicao = (entrada: TipoTransicao, saida: TipoTransicao, dur: number, fusao: number) => {
  const f = useCurrentFrame();
  const opacidade = entrada === "fusao" ? suave(Math.min(1, f / fusao)) : 1;
  let preto = 0;
  if (entrada === "preto") preto = Math.max(preto, interpolate(f, [0, PRETO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  if (saida === "preto") preto = Math.max(preto, interpolate(f, [dur - PRETO, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return { opacidade, preto };
};

/** Quantos frames a cena continua por baixo da próxima (para a fusão acontecer). */
export const sobra = (saida: TipoTransicao, fusao: number) => (saida === "fusao" ? fusao : saida === "glitch" ? 2 : 0);

/** Glitch de entrada (só cenas com lofi "forte"): faixas coloridas e tremida por ~8 frames. */
export const GlitchEntrada: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 8) return null;
  const k = 1 - f / 9;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {new Array(7).fill(0).map((_, i) => {
        const y = random(`gy${i}-${f}`) * 100;
        const h = 1 + random(`gh${i}-${f}`) * 7;
        const dx = (random(`gx${i}-${f}`) - 0.5) * 160 * k;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: 0, right: 0, top: `${y}%`, height: `${h}%`,
              background: i % 2 ? COR.vermelho : COR.ciano, opacity: 0.35 * k, transform: `translateX(${dx}px)`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: f < 2 ? 0.35 : 0 }} />
    </AbsoluteFill>
  );
};

/** Deslocamento horizontal da cena durante o glitch de entrada. */
export const tremidaGlitch = (f: number) => (f > 8 ? 0 : Math.sin(f * 5.1) * 18 * (1 - f / 9));
