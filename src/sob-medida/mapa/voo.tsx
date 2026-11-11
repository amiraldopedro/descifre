/**
 * Mapa animado de documentário (papel antigo): a câmera voa até o lugar, o país acende, o pino cai com nome e ano,
 * e uma rota pode ligar vários pontos. Serve para qualquer vídeo.
 *
 * {"tipo":"sobmedida","nome":"mapa/voo","props":{
 *    "pontos":[{"nome":"Estrasburgo","ano":1518,"lon":7.75,"lat":48.58,"p":0.35}],   // p = quando o pino cai (proporção da fala)
 *    "destaque":["France","Germany"],                                              // países (nome em inglês do world-atlas)
 *    "de":{"lon":10,"lat":45,"zoom":1.2}, "ate":{"lon":7.7,"lat":48.6,"zoom":7},   // voo da câmera (zoom 1 = mundo)
 *    "rota":true, "noite":false }}
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";
import { geoMercator, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import mundo from "world-atlas/countries-50m.json";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [{ som: "whoosh", p: 0.02 }];

type Ponto = { nome: string; ano?: string | number; lon: number; lat: number; p?: number };
type Vista = { lon: number; lat: number; zoom: number };

const W = 1920, H = 1080;
const SERIFA = "'Libre Baskerville', Georgia, serif";

const topo = mundo as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const PAISES = feature(topo, topo.objects.countries).features;
const FRONTEIRAS = mesh(topo, topo.objects.countries, (a, b) => a !== b);
const GRADE = geoGraticule10();

const Voo: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const pontos = (props.pontos as Ponto[]) ?? [];
  const destaque = new Set((props.destaque as string[]) ?? []);
  const noite = Boolean(props.noite);
  const de = (props.de as Vista) ?? { lon: pontos[0]?.lon ?? 0, lat: pontos[0]?.lat ?? 20, zoom: 1.3 };
  const ate = (props.ate as Vista) ?? { lon: pontos[0]?.lon ?? 0, lat: pontos[0]?.lat ?? 20, zoom: 5 };

  // voo: 0 -> 0,45 da fala, com aproximação lenta até o fim da cena
  const k = interpolate(p, [0, 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const deriva = interpolate(f, [0, dur], [1, 1.08]);
  const centro = geoInterpolate([de.lon, de.lat], [ate.lon, ate.lat])(k);
  const zoom = Math.exp(Math.log(de.zoom) + (Math.log(ate.zoom) - Math.log(de.zoom)) * k) * deriva;

  const proj = useMemo(() => geoMercator(), []);
  proj.scale((W / (2 * Math.PI)) * zoom).center(centro as [number, number]).translate([W / 2, H / 2 + 40]);
  const caminho = geoPath(proj);

  const mar = noite ? "#0E1C3A" : "#9DB6C2";
  const terra = noite ? "#1E2B55" : "#E8DCC0";
  const borda = noite ? "#4C5C96" : "#9C8868";
  const aceso = noite ? "#3B4C8E" : "#D6B27A";

  // rota: linha que se desenha ligando os pontos na ordem
  const rotaPts = pontos.map((pt) => proj([pt.lon, pt.lat]) as [number, number]);
  const r0 = pontos[0]?.p ?? 0.4, r1 = Math.max(r0 + 0.01, pontos[pontos.length - 1]?.p ?? 0.9);
  const rotaK = interpolate(p, [r0, r1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let rotaD = "";
  if (props.rota && rotaPts.length > 1) {
    const segs = rotaPts.length - 1;
    const total = rotaK * segs;
    for (let i = 0; i < segs; i++) {
      const t = Math.max(0, Math.min(1, total - i));
      if (t <= 0) break;
      const [a, b] = [rotaPts[i], rotaPts[i + 1]];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.2;
      const q = (u: number) => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * my + u * u * b[1]];
      const n = 24;
      for (let s = 0; s <= n * t; s++) {
        const [x, y] = q(s / n);
        rotaD += `${i === 0 && s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
    }
  }

  return (
    <AbsoluteFill style={{ background: mar }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="papel" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="ruido" />
            <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.18  0 0 0 0.16 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <radialGradient id="vinhetaMapa" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity={noite ? 0.7 : 0.5} />
          </radialGradient>
          <filter id="sombraTerra">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#203040" floodOpacity="0.35" />
          </filter>
        </defs>
        <path d={caminho(GRADE) ?? ""} stroke={noite ? "#24346A" : "#86A2B0"} strokeWidth={1.2} fill="none" />
        <g filter="url(#sombraTerra)">
          {PAISES.map((pa, i) => {
            const on = destaque.has(pa.properties.name);
            const kOn = on ? mola(fala * 0.3) : 0;
            return <path key={i} d={caminho(pa) ?? ""} fill={on ? aceso : terra} opacity={on ? 0.75 + 0.25 * kOn : 1} />;
          })}
        </g>
        <path d={caminho(FRONTEIRAS) ?? ""} stroke={borda} strokeWidth={1.4} fill="none" strokeDasharray={zoom > 3 ? "6 5" : undefined} />
        {PAISES.filter((pa) => destaque.has(pa.properties.name)).map((pa, i) => (
          <path key={`c${i}`} d={caminho(pa) ?? ""} fill="none" stroke={COR.vermelho} strokeWidth={3} opacity={mola(fala * 0.3)} />
        ))}
        <rect width={W} height={H} filter="url(#papel)" fill="#fff" opacity={noite ? 0.25 : 0.9} />
        {rotaD && <path d={rotaD} stroke={COR.vermelho} strokeWidth={6} fill="none" strokeDasharray="16 12" strokeLinecap="round" />}
        {pontos.map((pt, i) => {
          const [x, y] = rotaPts[i];
          const kp = mola(fala * (pt.p ?? 0.45));
          if (kp < 0.01) return null;
          const pulso = (f % 40) / 40;
          return (
            <g key={pt.nome} transform={`translate(${x} ${y})`}>
              <circle r={14 + pulso * 40} fill="none" stroke={COR.vermelho} strokeWidth={3} opacity={(1 - pulso) * 0.8 * kp} />
              <g transform={`translate(0 ${(1 - kp) * -60})`}>
                <path d="M0 0 C-14 -20 -22 -30 -22 -42 A22 22 0 0 1 22 -42 C22 -30 14 -20 0 0 Z" fill={COR.vermelho} stroke="#5A0F18" strokeWidth={3} />
                <circle cy={-42} r={8} fill="#FFF" />
              </g>
            </g>
          );
        })}
        <rect width={W} height={H} fill="url(#vinhetaMapa)" />
      </svg>
      {/* etiquetas dos pontos (HTML, para a fonte serifada) */}
      {(() => {
        // etiquetas de pontos vizinhos não se sobrepõem: troca o lado e, se preciso, desce a caixa
        const lados: { x: number; y: number; dir: boolean; top: number }[] = [];
        rotaPts.forEach(([x, y], i) => {
          let dir = x < W - 520;
          let top = y - 96;
          const perto = (d: boolean, t: number) => lados.some((o) => o.dir === d && Math.abs(o.top - t) < 110 && Math.abs(o.x - x) < 420);
          if (perto(dir, top)) dir = !dir;
          while (perto(dir, top)) top += 115;
          lados[i] = { x, y, dir, top };
        });
        return pontos.map((pt, i) => {
        const [x] = rotaPts[i];
        const kp = mola(fala * ((pt.p ?? 0.45) + 0.03));
        if (kp < 0.01) return null;
        const direita = lados[i].dir;
        return (
          <div key={pt.nome} style={{ position: "absolute", left: direita ? x + 34 : x - 34, top: lados[i].top, transform: `translateX(${direita ? 0 : -100}%) scale(${kp})`, transformOrigin: direita ? "left center" : "right center" }}>
            <div style={{ background: "rgba(7,15,51,.88)", borderLeft: `6px solid ${COR.ciano}`, padding: "10px 22px", borderRadius: "0 12px 12px 0", boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
              <div style={{ fontFamily: SERIFA, fontSize: 40, color: COR.branco, whiteSpace: "nowrap" }}>{pt.nome}</div>
              {pt.ano !== undefined && <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 26, color: COR.amarelo, letterSpacing: 4 }}>{pt.ano}</div>}
            </div>
          </div>
        );
        });
      })()}
    </AbsoluteFill>
  );
};

export default Voo;
