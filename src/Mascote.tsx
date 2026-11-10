import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR } from "./tema";
import { Expressao, Gesto, braco, usePose } from "./personagens/Boneco";

const CEREBRO =
  "M230 470 C170 470 160 390 210 370 C190 310 250 270 290 290 C300 230 380 220 410 260 " +
  "C440 215 520 225 530 285 C580 270 630 320 605 370 C655 395 640 475 580 478 " +
  "C570 520 510 535 480 510 C450 540 380 540 360 510 C330 535 260 525 250 490 C240 488 232 480 230 470 Z";

/** Cifrinho: cérebro vermelho com terceiro olho, anel cósmico, braços e expressões. */
export const Mascote: React.FC<{
  tamanho: number;
  falando?: boolean;
  seed?: number;
  gesto?: Gesto;
  gestoAnterior?: Gesto;
  expressao?: Expressao;
}> = ({ tamanho, falando = false, seed = 0, gesto, gestoAnterior, expressao }) => {
  const f = useCurrentFrame() + seed * 37;
  const g: Gesto = gesto ?? (falando ? "explicar" : "parado");
  const exp: Expressao = expressao ?? (g === "surpreso" ? "surpreso" : g === "pensar" ? "pensativo" : "feliz");
  const [a1e, a2e, a1d, a2d] = usePose(g, gestoAnterior, falando);
  const E = braco(222, 432, -1, a1e + 40, a2e, 58, 54);
  const D = braco(610, 432, 1, a1d + 40, a2d, 58, 54);

  const ciclo = f % 105;
  const piscar = ciclo > 100 ? interpolate(ciclo, [100, 102.5, 105], [1, 0.1, 1]) : 1;
  const abre = exp === "surpreso" ? 1.18 : 1;
  const flutuar = Math.sin(f / 18) * 10;
  const giroAnel = Math.sin(f / 40) * 4;
  const brilho = exp === "surpreso" ? 1 : 0.75 + Math.sin(f / 10) * 0.25;
  const boca = falando ? 10 + Math.abs(Math.sin(f / 2.2)) * 14 : 0;
  const ox = exp === "pensativo" ? -8 : 0;
  const oy = exp === "pensativo" ? -10 : 0;

  const olho = (x: number, fechado = false) => (
    <g transform={`translate(${x} 405) scale(1 ${fechado ? 0.1 : piscar * abre}) translate(${-x} -405)`}>
      <circle cx={x} cy={405} r={44} fill={COR.branco} />
      <circle cx={x + 6 + ox} cy={412 + oy} r={26} fill={COR.azulEscuro} />
      <circle cx={x + 6 + ox} cy={412 + oy} r={12} fill={COR.azulClaro} opacity={0.6} />
      <circle cx={x - 4 + ox} cy={400 + oy} r={10} fill="#fff" />
      <circle cx={x + 16 + ox} cy={424 + oy} r={4} fill="#fff" />
    </g>
  );
  const sobr = (x: number, lado: number) =>
    exp === "bravo" || exp === "pensativo" ? (
      <path
        d={`M${x - 30} ${352 + (exp === "bravo" ? 12 * lado : -6 * lado)} L${x + 30} ${352 - (exp === "bravo" ? 12 * lado : -6 * lado)}`}
        stroke={COR.azulEscuro}
        strokeWidth={10}
        strokeLinecap="round"
      />
    ) : null;
  const anel = (
    <ellipse cx={410} cy={410} rx={300} ry={68} fill="none" stroke={COR.ciano} strokeWidth={7} opacity={0.95} />
  );
  const bracinho = (b: ReturnType<typeof braco>, x0: number) => (
    <>
      <path d={`M${x0} 432 L${b.cx} ${b.cy} L${b.mx} ${b.my}`} stroke={COR.vermelhoEsc} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={b.mx} cy={b.my} r={21} fill={COR.branco} stroke={COR.azulEscuro} strokeWidth={5} />
    </>
  );

  return (
    <svg width={tamanho} height={tamanho} viewBox="100 150 620 520" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="mCerebro" cx="40%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FF7A86" />
          <stop offset=".55" stopColor={COR.vermelho} />
          <stop offset="1" stopColor={COR.vermelhoEsc} />
        </radialGradient>
        <filter id="mBrilho" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="mFrente">
          <rect x="0" y="410" width="800" height="200" />
        </clipPath>
      </defs>
      <g transform={`translate(0 ${flutuar})`}>
        <g transform={`rotate(${-14 + giroAnel} 410 410)`}>{anel}</g>
        <path d={CEREBRO} fill="url(#mCerebro)" />
        <g fill="none" stroke="#FFB3BB" strokeWidth={7} strokeLinecap="round" opacity={0.55}>
          <path d="M410 262 C396 296 424 318 408 346" />
          <path d="M285 330 C310 320 330 336 345 325" />
          <path d="M520 312 C500 300 482 318 468 306" />
          <path d="M240 420 C262 410 270 430 290 424" />
          <path d="M590 410 C570 402 560 422 540 414" />
        </g>
        {sobr(355, -1)}
        {sobr(470, 1)}
        {olho(355)}
        {olho(470, exp === "piscadela")}
        <ellipse cx={312} cy={452} rx={24} ry={13} fill="#FF9AAA" opacity={0.75} />
        <ellipse cx={513} cy={452} rx={24} ry={13} fill="#FF9AAA" opacity={0.75} />
        {exp === "surpreso" ? (
          <ellipse cx={413} cy={470} rx={16} ry={20} fill={COR.azulEscuro} />
        ) : falando ? (
          <ellipse cx={413} cy={468} rx={22} ry={boca / 2 + 3} fill={COR.azulEscuro} />
        ) : exp === "pensativo" || exp === "bravo" ? (
          <path d="M392 470 L434 464" stroke={COR.azulEscuro} strokeWidth={8} strokeLinecap="round" />
        ) : (
          <path d="M386 462 Q412 486 440 462" fill="none" stroke={COR.azulEscuro} strokeWidth={8} strokeLinecap="round" />
        )}
        <g filter="url(#mBrilho)" opacity={brilho}>
          <path d="M384 316 Q412 294 440 316 Q412 338 384 316 Z" fill={COR.ciano} />
          <circle cx={412} cy={316} r={8} fill={COR.azulEscuro} />
        </g>
        <g transform={`rotate(${-14 + giroAnel} 410 410)`} clipPath="url(#mFrente)">
          {anel}
          <circle cx={660} cy={440} r={14} fill={COR.ciano} filter="url(#mBrilho)" />
        </g>
        {bracinho(E, 222)}
        {bracinho(D, 610)}
      </g>
    </svg>
  );
};
