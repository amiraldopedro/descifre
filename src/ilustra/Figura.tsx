/**
 * Figura: personagem ilustrado de documentário (vetor chapado com luz e sombra de duas cores, estilo animação documental).
 * Desenhado numa caixa 400x900 (pés em y=900). Respira, pisca e mexe a cabeça sozinho; poses animadas.
 *
 * traje: comum | camponesa | campones | puritano | puritana | anos30 | anos30mulher | estudante | medico | jaleco
 * pose:  parado | falando | apontando | assustado | dancando | rindo | sentado | andando | ouvindo
 * rosto: neutro | preocupado | assustado | feliz | riso | grito | fechado
 * luz:   esquerda | direita (de que lado vem a luz; o outro lado fica na sombra)
 */
import React from "react";
import { random, useCurrentFrame } from "remotion";

export type Traje = "comum" | "camponesa" | "campones" | "puritano" | "puritana" | "anos30" | "anos30mulher" | "estudante" | "medico" | "jaleco";
export type Pose = "parado" | "falando" | "apontando" | "assustado" | "dancando" | "rindo" | "sentado" | "andando" | "ouvindo";
export type Rosto = "neutro" | "preocupado" | "assustado" | "feliz" | "riso" | "grito" | "fechado";

export type PropsFigura = {
  traje?: Traje;
  pose?: Pose;
  rosto?: Rosto;
  luz?: "esquerda" | "direita";
  seed?: number;
  pele?: string;
  cabelo?: string;
  olhando?: "frente" | "esquerda" | "direita";
  intensidade?: number; // 0..1 força da pose (ex.: dança mais frenética)
  sombra?: number; // opacidade da sombra no chão
  escuro?: number; // 0..1 escurece a figura (profundidade / contraluz)
};

const PELES = ["#F2D2B6", "#E3B48E", "#C98E63", "#9A6440", "#6E452B", "#F7DCC8"];
const CABELOS = ["#2A1D16", "#4A3324", "#7A5233", "#C79A55", "#1A1A22", "#8A8A92"];

const escurecer = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - k)), g = Math.round(((n >> 8) & 255) * (1 - k)), b = Math.round((n & 255) * (1 - k));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/** Gradiente "duas cores" (luz e sombra com corte seco), um por cor usada. As cores são listadas antes de desenhar. */
const criarTinta = (id: string, luzEsq: boolean, escuro: number, cores: string[]) => {
  const mapa = new Map<string, string>();
  cores.filter(Boolean).forEach((cor) => {
    const c = escuro > 0 ? escurecer(cor, escuro * 0.6) : cor;
    mapa.set(cor, c);
  });
  const nome = (cor: string) => `${id}-${cor.slice(1)}`;
  const tinta = (cor: string) => (mapa.has(cor) ? `url(#${nome(cor)})` : cor);
  const defs = () => (
    <defs>
      {[...mapa.entries()].map(([cor, c]) => (
        <linearGradient key={cor} id={nome(cor)} x1={luzEsq ? "0" : "1"} y1="0" x2={luzEsq ? "1" : "0"} y2="0">
          <stop offset="0" stopColor={c} />
          <stop offset="0.6" stopColor={c} />
          <stop offset="0.6" stopColor={escurecer(c, 0.22)} />
          <stop offset="1" stopColor={escurecer(c, 0.3)} />
        </linearGradient>
      ))}
    </defs>
  );
  return { tinta, defs };
};

type Roupa = { camisa: string; calca: string; saia?: string; avental?: string; gola?: string; chapeu?: "capotain" | "fedora" | "touca" | "boina" | null; sapato: string; casaco?: string };

const ROUPAS = (seed: number): Record<Traje, Roupa> => {
  const r = (k: string) => random(`${k}${seed}`);
  const terra = ["#8A5A3C", "#6B5A3A", "#7A3A2E", "#5A6A4A", "#8C7A5A"][Math.floor(r("t") * 5)];
  return {
    comum: { camisa: ["#3E6FB5", "#B5473E", "#4E8A5E", "#D0A040", "#6A5A9A"][Math.floor(r("c") * 5)], calca: "#2E3A5A", sapato: "#2A2018", chapeu: null },
    camponesa: { camisa: "#C9B48A", calca: terra, saia: terra, avental: "#E8DFC8", chapeu: "touca", sapato: "#3A2A1E" },
    campones: { camisa: "#B9A27A", calca: "#5A4A36", casaco: terra, chapeu: "boina", sapato: "#3A2A1E" },
    puritano: { camisa: "#2A2A30", calca: "#24242A", gola: "#F2EFE6", chapeu: "capotain", sapato: "#1A1A1E", casaco: "#2E2E36" },
    puritana: { camisa: "#3A3440", calca: "#3A3440", saia: "#34303A", gola: "#F2EFE6", avental: "#E8E4DA", chapeu: "touca", sapato: "#1A1A1E" },
    anos30: { camisa: "#E8E2D2", calca: "#4A4A52", casaco: ["#5A4A3A", "#3A4458", "#4E4E4E"][Math.floor(r("a") * 3)], chapeu: "fedora", sapato: "#2A2018" },
    anos30mulher: { camisa: ["#8A3A4A", "#3A5A7A", "#6A7A4A"][Math.floor(r("m") * 3)], calca: "#8A3A4A", saia: ["#8A3A4A", "#3A5A7A", "#6A7A4A"][Math.floor(r("m") * 3)], chapeu: null, sapato: "#2A2018", casaco: "#C9B48A" },
    estudante: { camisa: "#F2F0E8", calca: "#3A6A9A", saia: "#3A6A9A", chapeu: null, sapato: "#2A2018" },
    medico: { camisa: "#F4F4F8", calca: "#4A4A58", casaco: "#F4F4F8", chapeu: null, sapato: "#2A2018" },
    jaleco: { camisa: "#9AA0B0", calca: "#4A4A58", casaco: "#ECECF2", chapeu: null, sapato: "#2A2018" },
  };
};

export const Figura: React.FC<PropsFigura> = ({
  traje = "comum", pose = "parado", rosto = "neutro", luz = "esquerda", seed = 1, pele, cabelo, olhando = "frente", intensidade = 1, sombra = 0.35, escuro = 0,
}) => {
  const f = useCurrentFrame() + seed * 37;
  const id = `fig${seed}${traje}${pose}`.replace(/[^a-z0-9]/gi, "");
  const R = ROUPAS(seed)[traje];
  const pl = pele ?? PELES[Math.floor(random(`pele${seed}`) * (traje === "estudante" ? 2 : 4)) + (traje === "estudante" ? 3 : 0)];
  const cb = cabelo ?? CABELOS[Math.floor(random(`cab${seed}`) * CABELOS.length)];
  const { tinta, defs } = criarTinta(id, luz === "esquerda", escuro, [
    R.camisa, R.calca, R.saia ?? "", R.avental ?? "", R.sapato, R.casaco ?? "", pl, cb, "#F2EFE6", "#1E1E24", "#4A3A2A", escurecer(R.casaco ?? "#4A4A4A", 0.25),
  ]);
  const mulher = ["camponesa", "puritana", "anos30mulher", "estudante"].includes(traje) || (traje === "comum" && random(`g${seed}`) > 0.5);

  // movimentos
  const resp = Math.sin(f / 22) * 0.012;
  const piscando = f % 97 < 4;
  const I = intensidade;
  let corpoRot = 0, cabRot = Math.sin(f / 50) * 2, saltar = 0;
  let bE = 10, bD = -10, aE = 0, aD = 0, pE = 0, pD = 0, joelho = 0;
  if (pose === "falando") { bD = -40 - Math.sin(f / 7) * 18 * I; aD = -70; cabRot += Math.sin(f / 9) * 3; }
  if (pose === "apontando") { bD = -95; aD = -5; }
  if (pose === "assustado") { bE = 150; bD = -150; aE = 120; aD = -120; corpoRot = Math.sin(f / 2.5) * 1.2 * I; }
  if (pose === "ouvindo") { bD = -150; aD = -130; cabRot = -6; }
  if (pose === "dancando") {
    const t = f / (6 - I * 2.5);
    bE = 140 + Math.sin(t) * 40 * I; bD = -140 + Math.sin(t + 2) * 40 * I; aE = 40 * Math.sin(t * 1.3); aD = -40 * Math.sin(t * 1.1);
    corpoRot = Math.sin(t) * 9 * I; cabRot = Math.sin(t + 1) * 14 * I; saltar = Math.abs(Math.sin(t)) * 26 * I;
    pE = Math.sin(t) * 22 * I; pD = -Math.sin(t) * 22 * I; joelho = Math.abs(Math.sin(t)) * 18 * I;
  }
  if (pose === "rindo") { bE = 35; bD = -35; aE = -110; aD = 110; cabRot = -12 + Math.sin(f / 3) * 4 * I; corpoRot = Math.sin(f / 3) * 2.5 * I; saltar = Math.abs(Math.sin(f / 3)) * 6 * I; }
  if (pose === "andando") { const t = f / 5; pE = Math.sin(t) * 24; pD = -pE; bE = 10 - Math.sin(t) * 22; bD = -10 - Math.sin(t) * 22; saltar = Math.abs(Math.cos(t)) * 6; }
  const sentado = pose === "sentado" || pose === "ouvindo";
  const olhoDx = olhando === "esquerda" ? -5 : olhando === "direita" ? 5 : 0;

  // boca e sobrancelhas por expressão
  const bocas: Record<Rosto, React.ReactNode> = {
    neutro: <path d="M-16 66 Q0 70 16 66" stroke="#6A2E2A" strokeWidth={5} fill="none" strokeLinecap="round" />,
    preocupado: <path d="M-16 70 Q0 62 16 70" stroke="#6A2E2A" strokeWidth={5} fill="none" strokeLinecap="round" />,
    assustado: <ellipse cx={0} cy={70} rx={11} ry={14} fill="#4A1A1E" />,
    feliz: <path d="M-20 62 Q0 80 20 62" stroke="#6A2E2A" strokeWidth={5} fill="none" strokeLinecap="round" />,
    riso: <path d="M-24 58 Q0 96 24 58 Z" fill="#4A1A1E" />,
    grito: <ellipse cx={0} cy={72} rx={16} ry={22} fill="#3A1216" />,
    fechado: <path d="M-12 68 L12 68" stroke="#6A2E2A" strokeWidth={5} strokeLinecap="round" />,
  };
  const sob = rosto === "preocupado" || rosto === "assustado" || rosto === "grito" ? 1 : rosto === "riso" || rosto === "feliz" ? -0.4 : 0;
  const olhosFechados = piscando || rosto === "fechado" || (rosto === "riso" && f % 30 < 18);

  const Braco: React.FC<{ x: number; rot: number; ante: number; lado: 1 | -1 }> = ({ x, rot, ante, lado }) => (
    <g transform={`translate(${x} 0) rotate(${rot})`}>
      <circle cx={0} cy={4} r={31} fill={tinta(R.casaco ?? R.camisa)} />
      <path d={`M-30 -6 Q-34 90 -24 150 L24 150 Q34 90 30 -6 Z`} fill={tinta(R.casaco ?? R.camisa)} />
      <g transform={`translate(0 145) rotate(${ante})`}>
        <circle cx={0} cy={0} r={24} fill={tinta(R.casaco ?? R.camisa)} />
        <path d="M-24 0 L-19 130 L19 130 L24 0 Z" fill={tinta(R.casaco ?? R.camisa)} />
        {(traje === "puritano" || traje === "puritana") && <rect x={-21} y={110} width={42} height={16} fill="#F2EFE6" />}
        <ellipse cx={0} cy={150} rx={22} ry={26} fill={tinta(pl)} />
        <path d={`M${lado * 10} 140 l${lado * 10} 12`} stroke={escurecer(pl, 0.3)} strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>
  );

  const Perna: React.FC<{ x: number; rot: number }> = ({ x, rot }) => (
    <g transform={`translate(${x} 520) rotate(${sentado ? -80 : rot})`}>
      <path d="M-28 0 L-22 190 L22 190 L28 0 Z" fill={tinta(R.calca)} />
      <g transform={`translate(0 186) rotate(${sentado ? 80 : joelho})`}>
        <circle cx={0} cy={0} r={23} fill={tinta(R.calca)} />
        <path d="M-22 0 L-18 175 L18 175 L22 0 Z" fill={tinta(R.calca)} />
        <path d="M-22 168 Q-24 196 6 196 L44 196 Q46 176 22 168 Z" fill={tinta(R.sapato)} />
      </g>
    </g>
  );

  const Cabelo = () => {
    if (R.chapeu === "touca")
      return (
        <g>
          <path d="M-74 -6 Q-80 -96 0 -104 Q80 -96 74 -6 Q60 -40 0 -46 Q-60 -40 -74 -6 Z" fill={tinta("#F2EFE6")} />
          <path d="M-74 -6 Q-84 30 -66 52 L-58 10 Z M74 -6 Q84 30 66 52 L58 10 Z" fill={tinta("#F2EFE6")} />
        </g>
      );
    const curto = <path d="M-70 -10 Q-78 -92 0 -98 Q80 -92 70 -14 Q66 -46 30 -52 Q-10 -40 -50 -50 Q-66 -40 -70 -10 Z" fill={tinta(cb)} />;
    const longo = (
      <g>
        <path d="M-74 -10 Q-84 -98 0 -100 Q84 -98 74 -10 L82 120 Q60 140 50 100 L56 0 Q30 -46 -10 -46 Q-50 -40 -56 0 L-50 100 Q-60 140 -82 120 Z" fill={tinta(cb)} />
      </g>
    );
    const coque = (
      <g>
        {curto}
        <circle cx={0} cy={-104} r={30} fill={tinta(cb)} />
      </g>
    );
    if (traje === "estudante") return <path d="M-72 -6 Q-80 -96 0 -100 Q80 -96 72 -6 Q70 -60 0 -62 Q-70 -60 -72 -6 Z" fill={tinta(cb)} />;
    if (traje === "anos30mulher") return longo;
    return mulher ? (random(`cc${seed}`) > 0.5 ? longo : coque) : curto;
  };

  const Chapeu = () => {
    if (R.chapeu === "capotain")
      return (
        <g fill={tinta("#1E1E24")}>
          <ellipse cx={0} cy={-58} rx={112} ry={20} />
          <path d="M-60 -60 L-50 -170 Q0 -184 50 -170 L60 -60 Z" />
          <rect x={-58} y={-86} width={116} height={16} fill="#3A3020" />
          <rect x={-14} y={-90} width={28} height={24} fill="none" stroke="#C9A36A" strokeWidth={5} />
        </g>
      );
    if (R.chapeu === "fedora")
      return (
        <g fill={tinta(escurecer(R.casaco ?? "#4A4A4A", 0.25))}>
          <ellipse cx={0} cy={-66} rx={104} ry={18} />
          <path d="M-62 -66 Q-66 -140 -20 -132 Q0 -116 20 -132 Q66 -140 62 -66 Z" />
          <rect x={-62} y={-84} width={124} height={14} fill="#1E1E24" />
        </g>
      );
    if (R.chapeu === "boina") return <ellipse cx={-6} cy={-76} rx={84} ry={34} fill={tinta("#4A3A2A")} />;
    return null;
  };

  return (
    <svg viewBox="-200 -40 400 960" width="100%" height="100%" overflow="visible">
      {defs()}
      <ellipse cx={0} cy={905} rx={130} ry={20} fill="#000" opacity={sombra * (1 - saltar / 80)} />
      <g transform={`translate(0 ${-saltar + (sentado ? 160 : 0)}) rotate(${corpoRot} 0 520) scale(1 ${1 + resp})`} style={{ transformOrigin: "0px 900px" }}>
        {/* pernas (atrás da saia) */}
        <Perna x={-34} rot={pE} />
        <Perna x={34} rot={pD} />
        {/* braço de trás */}
        <g transform="translate(0 250)">
          <Braco x={luz === "esquerda" ? 92 : -92} rot={luz === "esquerda" ? bD : bE} ante={luz === "esquerda" ? aD : aE} lado={luz === "esquerda" ? -1 : 1} />
        </g>
        {/* tronco */}
        <path d="M-92 250 Q-104 400 -76 540 L76 540 Q104 400 92 250 Q60 228 0 228 Q-60 228 -92 250 Z" fill={tinta(R.camisa)} />
        {R.casaco && (
          <g>
            <path d="M-96 250 Q-110 420 -82 560 L-14 560 L-8 300 L-40 240 Z" fill={tinta(R.casaco)} />
            <path d="M96 250 Q110 420 82 560 L14 560 L8 300 L40 240 Z" fill={tinta(R.casaco)} />
          </g>
        )}
        {traje === "anos30" && <path d="M-6 250 L6 250 L12 380 L0 400 L-12 380 Z" fill="#7A2A2E" />}
        {(traje === "medico" || traje === "jaleco") && <rect x={40} y={330} width={36} height={8} rx={3} fill="#3A6AD0" />}
        {R.saia && <path d={`M-84 470 Q-150 ${sentado ? 640 : 760} -130 ${sentado ? 700 : 860} L130 ${sentado ? 700 : 860} Q150 ${sentado ? 640 : 760} 84 470 Z`} fill={tinta(R.saia)} />}
        {R.avental && <path d={`M-58 480 Q-74 640 -64 ${sentado ? 680 : 800} L64 ${sentado ? 680 : 800} Q74 640 58 480 Z`} fill={tinta(R.avental)} />}
        {R.gola && <path d="M-80 246 Q0 330 80 246 Q40 300 0 304 Q-40 300 -80 246 Z" fill={R.gola} />}
        {/* pescoço e cabeça */}
        <rect x={-24} y={196} width={48} height={52} fill={tinta(pl)} />
        <g transform={`translate(0 128) rotate(${cabRot} 0 70) scale(0.94)`}>
          <ellipse cx={0} cy={0} rx={64} ry={78} fill={tinta(pl)} />
          <ellipse cx={-62} cy={10} rx={11} ry={17} fill={tinta(pl)} />
          <ellipse cx={62} cy={10} rx={11} ry={17} fill={tinta(pl)} />
          {/* olhos */}
          {[-26, 26].map((x) => (
            <g key={x} transform={`translate(${x} 8)`}>
              {olhosFechados ? (
                <path d="M-12 2 Q0 8 12 2" stroke="#2A1A16" strokeWidth={4} fill="none" strokeLinecap="round" />
              ) : (
                <>
                  <ellipse cx={0} cy={0} rx={rosto === "assustado" || rosto === "grito" ? 14 : 12} ry={rosto === "assustado" || rosto === "grito" ? 15 : 11} fill="#FFFFFF" />
                  <circle cx={olhoDx} cy={1} r={7} fill="#2A1A16" />
                  <circle cx={olhoDx + 2} cy={-2} r={2.2} fill="#FFF" />
                </>
              )}
              <path d={`M-14 ${-20 - sob * 4} Q0 ${-28 + sob * (x < 0 ? -2 : 2)} 14 ${-20 + sob * (x < 0 ? 6 : -6) * -1}`} stroke={escurecer(cb, 0.1)} strokeWidth={6} fill="none" strokeLinecap="round" transform={x < 0 ? "" : "scale(-1 1)"} />
            </g>
          ))}
          <path d="M0 18 Q-8 40 2 44" stroke={escurecer(pl, 0.28)} strokeWidth={5} fill="none" strokeLinecap="round" />
          <g transform="translate(0 -6)">{bocas[rosto]}</g>
          {(rosto === "feliz" || rosto === "riso") && [-44, 44].map((x) => <ellipse key={x} cx={x} cy={40} rx={12} ry={7} fill="#E07A6A" opacity={0.35} />)}
          <Cabelo />
          <Chapeu />
        </g>
        {/* braço da frente */}
        <g transform="translate(0 250)">
          <Braco x={luz === "esquerda" ? -92 : 92} rot={luz === "esquerda" ? bE : bD} ante={luz === "esquerda" ? aE : aD} lado={luz === "esquerda" ? 1 : -1} />
        </g>
      </g>
    </svg>
  );
};
