import React from "react";
import { random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR } from "../tema";

export type Gesto = "parado" | "explicar" | "apontar" | "acenar" | "pensar" | "cruzar" | "surpreso" | "comemorar";
export type Expressao = "feliz" | "surpreso" | "pensativo" | "bravo" | "piscadela";

export type Visual = {
  pele: string;
  cabelo: { tipo: "curto" | "longo" | "repartido" | "baguncado" | "careca" | "coque" | "laterais"; cor: string };
  roupa: { tipo: "camiseta" | "terno" | "jaleco" | "moletom"; cor: string; detalhe?: string };
  oculos?: boolean;
  bigode?: boolean;
  barba?: boolean;
  gravata?: string;
  pelos?: string; // cor de bigode/barba (padrão: cor do cabelo)
  aura?: "raios";
};

/** Pose dos braços em graus: [ombroE, cotoveloE, ombroD, cotoveloD]. 0 = para baixo; positivo = para fora/cima. */
export const POSES: Record<Gesto, [number, number, number, number]> = {
  parado: [8, 6, 8, 6],
  explicar: [16, 42, 36, 72],
  apontar: [8, 6, 82, 8],
  acenar: [8, 6, 122, 40],
  pensar: [14, -70, 50, -185],
  cruzar: [20, -110, 20, -110],
  surpreso: [128, 22, 128, 22],
  comemorar: [150, 12, 150, 12],
};

/** Balanço contínuo de cada gesto (graus somados à pose). */
export const balanco = (g: Gesto, f: number, falando: boolean): [number, number, number, number] => {
  const s = Math.sin(f / 4);
  const l = Math.sin(f / 9);
  switch (g) {
    case "explicar":
      return falando ? [l * 6, s * 14, -l * 8, s * 18] : [0, l * 4, 0, l * 4];
    case "acenar":
      return [0, 0, l * 4, s * 26];
    case "comemorar":
      return [s * 9, 0, -s * 9, 0];
    case "apontar":
      return [0, 0, l * 3, 0];
    default:
      return [l * 1.5, 0, l * 1.5, 0];
  }
};

export const usePose = (gesto: Gesto, anterior: Gesto | undefined, falando: boolean) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f, fps, config: { damping: 13, stiffness: 160, mass: 0.6 } });
  const de = POSES[anterior ?? gesto];
  const para = POSES[gesto];
  const b = balanco(gesto, f, falando);
  return para.map((v, i) => de[i] + (v - de[i]) * k + b[i] * k) as [number, number, number, number];
};

const rad = (g: number) => (g * Math.PI) / 180;

/** Braço de duas articulações. lado: -1 esquerda, +1 direita (na tela). */
export const braco = (ox: number, oy: number, lado: number, a1: number, a2: number, l1: number, l2: number) => {
  const cx = ox + l1 * lado * Math.sin(rad(a1));
  const cy = oy + l1 * Math.cos(rad(a1));
  const mx = cx + l2 * lado * Math.sin(rad(a1 + a2));
  const my = cy + l2 * Math.cos(rad(a1 + a2));
  return { cx, cy, mx, my };
};

const Cabelo: React.FC<{ v: Visual; atras?: boolean }> = ({ v, atras }) => {
  const c = v.cabelo.cor;
  const t = v.cabelo.tipo;
  if (atras) {
    if (t === "longo")
      return <path d="M92 175 Q84 48 200 52 Q316 48 308 175 L320 335 Q300 356 268 344 L132 344 Q100 356 80 335 Z" fill={c} />;
    return null;
  }
  const franja = "M106 168 Q98 58 200 60 Q302 58 294 168 Q276 108 200 102 Q124 108 106 168 Z";
  switch (t) {
    case "curto":
    case "longo":
      return <path d={franja} fill={c} />;
    case "coque":
      return (
        <>
          <circle cx={200} cy={56} r={36} fill={c} />
          <path d={franja} fill={c} />
        </>
      );
    case "repartido":
      return <path d="M104 176 Q94 56 200 60 Q306 56 296 176 Q290 122 206 100 L200 78 L194 100 Q110 122 104 176 Z" fill={c} />;
    case "baguncado":
      return (
        <path
          d="M104 172 L92 120 L116 128 L108 72 L142 96 L150 44 L184 82 L208 34 L226 82 L262 46 L264 98 L300 74 L288 128 L310 122 L296 172 Q276 112 200 106 Q124 112 104 172 Z"
          fill={c}
        />
      );
    case "laterais":
      return (
        <>
          <path d="M104 190 Q88 150 112 110 Q118 150 122 186 Z" fill={c} />
          <path d="M296 190 Q312 150 288 110 Q282 150 278 186 Z" fill={c} />
        </>
      );
    default:
      return null;
  }
};

const Roupa: React.FC<{ v: Visual }> = ({ v }) => {
  const { tipo, cor, detalhe } = v.roupa;
  const torso = "M88 330 Q88 292 130 288 L270 288 Q312 292 312 330 L326 560 L74 560 Z";
  return (
    <>
      {tipo === "moletom" && <path d="M120 300 Q200 232 280 300 Q200 330 120 300 Z" fill={cor} stroke="rgba(0,0,0,.18)" strokeWidth={6} />}
      <path d={torso} fill={cor} />
      {tipo === "camiseta" && <path d="M162 288 Q200 326 238 288 Z" fill={v.pele} />}
      {tipo === "moletom" && (
        <>
          <path d="M160 288 Q200 330 240 288 Z" fill={v.pele} />
          <path d="M182 318 L178 372 M218 318 L222 372" stroke={COR.branco} strokeWidth={6} strokeLinecap="round" />
          <path d="M150 470 Q200 452 250 470 L250 520 L150 520 Z" fill="rgba(0,0,0,.14)" />
        </>
      )}
      {(tipo === "terno" || tipo === "jaleco") && (
        <>
          <path d="M150 288 L200 420 L250 288 Z" fill={tipo === "terno" ? detalhe ?? COR.branco : detalhe ?? COR.azulClaro} />
          {v.gravata && <path d="M190 300 L210 300 L216 392 L200 414 L184 392 Z" fill={v.gravata} />}
          <path d="M150 288 L200 420 L168 430 L122 306 Z M250 288 L200 420 L232 430 L278 306 Z" fill="rgba(0,0,0,.2)" />
          {tipo === "jaleco" && <path d="M236 470 h54 v44 h-54 Z M248 460 v20" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth={5} />}
        </>
      )}
    </>
  );
};

const Raios: React.FC = () => {
  const f = useCurrentFrame();
  const passo = Math.floor(f / 3);
  return (
    <g stroke={COR.ciano} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#bBrilho)">
      {[0, 1, 2].map((i) => {
        if (random(`on${passo}-${i}`) < 0.45) return null;
        const ang = random(`a${passo}-${i}`) * Math.PI * 2;
        const r = 150 + random(`r${passo}-${i}`) * 40;
        const x = 200 + Math.cos(ang) * r;
        const y = 190 + Math.sin(ang) * r * 0.9;
        const z = (n: number) => (random(`z${passo}-${i}-${n}`) - 0.5) * 46;
        return <path key={i} d={`M${x} ${y} l${z(1)} ${z(2)} l${z(3)} ${z(4)} l${z(5)} ${z(6)}`} opacity={0.9} />;
      })}
    </g>
  );
};

/** Boneco humano em vetor (da cintura para cima), com gestos, piscada e boca sincronizada. */
export const Boneco: React.FC<{
  visual: Visual;
  altura: number;
  gesto?: Gesto;
  gestoAnterior?: Gesto;
  expressao?: Expressao;
  falando?: boolean;
  seed?: number;
}> = ({ visual: v, altura, gesto = "parado", gestoAnterior, expressao, falando = false, seed = 0 }) => {
  const f = useCurrentFrame() + seed * 41;
  const [a1e, a2e, a1d, a2d] = usePose(gesto, gestoAnterior, falando);
  const E = braco(108, 322, -1, a1e, a2e, 108, 104);
  const D = braco(292, 322, 1, a1d, a2d, 108, 104);
  const exp: Expressao = expressao ?? (gesto === "surpreso" ? "surpreso" : gesto === "pensar" ? "pensativo" : "feliz");

  const ciclo = f % 96;
  const piscar = ciclo > 91 ? 0.12 : 1;
  const abre = exp === "surpreso" ? 1.25 : 1;
  const respira = Math.sin(f / 16) * 3;
  const cabecaY = (falando ? Math.sin(f / 3) * 3 : 0) + respira;
  const inclina = exp === "pensativo" ? 6 : falando ? Math.sin(f / 11) * 2.5 : 0;
  const boca = 5 + Math.abs(Math.sin(f / 2.1)) * 15;
  const pelos = v.pelos ?? v.cabelo.cor;
  const olharX = exp === "pensativo" ? 5 : 0;
  const olharY = exp === "pensativo" ? -7 : 0;

  const olho = (x: number, fechado = false) => (
    <g transform={`translate(${x} 172) scale(1 ${fechado ? 0.12 : piscar * abre}) translate(${-x} -172)`}>
      <ellipse cx={x} cy={172} rx={19} ry={22} fill="#fff" />
      <circle cx={x + olharX} cy={174 + olharY} r={10} fill="#16161D" />
      <circle cx={x + olharX - 3} cy={170 + olharY} r={3.5} fill="#fff" />
    </g>
  );
  const sobr = (x: number, lado: number) => {
    const d = exp === "bravo" ? 10 * lado : exp === "surpreso" ? 0 : -2 * lado;
    const y = exp === "surpreso" ? 128 : 138;
    return <path d={`M${x - 20} ${y + d} L${x + 20} ${y - d}`} stroke={v.cabelo.tipo === "laterais" ? pelos : v.cabelo.cor} strokeWidth={8} strokeLinecap="round" />;
  };
  const manga = (b: ReturnType<typeof braco>, ox: number) => (
    <>
      <path d={`M${ox} 322 L${b.cx} ${b.cy} L${b.mx} ${b.my}`} stroke={v.roupa.cor} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${ox} 322 L${b.cx} ${b.cy} L${b.mx} ${b.my}`} stroke="rgba(0,0,0,.12)" strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={b.mx} cy={b.my} r={30} fill={v.pele} />
    </>
  );

  return (
    <svg width={(altura * 400) / 560} height={altura} viewBox="0 0 400 560" style={{ overflow: "visible" }}>
      <defs>
        <filter id="bBrilho" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(0 ${respira})`}>
        <g transform={`translate(0 ${cabecaY - respira}) rotate(${inclina} 200 260)`}>
          <Cabelo v={v} atras />
        </g>
        <Roupa v={v} />
        <rect x={176} y={250} width={48} height={52} rx={14} fill={v.pele} />
        <rect x={176} y={250} width={48} height={30} fill="rgba(0,0,0,.14)" />
        {manga(E, 108)}
        {manga(D, 292)}
        <g transform={`translate(0 ${cabecaY - respira}) rotate(${inclina} 200 260)`}>
          <ellipse cx={200} cy={170} rx={94} ry={102} fill={v.pele} />
          <ellipse cx={104} cy={178} rx={12} ry={18} fill={v.pele} />
          <ellipse cx={296} cy={178} rx={12} ry={18} fill={v.pele} />
          {v.barba && <path d="M112 196 Q118 280 200 276 Q282 280 288 196 Q270 236 200 232 Q130 236 112 196 Z" fill={pelos} />}
          <Cabelo v={v} />
          {sobr(164, -1)}
          {sobr(236, 1)}
          {olho(164)}
          {olho(236, exp === "piscadela")}
          <path d="M196 188 Q190 204 202 206" stroke="rgba(0,0,0,.25)" strokeWidth={5} fill="none" strokeLinecap="round" />
          {exp === "surpreso" ? (
            <ellipse cx={200} cy={236} rx={13} ry={17} fill="#3A1418" />
          ) : falando ? (
            <ellipse cx={200} cy={234} rx={20} ry={boca / 2 + 3} fill="#3A1418" />
          ) : exp === "pensativo" || exp === "bravo" ? (
            <path d="M182 236 L218 232" stroke="#3A1418" strokeWidth={7} strokeLinecap="round" />
          ) : (
            <path d="M176 226 Q200 250 224 226" stroke="#3A1418" strokeWidth={7} fill="none" strokeLinecap="round" />
          )}
          {v.bigode && <path d="M160 222 Q180 200 200 212 Q220 200 240 222 Q218 222 200 218 Q182 222 160 222 Z" fill={pelos} />}
          {v.oculos && (
            <g fill="rgba(255,255,255,.14)" stroke="#16161D" strokeWidth={7}>
              <circle cx={164} cy={172} r={30} />
              <circle cx={236} cy={172} r={30} />
              <path d="M194 170 L206 170 M134 168 L106 160 M266 168 L294 160" fill="none" />
            </g>
          )}
        </g>
        {v.aura === "raios" && <Raios />}
      </g>
    </svg>
  );
};
