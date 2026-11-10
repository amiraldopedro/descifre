import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR, FONTE_TITULO } from "./tema";

/** Biblioteca de animações ilustradas. Cada uma desenha num quadro 500x500. */
type Il = React.FC<{ f: number; k: number }>; // f = frame da cena, k = mola de entrada 0..1

const T = { stroke: COR.azulEscuro, strokeWidth: 10, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const engrenagem = (cx: number, cy: number, r: number, dentes: number, ang: number, cor: string) => {
  const p: string[] = [];
  for (let i = 0; i < dentes * 2; i++) {
    const a = (i / (dentes * 2)) * Math.PI * 2;
    const rr = i % 2 ? r : r * 0.78;
    for (const d of [-0.12, 0.12]) p.push(`${cx + Math.cos(a + d) * rr},${cy + Math.sin(a + d) * rr}`);
  }
  return (
    <g transform={`rotate(${ang} ${cx} ${cy})`}>
      <polygon points={p.join(" ")} fill={cor} {...T} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={COR.azulEscuro} />
    </g>
  );
};

const lampada: Il = ({ f }) => {
  const on = interpolate(f, [14, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulsa = 1 + Math.sin(f / 5) * 0.05;
  return (
    <>
      <circle cx={250} cy={210} r={190 * pulsa} fill="#FFF6C2" opacity={0.2 * on} />
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + f / 40;
        return <path key={i} d={`M${250 + Math.cos(a) * 185} ${210 + Math.sin(a) * 185} L${250 + Math.cos(a) * 225} ${210 + Math.sin(a) * 225}`} {...T} stroke={COR.amarelo} opacity={on} />;
      })}
      <path d="M250 70 C150 70 110 150 130 220 C145 270 190 290 195 340 L305 340 C310 290 355 270 370 220 C390 150 350 70 250 70 Z" fill={on > 0.5 ? COR.amarelo : "#8FA0C8"} {...T} />
      <path d="M215 240 L235 200 L265 200 L285 240" fill="none" {...T} stroke={on > 0.5 ? "#fff" : COR.azulEscuro} />
      <rect x={195} y={340} width={110} height={70} rx={14} fill="#B8C2DD" {...T} />
      <path d="M200 365 H300 M200 388 H300" {...T} strokeWidth={6} />
    </>
  );
};

const engrenagens: Il = ({ f }) => (
  <>
    {engrenagem(190, 210, 130, 10, f * 2, COR.azulClaro)}
    {engrenagem(350, 345, 90, 8, -f * 2.5 + 22, COR.vermelho)}
    {engrenagem(120, 400, 60, 6, f * 3.4, COR.amarelo)}
  </>
);

const NOS = [
  [90, 130], [250, 70], [410, 140], [150, 290], [340, 280], [80, 430], [250, 440], [420, 410],
];
const LIG = [
  [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [3, 6], [4, 6], [4, 7], [3, 4],
];
const neuronios: Il = ({ f }) => (
  <>
    {LIG.map(([a, b], i) => {
      const t = ((f + i * 9) % 40) / 40;
      const [x1, y1] = NOS[a];
      const [x2, y2] = NOS[b];
      return (
        <g key={i}>
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={COR.ciano} strokeWidth={6} opacity={0.5} />
          <circle cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={10} fill={COR.amarelo} />
        </g>
      );
    })}
    {NOS.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={26 + Math.sin(f / 6 + i) * 5} fill={i % 3 ? COR.azulClaro : COR.vermelho} {...T} strokeWidth={7} />
    ))}
  </>
);

const dominos: Il = ({ f }) => (
  <>
    <path d="M20 430 H480" {...T} stroke={COR.ciano} />
    {[...Array(7)].map((_, i) => {
      const a = interpolate(f, [12 + i * 5, 20 + i * 5], [0, i === 6 ? 78 : 62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const x = 50 + i * 62;
      return (
        <g key={i} transform={`rotate(${a} ${x + 28} 430)`}>
          <rect x={x} y={250} width={28} height={180} rx={6} fill={i % 2 ? COR.vermelho : COR.branco} {...T} strokeWidth={7} />
          <circle cx={x + 14} cy={300} r={6} fill={COR.azulEscuro} />
          <circle cx={x + 14} cy={380} r={6} fill={COR.azulEscuro} />
        </g>
      );
    })}
  </>
);

const balanca: Il = ({ f }) => {
  const a = Math.sin(f / 14) * 13;
  const prato = (x: number, cor: string) => {
    const r = (a * Math.PI) / 180;
    const px = 250 + (x - 250) * Math.cos(r);
    const py = 150 + (x - 250) * Math.sin(r);
    return (
      <g>
        <path d={`M${px} ${py} L${px - 60} ${py + 150} M${px} ${py} L${px + 60} ${py + 150}`} {...T} strokeWidth={6} stroke={COR.branco} />
        <path d={`M${px - 80} ${py + 150} Q${px} ${py + 215} ${px + 80} ${py + 150} Z`} fill={cor} {...T} />
      </g>
    );
  };
  return (
    <>
      <path d="M250 110 V430 M170 440 H330" {...T} stroke={COR.branco} strokeWidth={16} />
      <g transform={`rotate(${a} 250 150)`}>
        <path d="M80 150 H420" {...T} stroke={COR.branco} strokeWidth={14} />
      </g>
      {prato(80, COR.vermelho)}
      {prato(420, COR.azulClaro)}
      <circle cx={250} cy={150} r={20} fill={COR.amarelo} {...T} />
    </>
  );
};

const ampulheta: Il = ({ f }) => {
  const t = (f % 120) / 120;
  return (
    <>
      <path d="M130 70 H370 M130 430 H370" {...T} stroke={COR.amarelo} strokeWidth={22} />
      <path d="M150 80 H350 Q350 200 262 250 Q350 300 350 420 H150 Q150 300 238 250 Q150 200 150 80 Z" fill="rgba(91,224,255,.25)" {...T} stroke={COR.branco} />
      <clipPath id="ilTop"><rect x={150} y={80 + 150 * t} width={200} height={170} /></clipPath>
      <path d="M165 92 H335 Q330 190 250 240 Q170 190 165 92 Z" fill={COR.amarelo} clipPath="url(#ilTop)" />
      <path d={`M${250 - 85 * t} 412 Q250 ${412 - 150 * t} ${250 + 85 * t} 412 Z`} fill={COR.amarelo} />
      <path d="M250 250 V408" stroke={COR.amarelo} strokeWidth={6} strokeDasharray="10 12" strokeDashoffset={-f * 3} />
    </>
  );
};

const marionete: Il = ({ f }) => {
  const s = Math.sin(f / 9);
  const hx = 250 + s * 26;
  return (
    <>
      <g transform={`rotate(${s * 8} 250 60)`}>
        <path d="M110 60 H390 M250 20 V100" {...T} stroke={COR.amarelo} strokeWidth={20} />
      </g>
      {[[130, hx - 62, 330], [250, hx, 215], [370, hx + 62, 330]].map(([x1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${62 + (i - 1) * s * 18} L${x2} ${y2}`} stroke={COR.branco} strokeWidth={5} />
      ))}
      <g transform={`rotate(${-s * 7} ${hx} 220)`}>
        <path d={`M${hx - 40} 300 L${hx - 62} ${330 - s * 14} M${hx + 40} 300 L${hx + 62} ${330 + s * 14}`} {...T} stroke={COR.vermelho} strokeWidth={20} />
        <rect x={hx - 42} y={285} width={84} height={110} rx={20} fill={COR.vermelho} {...T} />
        <path d={`M${hx - 20} 395 V470 M${hx + 20} 395 V470`} {...T} stroke={COR.azulClaro} strokeWidth={22} />
        <circle cx={hx} cy={245} r={44} fill="#F1D3B8" {...T} />
        <circle cx={hx - 15} cy={242} r={6} fill={COR.azulEscuro} />
        <circle cx={hx + 15} cy={242} r={6} fill={COR.azulEscuro} />
      </g>
    </>
  );
};

const raio: Il = ({ f }) => {
  const pisca = f % 14 < 3 ? 1 : 0.85;
  const treme = f % 14 < 3 ? Math.sin(f * 9) * 8 : 0;
  return (
    <g transform={`translate(${treme} 0)`}>
      <circle cx={250} cy={250} r={200} fill={COR.ciano} opacity={f % 14 < 3 ? 0.35 : 0.12} />
      <path d="M290 30 L130 280 H235 L200 470 L375 200 H265 Z" fill={COR.amarelo} {...T} opacity={pisca} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${90 + i * 105} ${90 + ((f * 7 + i * 50) % 300)} l14 22 l-16 12 l12 22`} fill="none" stroke={COR.ciano} strokeWidth={6} strokeLinecap="round" />
      ))}
    </g>
  );
};

const grafico: Il = ({ f }) => {
  const alt = [90, 150, 130, 230, 320];
  return (
    <>
      <path d="M60 60 V440 H460" {...T} stroke={COR.branco} fill="none" />
      {alt.map((h, i) => {
        const k = interpolate(f, [6 + i * 5, 18 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <rect key={i} x={95 + i * 72} y={435 - h * k} width={50} height={h * k} rx={8} fill={i === 4 ? COR.vermelho : COR.azulClaro} {...T} strokeWidth={6} />;
      })}
      <path
        d="M100 330 L190 270 L262 290 L334 190 L420 80 M420 80 L360 92 M420 80 L414 142"
        fill="none"
        {...T}
        stroke={COR.amarelo}
        strokeDasharray={700}
        strokeDashoffset={interpolate(f, [20, 45], [700, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </>
  );
};

const cadeado: Il = ({ f }) => {
  const abre = interpolate(f, [18, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <g transform={`translate(0 ${-abre * 46}) rotate(${-abre * 24} 340 240)`}>
        <path d="M160 250 V170 Q160 80 250 80 Q340 80 340 170 V250" fill="none" {...T} stroke="#B8C2DD" strokeWidth={34} />
      </g>
      <rect x={110} y={235} width={280} height={215} rx={34} fill={abre > 0.5 ? COR.amarelo : COR.vermelho} {...T} />
      <circle cx={250} cy={320} r={30} fill={COR.azulEscuro} />
      <path d="M250 330 V385" {...T} strokeWidth={22} />
    </>
  );
};

const coracao: Il = ({ f }) => {
  const b = 1 + Math.max(0, Math.sin(f / 4)) * 0.12;
  return (
    <g transform={`translate(250 260) scale(${b}) translate(-250 -260)`}>
      <path d="M250 430 C80 310 60 190 130 130 C190 80 240 120 250 160 C260 120 310 80 370 130 C440 190 420 310 250 430 Z" fill={COR.vermelho} {...T} />
      <path d="M150 190 Q160 150 200 150" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

const olho: Il = ({ f }) => {
  const abre = interpolate(f, [4, 14], [0.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (f % 90 > 85 ? 0.1 : 1);
  const px = Math.sin(f / 13) * 46;
  return (
    <>
      <g transform={`translate(250 250) scale(1 ${abre}) translate(-250 -250)`}>
        <path d="M40 250 Q250 60 460 250 Q250 440 40 250 Z" fill={COR.branco} {...T} />
        <circle cx={250 + px} cy={250} r={86} fill={COR.azulClaro} {...T} />
        <circle cx={250 + px} cy={250} r={40} fill={COR.azulEscuro} />
        <circle cx={228 + px} cy={226} r={15} fill="#fff" />
      </g>
      {[-1, 0, 1].map((i) => (
        <path key={i} d={`M${250 + i * 110} ${70 - Math.abs(i) * -22} l${i * 14} -44`} {...T} stroke={COR.ciano} opacity={abre} />
      ))}
    </>
  );
};

const interrogacao: Il = ({ f }) => {
  const y = Math.abs(Math.sin(f / 7)) * -36;
  return (
    <g transform={`translate(0 ${y}) rotate(${Math.sin(f / 10) * 7} 250 250)`}>
      <path d="M160 170 Q160 70 250 70 Q345 70 345 160 Q345 220 290 250 Q250 272 250 330" fill="none" {...T} stroke={COR.azulEscuro} strokeWidth={76} />
      <path d="M160 170 Q160 70 250 70 Q345 70 345 160 Q345 220 290 250 Q250 272 250 330" fill="none" {...T} stroke={COR.amarelo} strokeWidth={52} />
      <circle cx={250} cy={420} r={36} fill={COR.amarelo} {...T} strokeWidth={12} />
    </g>
  );
};

export const ILUSTRACOES: Record<string, Il> = {
  lampada, engrenagens, neuronios, dominos, balanca, ampulheta, marionete, raio, grafico, cadeado, coracao, olho, interrogacao,
};

export const Ilustracao: React.FC<{ nome: string; texto?: string; tamanho: number }> = ({ nome, texto, tamanho }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame: f, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
  const C = ILUSTRACOES[nome] ?? interrogacao;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${k}) rotate(${(1 - k) * -12}deg)` }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 500 500" style={{ overflow: "visible", filter: "drop-shadow(0 16px 30px rgba(0,0,0,.45))" }}>
        <C f={f} k={k} />
      </svg>
      {texto && (
        <div
          style={{
            marginTop: 8,
            fontFamily: FONTE_TITULO,
            fontWeight: 800,
            fontSize: tamanho * 0.13,
            color: COR.branco,
            textAlign: "center",
            WebkitTextStroke: `${tamanho * 0.025}px ${COR.azulEscuro}`,
            paintOrder: "stroke fill",
          }}
        >
          {texto}
        </div>
      )}
    </div>
  );
};
