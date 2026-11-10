import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COR } from "./tema";

const CEREBRO =
  "M230 470 C170 470 160 390 210 370 C190 310 250 270 290 290 C300 230 380 220 410 260 " +
  "C440 215 520 225 530 285 C580 270 630 320 605 370 C655 395 640 475 580 478 " +
  "C570 520 510 535 480 510 C450 540 380 540 360 510 C330 535 260 525 250 490 C240 488 232 480 230 470 Z";

/** Cifrinho: cérebro vermelho com terceiro olho e anel cósmico. */
export const Mascote: React.FC<{ tamanho: number; falando?: boolean; seed?: number }> = ({
  tamanho,
  falando = false,
  seed = 0,
}) => {
  const f = useCurrentFrame() + seed * 37;
  // piscar a cada ~3,5 s
  const ciclo = f % 105;
  const piscar = ciclo > 100 ? interpolate(ciclo, [100, 102.5, 105], [1, 0.1, 1]) : 1;
  const flutuar = Math.sin(f / 18) * 10;
  const giroAnel = Math.sin(f / 40) * 4;
  const brilho = 0.75 + Math.sin(f / 10) * 0.25;
  const boca = falando ? 10 + Math.abs(Math.sin(f / 2.2)) * 14 : 0;

  const olho = (x: number) => (
    <g transform={`translate(${x} 405) scale(1 ${piscar}) translate(${-x} -405)`}>
      <circle cx={x} cy={405} r={44} fill={COR.branco} />
      <circle cx={x + 6} cy={412} r={26} fill={COR.azulEscuro} />
      <circle cx={x + 6} cy={412} r={12} fill={COR.azulClaro} opacity={0.6} />
      <circle cx={x - 4} cy={400} r={10} fill="#fff" />
      <circle cx={x + 16} cy={424} r={4} fill="#fff" />
    </g>
  );
  const anel = (
    <ellipse cx={410} cy={410} rx={300} ry={68} fill="none" stroke={COR.ciano} strokeWidth={7} opacity={0.95} />
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
        {olho(355)}
        {olho(470)}
        <ellipse cx={312} cy={452} rx={24} ry={13} fill="#FF9AAA" opacity={0.75} />
        <ellipse cx={513} cy={452} rx={24} ry={13} fill="#FF9AAA" opacity={0.75} />
        {falando ? (
          <ellipse cx={413} cy={468} rx={22} ry={boca / 2 + 3} fill={COR.azulEscuro} />
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
      </g>
    </svg>
  );
};
