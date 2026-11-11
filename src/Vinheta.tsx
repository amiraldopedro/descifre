/**
 * Vinheta de abertura (3,5 s = 105 frames), sempre igual em todos os vídeos.
 *  0–26   close no Cifrinho: o terceiro olho abre (som "sobe" em 0,25 s)
 *  26–34  brilho do olho (som "brilho" em 0,87 s)
 *  30–60  a câmera recua e um anel ciano se espalha, "decifrando" a tela (som "whoosh" em 1,0 s)
 *  52–76  as letras DESCIFRE se decifram uma a uma (8 clicks)
 *  76–90  slogan "DESCIFRE E DOMINE" (brilho em 2,5 s)
 * Os tempos dos sons estão em SONS_VINHETA (scripts/montar.py).
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { FundoCosmico } from "./Fundo";
import { Mascote } from "./Mascote";
import { COR, FONTE_TEXTO, FONTE_TITULO } from "./tema";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.65, 0, 0.35, 1);
const SIMBOLOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&?<>/";
const simbolo = (semente: string) => SIMBOLOS[Math.floor(random(semente) * SIMBOLOS.length)];
const LOGO = "DESCIFRE";

export const Vinheta: React.FC = () => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const vertical = H > W;

  // Cifrinho: posição do terceiro olho dentro do SVG (viewBox "100 150 620 520", ponto 412,316)
  const S = vertical ? 600 : 520;
  const k = S / 620;
  const olhoX = (412 - 100) * k;
  const olhoY = (S - 520 * k) / 2 + (316 - 150) * k;
  const E = { x: W / 2, y: H * (vertical ? 0.33 : 0.29) };
  const zoom = interpolate(f, [28, 54], [9, 1], { ...cl, easing: suave });
  const abre = interpolate(f, [8, 26], [0, 1], { ...cl, easing: Easing.out(Easing.back(1.6)) });
  const entrada = interpolate(f, [0, 10], [0, 1], cl);

  // anel que decifra a tela
  const rAnel = interpolate(f, [30, 62], [30, Math.hypot(W, H) * 0.75], { ...cl, easing: Easing.out(Easing.cubic) });
  const anelVisivel = f >= 30 && f < 70;
  const dentroDoAnel = (x: number, y: number) => {
    if (f < 30) return false;
    const dx = (x - E.x) / rAnel;
    const dy = (y - E.y) / (rAnel * 0.62);
    return dx * dx + dy * dy < 1;
  };

  // grade de símbolos "cifrados"
  const passo = vertical ? 72 : 64;
  const cols = Math.ceil(W / passo);
  const linhas = Math.ceil(H / passo);
  const troca = Math.floor(f / 3);
  const brilhoOlho = interpolate(f, [24, 29, 40], [0, 1, 0], cl);
  const tamLogo = vertical ? 132 : 150;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: entrada }}>
        <FundoCosmico />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {new Array(cols * linhas).fill(0).map((_, i) => {
            const cx = (i % cols) * passo + passo / 2;
            const cy = Math.floor(i / cols) * passo + passo / 2;
            if (dentroDoAnel(cx, cy)) return null;
            return (
              <text key={i} x={cx} y={cy} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={500} fontSize={22} fill={COR.ciano} opacity={0.1 + random(`o${i}`) * 0.16}>
                {simbolo(`s${i}-${troca}`)}
              </text>
            );
          })}
          {anelVisivel && (
            <g transform={`rotate(-14 ${E.x} ${E.y})`} fill="none">
              <ellipse cx={E.x} cy={E.y} rx={rAnel} ry={rAnel * 0.62} stroke={COR.ciano} strokeWidth={interpolate(f, [30, 62], [14, 3], cl)} opacity={interpolate(f, [56, 70], [1, 0], cl)} />
              <ellipse cx={E.x} cy={E.y} rx={rAnel * 0.86} ry={rAnel * 0.86 * 0.62} stroke={COR.ciano} strokeWidth={2} opacity={interpolate(f, [52, 66], [0.5, 0], cl)} />
            </g>
          )}
        </svg>
      </AbsoluteFill>

      {/* Cifrinho: começa em close no terceiro olho e recua */}
      <div
        style={{
          position: "absolute", left: E.x - olhoX, top: E.y - olhoY, width: S, height: S,
          transform: `scale(${zoom})`, transformOrigin: `${olhoX}px ${olhoY}px`, opacity: entrada,
        }}
      >
        <Mascote tamanho={S} terceiroOlho={abre} flutua={false} />
      </div>
      {/* clarão do olho */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${E.x}px ${E.y}px, ${COR.ciano} 0%, ${COR.ciano}55 ${8 + brilhoOlho * 10}%, transparent ${18 + brilhoOlho * 30}%)`, opacity: brilhoOlho, mixBlendMode: "screen" }} />

      {/* logo decifrada letra por letra */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: H * (vertical ? 0.55 : 0.6) }}>
        <div style={{ display: "flex", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: tamLogo, lineHeight: 1, letterSpacing: 4, textShadow: `0 10px 40px rgba(0,0,0,.6)` }}>
          {LOGO.split("").map((letra, i) => {
            const revela = 55 + i * 3;
            const pronta = f >= revela;
            const pulo = pronta ? interpolate(f, [revela, revela + 4], [1.25, 1], cl) : 1;
            // a letra certa ocupa o lugar (layout fixo); por cima, um símbolo embaralhado até ela ser decifrada
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", transform: `scale(${pulo})` }}>
                <span style={{ color: i === 3 ? COR.vermelho : COR.branco, opacity: pronta ? 1 : 0 }}>{letra}</span>
                {!pronta && f >= 52 && (
                  <span style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", color: COR.ciano, opacity: 0.7 }}>
                    {simbolo(`l${i}-${Math.floor(f / 2)}`)}
                  </span>
                )}
              </span>
            );
          })}
        </div>
        <div style={{ width: interpolate(f, [76, 88], [0, vertical ? 320 : 380], cl), height: 8, borderRadius: 4, background: COR.vermelho, marginTop: 26 }} />
        <div
          style={{
            fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: vertical ? 40 : 38, letterSpacing: 16, color: COR.ciano, marginTop: 22,
            opacity: interpolate(f, [78, 90], [0, 1], cl), transform: `translateY(${interpolate(f, [78, 90], [16, 0], cl)}px)`,
          }}
        >
          DESCIFRE E DOMINE
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
