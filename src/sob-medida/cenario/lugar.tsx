/**
 * Cenário cinematográfico 2D (estilo documentário animado): lugar em silhueta, em camadas, com luz e parallax.
 * Use em qualquer vídeo: {"tipo":"sobmedida","nome":"cenario/lugar","props":{"lugar":"universidade","hora":"noite"}}
 *
 * props.lugar: universidade | laboratorio | corredor | cidade | acampamento | hospital | governo
 * props.hora:  noite (padrão) | dourado | dia
 * props.pessoa: "andando" põe uma silhueta atravessando a cena; "parada" deixa uma silhueta olhando o lugar
 * props.luz:   true acende holofotes/feixes de luz no céu (lugares externos)
 * props.figuras: personagens ilustrados no chão do cenário:
 *   [{"traje":"camponesa","pose":"dancando","rosto":"riso","x":900,"escala":1,"fundo":0,"seed":3,"entra":0.2}]
 *   x em pixels (0..1920), fundo 0 (perto) .. 1 (longe), entra = proporção da fala em que aparece
 * props.multidao: {"n":14,"traje":"camponesa","pose":"dancando","rosto":"riso","entra":0.3,"intensidade":0.8,"contagio":true}
 *   (contagio: as pessoas começam a dançar uma de cada vez, da esquerda para a direita)
 * lugares extras: vila-medieval | vila-puritana | sala-radio | escola
 * As camadas andam em velocidades diferentes (o fundo mais devagar), então a cena nunca fica parada.
 */
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COR } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Figura, type PropsFigura } from "../../ilustra/Figura";

export const sons: SomCena[] = [{ som: "whoosh", p: 0.01, vol: 0.5 }];

type Hora = "noite" | "dourado" | "dia";
const CEUS: Record<Hora, [string, string, string]> = {
  noite: ["#050A26", "#101E5A", "#26357A"],
  dourado: ["#2A1A4E", "#C2546A", "#FFB45E"],
  dia: ["#4F86D9", "#8DB8F0", "#D6E7FA"],
};
// cor das silhuetas: longe -> perto
const CAMADAS: Record<Hora, [string, string, string]> = {
  noite: ["#1A2766", "#111A4A", "#070D2E"],
  dourado: ["#6B3A6E", "#40244F", "#1E1230"],
  dia: ["#7C95C4", "#4E6597", "#24345E"],
};
const JANELA: Record<Hora, string> = { noite: "#FFD27A", dourado: "#FFE2A0", dia: "#CFE4FA" };

const W = 1920, H = 1080, CHAO = 840;

const rnd = (k: string) => random(`cen-${k}`);

/* ---------------------------------------------------------------- peças de silhueta */

const Morros: React.FC<{ y: number; amp: number; cor: string; seed: string; largura?: number }> = ({ y, amp, cor, seed, largura = W + 600 }) => {
  const pts: string[] = [];
  for (let x = -300; x <= largura; x += 80) pts.push(`${x} ${y - (Math.sin(x / 260 + rnd(seed) * 6) * 0.6 + rnd(seed + x) * 0.4) * amp}`);
  return <path d={`M-300 ${H} L${pts.join(" L")} L${largura} ${H} Z`} fill={cor} />;
};

const Pinheiro: React.FC<{ x: number; base: number; h: number; cor: string }> = ({ x, base, h, cor }) => (
  <path d={`M${x} ${base - h} L${x + h * 0.22} ${base - h * 0.55} L${x + h * 0.12} ${base - h * 0.55} L${x + h * 0.3} ${base - h * 0.15} L${x + 6} ${base - h * 0.15} L${x + 6} ${base} L${x - 6} ${base} L${x - 6} ${base - h * 0.15} L${x - h * 0.3} ${base - h * 0.15} L${x - h * 0.12} ${base - h * 0.55} L${x - h * 0.22} ${base - h * 0.55} Z`} fill={cor} />
);

const Arvore: React.FC<{ x: number; base: number; h: number; cor: string }> = ({ x, base, h, cor }) => (
  <g fill={cor}>
    <rect x={x - 7} y={base - h * 0.45} width={14} height={h * 0.45} />
    <circle cx={x} cy={base - h * 0.62} r={h * 0.3} />
    <circle cx={x - h * 0.2} cy={base - h * 0.5} r={h * 0.22} />
    <circle cx={x + h * 0.2} cy={base - h * 0.52} r={h * 0.22} />
  </g>
);

const Janelas: React.FC<{ x: number; y: number; cols: number; lins: number; dx: number; dy: number; w: number; h: number; cor: string; seed: string; f: number; acesas?: number }> = ({ x, y, cols, lins, dx, dy, w, h, cor, seed, f, acesas = 0.55 }) => (
  <g>
    {Array.from({ length: cols * lins }).map((_, i) => {
      const c = i % cols, l = Math.floor(i / cols);
      const r = rnd(`${seed}-${i}`);
      if (r > acesas) return null;
      const pisca = r < 0.04 ? 0.6 + 0.4 * Math.sin(f / (6 + r * 40)) : 1;
      return <rect key={i} x={x + c * dx} y={y + l * dy} width={w} height={h} rx={2} fill={cor} opacity={(0.65 + r * 0.35) * pisca} />;
    })}
  </g>
);

const Estrelas: React.FC<{ f: number; n?: number }> = ({ f, n = 90 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const x = rnd(`ex${i}`) * W, y = rnd(`ey${i}`) * 520;
      const o = 0.35 + 0.65 * Math.abs(Math.sin(f / (20 + rnd(`et${i}`) * 40) + i));
      return <circle key={i} cx={x} cy={y} r={rnd(`er${i}`) * 1.8 + 0.6} fill="#FFFFFF" opacity={o * 0.8} />;
    })}
  </g>
);

const Feixes: React.FC<{ f: number }> = ({ f }) => (
  <g opacity={0.22}>
    {[0, 1, 2].map((i) => {
      const a = Math.sin(f / (70 + i * 23) + i * 2) * 22 + (i - 1) * 25;
      const x = 380 + i * 580;
      return (
        <polygon key={i} points={`${x - 6},${CHAO} ${x + 6},${CHAO} ${x + 140},-60 ${x - 140},-60`} fill="url(#feixe)" transform={`rotate(${a} ${x} ${CHAO})`} />
      );
    })}
  </g>
);

const Silhueta: React.FC<{ x: number; base: number; escala?: number; cor: string; f: number; andando?: boolean }> = ({ x, base, escala = 1, cor, f, andando }) => {
  const c = andando ? Math.sin(f / 4) : 0;
  return (
    <g transform={`translate(${x} ${base}) scale(${escala})`} fill={cor}>
      <circle cx={0} cy={-150} r={17} />
      <path d="M-20 -128 Q0 -136 20 -128 L24 -60 L-24 -60 Z" />
      <path d={`M-14 -62 L${-16 + c * 18} 0 L${-6 + c * 18} 0 L0 -56 L${6 - c * 18} 0 L${16 - c * 18} 0 L14 -62 Z`} />
      <path d={`M-20 -124 L${-30 - c * 10} -72 L${-22 - c * 10} -70 L-12 -112 Z M20 -124 L${30 + c * 10} -72 L${22 + c * 10} -70 L12 -112 Z`} />
    </g>
  );
};

/* ---------------------------------------------------------------- lugares */

const Universidade: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => (
  <g>
    {/* prédio gótico com torre */}
    <g fill={c[1]}>
      <rect x={620} y={470} width={680} height={CHAO - 470} />
      <polygon points="600,470 960,330 1320,470" />
      <rect x={890} y={190} width={140} height={300} />
      <polygon points="880,190 960,90 1040,190" />
      {[640, 760, 1160, 1260].map((x) => <polygon key={x} points={`${x},470 ${x + 18},420 ${x + 36},470`} />)}
      <rect x={380} y={560} width={260} height={CHAO - 560} />
      <rect x={1280} y={560} width={260} height={CHAO - 560} />
    </g>
    <circle cx={960} cy={260} r={34} fill={jan} opacity={0.85} />
    <path d="M960 260 L960 238 M960 260 L976 268" stroke={c[2]} strokeWidth={5} strokeLinecap="round" />
    <Janelas x={660} y={520} cols={10} lins={4} dx={64} dy={74} w={28} h={46} cor={jan} seed="uni" f={f} />
    <Janelas x={400} y={600} cols={4} lins={3} dx={60} dy={70} w={26} h={40} cor={jan} seed="uni2" f={f} acesas={0.4} />
    <Janelas x={1300} y={600} cols={4} lins={3} dx={60} dy={70} w={26} h={40} cor={jan} seed="uni3" f={f} acesas={0.4} />
    <path d="M920 840 L920 740 Q960 700 1000 740 L1000 840 Z" fill={jan} opacity={0.6} />
  </g>
);

const Cidade: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => (
  <g>
    {Array.from({ length: 14 }).map((_, i) => {
      const w = 110 + rnd(`cw${i}`) * 90, h = 220 + rnd(`ch${i}`) * 300, x = i * 150 - 60;
      return (
        <g key={i}>
          <rect x={x} y={CHAO - h} width={w} height={h} fill={i % 2 ? c[1] : c[0]} />
          <Janelas x={x + 14} y={CHAO - h + 20} cols={Math.floor((w - 20) / 26)} lins={Math.floor((h - 40) / 34)} dx={26} dy={34} w={12} h={18} cor={jan} seed={`cj${i}`} f={f} acesas={0.35} />
          {rnd(`ct${i}`) > 0.6 && <rect x={x + w * 0.4} y={CHAO - h - 50} width={8} height={50} fill={c[0]} />}
        </g>
      );
    })}
    {/* poste com luz */}
    <rect x={1500} y={600} width={10} height={CHAO - 600} fill={c[2]} />
    <path d="M1505 600 Q1530 585 1555 600" stroke={c[2]} strokeWidth={8} fill="none" />
    <circle cx={1555} cy={606} r={9} fill={jan} />
    <polygon points={`1545,612 1565,612 1660,${CHAO} 1450,${CHAO}`} fill={jan} opacity={0.12} />
  </g>
);

const Acampamento: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => {
  const fogo = 0.8 + 0.2 * Math.sin(f / 2.3) * Math.sin(f / 3.7);
  return (
    <g>
      {Array.from({ length: 22 }).map((_, i) => <Pinheiro key={i} x={i * 95 - 40} base={CHAO - 120} h={160 + rnd(`pa${i}`) * 120} cor={c[0]} />)}
      {/* lago */}
      <rect x={-50} y={CHAO - 120} width={W + 100} height={60} fill={c[0]} opacity={0.6} />
      {/* cabanas */}
      {[300, 1350].map((x, i) => (
        <g key={x} fill={c[1]}>
          <rect x={x} y={CHAO - 150} width={240} height={150} />
          <polygon points={`${x - 20},${CHAO - 150} ${x + 120},${CHAO - 240} ${x + 260},${CHAO - 150}`} />
          <rect x={x + 30} y={CHAO - 110} width={40} height={36} fill={jan} opacity={0.8} />
          <rect x={x + 170} y={CHAO - 110} width={40} height={36} fill={jan} opacity={i ? 0.3 : 0.8} />
        </g>
      ))}
      {/* fogueira */}
      <circle cx={960} cy={CHAO - 20} r={260 * fogo} fill="url(#brilho)" />
      <path d={`M930 ${CHAO} Q945 ${CHAO - 60 * fogo} 960 ${CHAO - 95 * fogo} Q975 ${CHAO - 60 * fogo} 990 ${CHAO} Z`} fill="#FF8A3D" />
      <path d={`M945 ${CHAO} Q955 ${CHAO - 40 * fogo} 960 ${CHAO - 62 * fogo} Q965 ${CHAO - 40 * fogo} 975 ${CHAO} Z`} fill="#FFD84D" />
      {/* bandeiras dos dois grupos */}
      {[[700, COR.vermelho], [1220, COR.ciano]].map(([x, cor]) => (
        <g key={String(x)}>
          <rect x={Number(x)} y={CHAO - 260} width={6} height={260} fill={c[2]} />
          <path d={`M${Number(x) + 6} ${CHAO - 258} q40 ${Math.sin(f / 8) * 8} 80 0 l0 46 q-40 ${Math.sin(f / 8 + 1) * 8} -80 0 Z`} fill={String(cor)} opacity={0.85} />
        </g>
      ))}
    </g>
  );
};

const Hospital: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => (
  <g>
    <g fill={c[1]}>
      <rect x={260} y={430} width={1400} height={CHAO - 430} />
      <polygon points="230,430 960,330 1690,430" />
      <rect x={880} y={260} width={160} height={180} />
      <polygon points="870,260 960,200 1050,260" />
    </g>
    <Janelas x={300} y={470} cols={22} lins={5} dx={60} dy={70} w={24} h={44} cor={jan} seed="hos" f={f} acesas={0.3} />
    {/* grades nas janelas */}
    <g stroke={c[2]} strokeWidth={3} opacity={0.8}>
      {Array.from({ length: 22 }).map((_, i) => <path key={i} d={`M${312 + i * 60} 470 L${312 + i * 60} 820`} />)}
    </g>
    {/* cerca */}
    <g stroke={c[2]} strokeWidth={6}>
      <path d={`M-50 ${CHAO - 70} L${W + 50} ${CHAO - 70}`} />
      {Array.from({ length: 40 }).map((_, i) => <path key={i} d={`M${i * 50} ${CHAO} L${i * 50} ${CHAO - 110} l-8 12 M${i * 50} ${CHAO - 110} l8 12`} />)}
    </g>
  </g>
);

const Governo: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan }) => (
  <g>
    <g fill={c[1]}>
      <rect x={560} y={560} width={800} height={CHAO - 560} />
      <polygon points="520,560 960,420 1400,560" />
      <rect x={540} y={555} width={840} height={18} />
      <ellipse cx={960} cy={420} rx={160} ry={130} />
      <rect x={945} y={250} width={30} height={60} />
      <rect x={500} y={CHAO - 40} width={920} height={40} />
    </g>
    {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={600 + i * 88} y={590} width={26} height={CHAO - 630} fill={c[2]} opacity={0.6} />)}
    <rect x={930} y={680} width={60} height={120} fill={jan} opacity={0.5} />
  </g>
);


/* ---------------------------------------------------------------- lugares do documentário de histeria coletiva */

const VilaMedieval: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => (
  <g>
    {/* catedral com uma torre só, ao fundo */}
    <g fill={c[0]}>
      <rect x={1180} y={300} width={300} height={CHAO - 300} />
      <polygon points="1180,300 1330,200 1480,300" />
      <rect x={1290} y={70} width={80} height={260} />
      <polygon points="1280,80 1330,-60 1380,80" />
      <circle cx={1330} cy={380} r={46} fill={jan} opacity={0.5} />
    </g>
    {/* casas enxaimel */}
    {Array.from({ length: 7 }).map((_, i) => {
      const x = i * 270 - 60, w = 230, h = 260 + (i % 3) * 50;
      return (
        <g key={i}>
          <rect x={x} y={CHAO - h} width={w} height={h} fill={i % 2 ? "#C9B48A" : "#BFA77A"} />
          <polygon points={`${x - 16},${CHAO - h} ${x + w / 2},${CHAO - h - 150} ${x + w + 16},${CHAO - h}`} fill="#6A3A2A" />
          <g stroke="#4A2E1E" strokeWidth={10}>
            <path d={`M${x} ${CHAO - h + 4} H${x + w} M${x} ${CHAO - h / 2} H${x + w} M${x + 8} ${CHAO - h} V${CHAO} M${x + w - 8} ${CHAO - h} V${CHAO} M${x + w / 2} ${CHAO - h} V${CHAO - h / 2}`} />
            <path d={`M${x + 8} ${CHAO - h / 2} L${x + w / 2} ${CHAO - h} M${x + w - 8} ${CHAO - h / 2} L${x + w / 2} ${CHAO - h}`} strokeWidth={7} />
          </g>
          <rect x={x + 30} y={CHAO - h + 40} width={50} height={60} fill={jan} opacity={0.75 + 0.2 * Math.sin(f / 30 + i)} />
          <rect x={x + w - 80} y={CHAO - h + 40} width={50} height={60} fill={jan} opacity={0.5} />
          <path d={`M${x + w / 2 - 34} ${CHAO} V${CHAO - 110} Q${x + w / 2} ${CHAO - 150} ${x + w / 2 + 34} ${CHAO - 110} V${CHAO} Z`} fill="#3A2416" />
        </g>
      );
    })}
  </g>
);

const VilaPuritana: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => (
  <g>
    {/* casa de reuniões com torre do sino */}
    <g fill={c[1]}>
      <rect x={760} y={460} width={420} height={CHAO - 460} />
      <polygon points="740,460 970,330 1200,460" />
      <rect x={930} y={230} width={80} height={130} />
      <polygon points="920,230 970,150 1020,230" />
    </g>
    {[0, 1, 2, 3].map((i) => <rect key={i} x={800 + i * 100} y={560} width={34} height={60} fill={jan} opacity={0.6} />)}
    {/* casas de madeira com telhado em duas águas e chaminé */}
    {[[80, 0.9], [420, 1], [1300, 1], [1640, 0.9]].map(([x, k], i) => {
      const w = 280 * Number(k), h = 210 * Number(k);
      const X = Number(x);
      return (
        <g key={i}>
          <rect x={X} y={CHAO - h} width={w} height={h} fill="#4A3A30" />
          {Array.from({ length: 7 }).map((_, l) => <path key={l} d={`M${X} ${CHAO - h + 18 + l * 28} H${X + w}`} stroke="#3A2C24" strokeWidth={4} />)}
          <polygon points={`${X - 20},${CHAO - h} ${X + w / 2},${CHAO - h - 140 * Number(k)} ${X + w + 20},${CHAO - h}`} fill="#2A2228" />
          <rect x={X + w * 0.7} y={CHAO - h - 150 * Number(k)} width={28} height={80} fill="#5A3A30" />
          <rect x={X + 40} y={CHAO - h + 60} width={44} height={54} fill={jan} opacity={0.75 + 0.2 * Math.sin(f / 25 + i)} />
        </g>
      );
    })}
    {/* cerca */}
    <g stroke="#3A2C24" strokeWidth={8}>
      <path d={`M-50 ${CHAO - 40} H${W + 50}`} />
      {Array.from({ length: 40 }).map((_, i) => <path key={i} d={`M${i * 50} ${CHAO} V${CHAO - 64}`} />)}
    </g>
  </g>
);

const Escola: React.FC<{ c: [string, string, string]; jan: string; f: number }> = ({ c, jan, f }) => (
  <g>
    {/* acácias */}
    {[200, 1600].map((x, i) => (
      <g key={x} fill={c[0]}>
        <path d={`M${x} ${CHAO} L${x + 10} ${CHAO - 240} L${x + 60} ${CHAO - 300} M${x + 10} ${CHAO - 240} L${x - 40} ${CHAO - 290}`} stroke={c[0]} strokeWidth={18} />
        <ellipse cx={x + 10} cy={CHAO - 320} rx={220} ry={46} />
      </g>
    ))}
    {/* prédio da escola com telhado de zinco */}
    <rect x={460} y={CHAO - 260} width={1000} height={260} fill="#D9C3A0" />
    <polygon points={`420,${CHAO - 260} 960,${CHAO - 390} 1500,${CHAO - 260}`} fill="#8C9AA8" />
    {Array.from({ length: 20 }).map((_, i) => <path key={i} d={`M${440 + i * 54} ${CHAO - 262 - Math.max(0, 6.4 * Math.min(i, 19 - i))} l0 0`} stroke="#6A7886" strokeWidth={3} />)}
    {Array.from({ length: 6 }).map((_, i) => (
      <g key={i}>
        <rect x={520 + i * 160} y={CHAO - 200} width={80} height={90} fill="#3A2A1E" opacity={0.85} />
        <path d={`M${520 + i * 160} ${CHAO - 155} h80 M${560 + i * 160} ${CHAO - 200} v90`} stroke="#D9C3A0" strokeWidth={5} />
      </g>
    ))}
    <rect x={910} y={CHAO - 130} width={100} height={130} fill="#5A3A24" />
    <text x={960} y={CHAO - 225} textAnchor="middle" fill="#5A3A24" fontFamily="Georgia, serif" fontSize={30} letterSpacing={4}>SCHOOL</text>
  </g>
);

const SalaRadio: React.FC<{ f: number }> = ({ f }) => {
  const brilho = 0.75 + 0.25 * Math.sin(f / 5);
  return (
    <g>
      <rect width={W} height={H} fill="#3A2A3A" />
      {/* papel de parede */}
      {Array.from({ length: 24 }).map((_, i) => <path key={i} d={`M${i * 90} 0 V${CHAO - 60}`} stroke="#4A3448" strokeWidth={22} />)}
      <rect y={CHAO - 60} width={W} height={H - CHAO + 60} fill="#4A2E22" />
      <rect y={CHAO - 72} width={W} height={16} fill="#5A3A28" />
      {/* janela de noite */}
      <rect x={1340} y={160} width={360} height={420} fill="#0B1235" stroke="#5A3A28" strokeWidth={18} />
      <path d="M1520 160 V580 M1340 370 H1700" stroke="#5A3A28" strokeWidth={10} />
      <circle cx={1440} cy={250} r={26} fill="#F4F1E0" opacity={0.9} />
      {/* luminária */}
      <rect x={300} y={360} width={10} height={CHAO - 380} fill="#2A1A14" />
      <polygon points="250,360 360,360 330,280 280,280" fill="#E8C98A" />
      <circle cx={305} cy={420} r={260} fill="url(#brilho)" opacity={0.5} />
      {/* o rádio */}
      <g transform="translate(760 330)">
        <path d="M0 470 L0 120 Q0 0 200 0 Q400 0 400 120 L400 470 Z" fill="#6A3A22" stroke="#3A1E10" strokeWidth={10} />
        <path d="M60 140 Q60 60 200 60 Q340 60 340 140 L340 300 L60 300 Z" fill="#2A1A10" />
        {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${80 + i * 30} 90 V290`} stroke="#5A3A22" strokeWidth={8} />)}
        <rect x={110} y={330} width={180} height={50} rx={10} fill="#FFD27A" opacity={brilho} />
        <path d={`M${130 + (f % 120)} 335 v40`} stroke="#7A2A1A" strokeWidth={4} />
        {[140, 260].map((x) => <circle key={x} cx={x} cy={420} r={20} fill="#C9A36A" />)}
        <circle cx={200} cy={355} r={260} fill="url(#brilho)" opacity={0.45 * brilho} />
      </g>
      {/* poltrona */}
      <g transform="translate(1160 560)">
        <rect x={0} y={60} width={320} height={190} rx={30} fill="#7A2E3A" />
        <rect x={20} y={-80} width={280} height={180} rx={40} fill="#8A3A46" />
        <rect x={-20} y={40} width={60} height={200} rx={24} fill="#6A2430" />
        <rect x={280} y={40} width={60} height={200} rx={24} fill="#6A2430" />
      </g>
    </g>
  );
};

/* interiores: parede, chão em perspectiva, luz pendurada */
const Interior: React.FC<{ tipo: "laboratorio" | "corredor"; hora: Hora; f: number }> = ({ tipo, f }) => {
  const balanco = Math.sin(f / 28) * 4;
  const fundo = "#141C46", parede = "#1E2A63", chao = "#0B1235";
  return (
    <g>
      <rect width={W} height={H} fill={fundo} />
      {tipo === "corredor" ? (
        <g>
          {/* corredor em perspectiva com portas gradeadas */}
          <polygon points={`0,0 ${W},0 1220,380 700,380`} fill="#0A0F2E" />
          <polygon points={`0,${H} ${W},${H} 1220,700 700,700`} fill={chao} />
          <polygon points={`0,0 700,380 700,700 0,${H}`} fill={parede} />
          <polygon points={`${W},0 1220,380 1220,700 ${W},${H}`} fill="#18225A" />
          <rect x={700} y={380} width={520} height={320} fill="#0E1640" />
          {[0, 1, 2].map((i) => {
            const t = [0.12, 0.45, 0.7][i];
            const x0 = 700 * t, y0 = 380 * t, y1 = H - (H - 700) * t;
            const larg = 160 * (1 - t * 0.8);
            return (
              <g key={i}>
                <rect x={x0 + 40 * (1 - t)} y={y0 + 140 * (1 - t)} width={larg} height={(y1 - y0) * 0.75} fill="#0A0F2E" />
                {Array.from({ length: 5 }).map((_, k) => <rect key={k} x={x0 + 40 * (1 - t) + (k + 0.5) * (larg / 5)} y={y0 + 140 * (1 - t)} width={5 * (1 - t * 0.6)} height={(y1 - y0) * 0.75} fill="#6E7BB0" />)}
                <rect x={W - x0 - 40 * (1 - t) - larg} y={y0 + 140 * (1 - t)} width={larg} height={(y1 - y0) * 0.75} fill="#0A0F2E" />
                {Array.from({ length: 5 }).map((_, k) => <rect key={`d${k}`} x={W - x0 - 40 * (1 - t) - larg + (k + 0.5) * (larg / 5)} y={y0 + 140 * (1 - t)} width={5 * (1 - t * 0.6)} height={(y1 - y0) * 0.75} fill="#6E7BB0" />)}
              </g>
            );
          })}
          <text x={960} y={470} textAnchor="middle" fill="#8E99C2" fontFamily="Georgia, serif" fontSize={34} letterSpacing={6}>THE HOLE</text>
        </g>
      ) : (
        <g>
          {/* sala de laboratório: parede, mesa, painel de botões, cortina */}
          <rect x={0} y={0} width={W} height={CHAO - 80} fill={parede} />
          <rect x={0} y={CHAO - 80} width={W} height={H - CHAO + 80} fill={chao} />
          <rect x={0} y={CHAO - 92} width={W} height={14} fill="#2A3880" />
          <rect x={1280} y={180} width={420} height={420} fill="#0E1640" />
          <path d="M1490 180 L1490 600 M1280 390 L1700 390" stroke="#2A3880" strokeWidth={12} />
          <rect x={1260} y={160} width={460} height={20} fill="#2A3880" />
          <rect x={420} y={640} width={900} height={40} fill="#3A2A1E" />
          <rect x={460} y={680} width={30} height={160} fill="#2A1E16" />
          <rect x={1250} y={680} width={30} height={160} fill="#2A1E16" />
          {/* painel */}
          <rect x={560} y={500} width={600} height={140} rx={8} fill="#2E3550" stroke="#11162E" strokeWidth={6} />
          {Array.from({ length: 15 }).map((_, i) => (
            <g key={i}>
              <rect x={585 + i * 38} y={560} width={22} height={40} rx={4} fill={i > 11 ? COR.vermelho : "#C5CBE0"} />
              <circle cx={596 + i * 38} cy={540} r={5} fill={i % 3 ? "#6E7BB0" : COR.amarelo} opacity={0.5 + 0.5 * Math.abs(Math.sin(f / 9 + i))} />
            </g>
          ))}
        </g>
      )}
      {/* lâmpada pendurada com cone de luz */}
      <g transform={`rotate(${balanco} 960 0)`}>
        <rect x={958} y={0} width={4} height={200} fill="#05081C" />
        <path d="M920 230 Q960 180 1000 230 Z" fill="#05081C" />
        <circle cx={960} cy={232} r={10} fill="#FFE9B0" />
        <polygon points={`940,236 980,236 ${1300},${H} ${620},${H}`} fill="url(#cone)" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- composição */

const Lugar: React.FC<PropsSobMedida> = ({ dur, fala, props }) => {
  const f = useCurrentFrame();
  const lugar = String(props.lugar ?? "universidade");
  const hora = (props.hora as Hora) ?? "noite";
  const ceu = CEUS[hora], c = CAMADAS[hora], jan = JANELA[hora];
  const t = f / Math.max(1, dur);
  // parallax: perto anda mais que longe
  const px = (k: number) => -t * 120 * k;
  const interno = lugar === "laboratorio" || lugar === "corredor" || lugar === "sala-radio";
  const pessoa = props.pessoa as string | undefined;
  const xPessoa = pessoa === "andando" ? interpolate(t, [0, 1], [-120, W + 120]) : 1460;
  return (
    <AbsoluteFill style={{ background: ceu[0] }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ceu[0]} />
            <stop offset="0.6" stopColor={ceu[1]} />
            <stop offset="1" stopColor={ceu[2]} />
          </linearGradient>
          <linearGradient id="feixe" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE9B0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFE9B0" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="brilho">
            <stop offset="0" stopColor="#FF9A4D" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FF9A4D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vinheta" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.65" />
          </radialGradient>
          <radialGradient id="astro">
            <stop offset="0" stopColor={hora === "noite" ? "#F4F1E0" : "#FFF3C4"} />
            <stop offset="0.25" stopColor={hora === "noite" ? "#F4F1E0" : "#FFE08A"} stopOpacity="0.9" />
            <stop offset="1" stopColor={hora === "noite" ? "#F4F1E0" : "#FFB45E"} stopOpacity="0" />
          </radialGradient>
        </defs>
        {interno ? (
          <g transform={`translate(${px(0.4)} 0) scale(${1.08 + t * 0.05})`} style={{ transformOrigin: "960px 540px" }}>
            {lugar === "sala-radio" ? <SalaRadio f={f} /> : <Interior tipo={lugar as "laboratorio" | "corredor"} hora={hora} f={f} />}
          </g>
        ) : (
          <>
            <rect width={W} height={H} fill="url(#ceu)" />
            {hora === "noite" && <Estrelas f={f} />}
            <circle cx={hora === "dia" ? 1550 : 1500 + px(0.1)} cy={hora === "dourado" ? 640 : 200} r={hora === "noite" ? 160 : 260} fill="url(#astro)" />
            {props.luz ? <Feixes f={f} /> : null}
            <g transform={`translate(${px(0.15)} 0)`}>
              <Morros y={640} amp={120} cor={c[0]} seed="longe" />
            </g>
            <g transform={`translate(${px(0.35)} 0)`}>
              <Morros y={760} amp={70} cor={c[0]} seed="meio" />
              {!["cidade", "acampamento", "vila-medieval", "vila-puritana"].includes(lugar) && Array.from({ length: 16 }).map((_, i) => <Arvore key={i} x={i * 140 - 40} base={CHAO - 10} h={110 + rnd(`ar${i}`) * 70} cor={c[0]} />)}
            </g>
            <g transform={`translate(${px(0.6)} 0)`}>
              {lugar === "universidade" && <Universidade c={c} jan={jan} f={f} />}
              {lugar === "cidade" && <Cidade c={c} jan={jan} f={f} />}
              {lugar === "acampamento" && <Acampamento c={c} jan={jan} f={f} />}
              {lugar === "hospital" && <Hospital c={c} jan={jan} f={f} />}
              {lugar === "governo" && <Governo c={c} jan={jan} f={f} />}
              {lugar === "vila-medieval" && <VilaMedieval c={c} jan={jan} f={f} />}
              {lugar === "vila-puritana" && <VilaPuritana c={c} jan={jan} f={f} />}
              {lugar === "escola" && <Escola c={c} jan={jan} f={f} />}
            </g>
            <g transform={`translate(${px(1)} 0)`}>
              <rect x={-300} y={CHAO} width={W + 900} height={H - CHAO} fill={c[2]} />
            </g>
          </>
        )}
        {pessoa && <Silhueta x={xPessoa} base={interno ? 1000 : CHAO + 6} escala={interno ? 2.2 : 1} cor="#03061A" f={f} andando={pessoa === "andando"} />}
      </svg>
      <Personagens props={props} f={f} dur={dur} fala={fala} hora={hora} interno={interno} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect width={W} height={H} fill="url(#vinheta2)" />
        <defs>
          <radialGradient id="vinheta2" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.65" />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

type FiguraNoCenario = PropsFigura & { x: number; escala?: number; fundo?: number; entra?: number };

const Personagens: React.FC<{ props: Record<string, unknown>; f: number; dur: number; fala: number; hora: Hora; interno: boolean }> = ({ props, f, fala, hora, interno }) => {
  const lista: FiguraNoCenario[] = [...((props.figuras as FiguraNoCenario[]) ?? [])];
  const m = props.multidao as (PropsFigura & { n?: number; entra?: number; contagio?: boolean }) | undefined;
  if (m) {
    const n = m.n ?? 12;
    for (let i = 0; i < n; i++) {
      const fileira = i % 3;
      lista.push({
        ...m, seed: 100 + i, x: 120 + ((i * 1680) / n + rnd(`mx${i}`) * 90) % 1700, fundo: fileira * 0.35, escala: 1,
        entra: m.contagio ? (m.entra ?? 0.1) + (i / n) * 0.6 : m.entra,
        pose: m.contagio ? m.pose : m.pose,
      });
    }
  }
  const p = f / Math.max(1, fala);
  const chao = interno ? 1010 : CHAO + 30;
  const ordenada = lista.map((x, i) => ({ ...x, i })).sort((a, b) => (b.fundo ?? 0) - (a.fundo ?? 0));
  return (
    <AbsoluteFill>
      {ordenada.map((fg) => {
        const fundo = fg.fundo ?? 0;
        const esc = (fg.escala ?? 1) * (1 - fundo * 0.45) * (interno ? 1.5 : 1);
        const alt = 470 * esc, larg = 210 * esc;
        const aparece = fg.entra === undefined ? 1 : Math.min(1, Math.max(0, (p - fg.entra) / 0.06));
        // contágio: antes de "pegar", a pessoa fica parada olhando
        const contagiado = !m?.contagio || fg.seed === undefined || fg.seed < 100 || p >= (fg.entra ?? 0);
        const pose = contagiado ? fg.pose : "parado";
        const visivel = m?.contagio && (fg.seed ?? 0) >= 100 ? 1 : aparece;
        return (
          <div key={fg.i} style={{ position: "absolute", left: fg.x - larg / 2, top: chao - fundo * 150 - alt, width: larg, height: alt, opacity: visivel, transform: `translateY(${(1 - visivel) * 30}px)` }}>
            <Figura {...fg} pose={pose} escuro={(fg.escuro ?? 0) + fundo * 0.45 + (hora === "noite" && !interno ? 0.25 : 0)} luz={fg.luz ?? (interno ? "esquerda" : "direita")} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default Lugar;
