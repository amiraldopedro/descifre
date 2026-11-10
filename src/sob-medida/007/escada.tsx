/**
 * 007 — A escada do QI (3D). props.degrau: 0 = visão geral, 1..4 = QI 70, 100, 130, 160.
 * Em cada degrau a pessoa vermelha sobe (p .05–.2), a câmera enquadra o degrau e aparece o clima dele:
 *  70: letras miúdas voando · 100: a multidão (a maioria) · 130: cristais/padrões · 160: sozinha, longe dos outros.
 * Fala (degrau 0): "Imagina uma escada. No primeiro degrau, QI setenta. No último, cento e sessenta.
 *                   Será que o mundo parece o mesmo lá de cima?" — números aparecem em p .3 e .55.
 */
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, Cristal, entre, Palco3D, PessoaLowPoly, TerrenoLowPoly, useTamanho } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "sobe", p: 0.06 },
  { som: "pop", p: 0.2 },
  { som: "brilho", p: 0.3 },
  { som: "pop", p: 0.55 },
];

const BASE = -2;
const DEGRAUS = [
  { qi: 70, x: -4.5, h: 0.6, cor: COR.azulClaro, chips: ["O MUNDO É ESCRITO RÁPIDO"] },
  { qi: 100, x: -1.5, h: 1.5, cor: COR.ciano, chips: ["O MUNDO FOI FEITO PRA MÉDIA"] },
  { qi: 130, x: 1.5, h: 2.4, cor: COR.amarelo, chips: ["PADRÕES RÁPIDOS", "TÉDIO NA ESCOLA"] },
  { qi: 160, x: 4.5, h: 3.3, cor: COR.vermelho, chips: ["DISTÂNCIA", "OUTRA LÍNGUA"] },
];

type V3 = [number, number, number];
const camDe = (n: number): { pos: V3; alvo: V3 } => {
  if (n <= 0) return { pos: [0, 2.2, 15], alvo: [0, 0, 0] };
  const d = DEGRAUS[n - 1];
  return { pos: [d.x + 2, BASE + d.h + 3.4, 10.5], alvo: [d.x, BASE + d.h - 0.4, 0] };
};
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const projetar = (p: V3, cam: V3, alvo: V3, w: number, h: number) => {
  const c = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  c.position.set(...cam);
  c.lookAt(...alvo);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { left: ((v.x + 1) / 2) * w, top: ((1 - v.y) / 2) * h };
};

const Papeis: React.FC<{ d: (typeof DEGRAUS)[0]; f: number; k: number }> = ({ d, f, k }) => (
  <group>
    {Array.from({ length: 10 }).map((_, i) => {
      const a = i * 0.63 + f * 0.015;
      return (
        <mesh key={i} position={[d.x + Math.cos(a) * 1.6, BASE + d.h + 1.2 + Math.sin(a * 1.7) * 0.6, Math.sin(a) * 1.2]} rotation={[a, a * 0.5, 0]} scale={k}>
          <boxGeometry args={[0.32, 0.42, 0.02]} />
          <meshStandardMaterial color={COR.branco} />
        </mesh>
      );
    })}
  </group>
);

const Escada: React.FC<PropsSobMedida> = ({ fala, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const { width, height } = useTamanho();
  const p = f / Math.max(1, fala);
  const n = Number(props.degrau ?? 0);

  const voo = entre(p, 0.0, 0.22);
  const de = camDe(Math.max(0, n - 1));
  const para = camDe(n);
  const cam = n === 0 ? ([Math.sin(f * 0.006) * 1.5, 2.2, 15 - p * 1.5] as V3) : mix(de.pos, para.pos, voo);
  const alvo = n === 0 ? ([0, 0, 0] as V3) : mix(de.alvo, para.alvo, voo);

  // a pessoa vermelha: no chão (degrau 0), depois pula de um degrau para o próximo
  const ondeX = (m: number) => (m <= 0 ? -6.6 : DEGRAUS[m - 1].x);
  const ondeY = (m: number) => (m <= 0 ? BASE : BASE + DEGRAUS[m - 1].h);
  const pulo = n === 0 ? 0 : entre(p, 0.05, 0.2);
  const px = ondeX(n - 1) + (ondeX(n) - ondeX(n - 1)) * pulo;
  const py = ondeY(n - 1) + (ondeY(n) - ondeY(n - 1)) * pulo + Math.sin(pulo * Math.PI) * 0.8;
  const kClima = mola(fala * 0.2);

  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo}>
        <CameraFixa posicao={cam} alvo={alvo} />
        <TerrenoLowPoly y={BASE - 0.02} altura={0.15} cor={COR.azul} />
        {DEGRAUS.map((d, i) => (
          <mesh key={d.qi} position={[d.x, BASE + d.h / 2, 0]}>
            <boxGeometry args={[2.9, d.h, 3]} />
            <meshStandardMaterial color={d.cor} flatShading emissive={d.cor} emissiveIntensity={n === i + 1 ? 0.25 : 0.05} />
          </mesh>
        ))}
        <PessoaLowPoly posicao={[px, py, 0.3]} cor={COR.vermelho} olhando={0.35} seed={3} escala={0.95} />
        {/* clima de cada degrau */}
        {n === 1 && <Papeis d={DEGRAUS[0]} f={f} k={kClima} />}
        {n === 2 &&
          Array.from({ length: 9 }).map((_, i) => (
            <PessoaLowPoly key={i} posicao={[DEGRAUS[1].x - 1.1 + (i % 3) * 1.1, BASE + DEGRAUS[1].h, -1.1 + Math.floor(i / 3) * 0.9 - 0.3]} cor="#8E99C2" escala={0.75 * kClima} seed={10 + i} olhando={(random(`o${i}`) - 0.5) * 1.5} />
          ))}
        {n === 3 && [0, 1, 2, 3].map((i) => <Cristal key={i} posicao={[DEGRAUS[2].x - 1.2 + i * 0.8, BASE + DEGRAUS[2].h + 2 + (i % 2) * 0.5, -0.8]} cor={i % 2 ? COR.ciano : COR.amarelo} escala={0.32 * kClima} seed={i} />)}
        {n === 4 &&
          Array.from({ length: 6 }).map((_, i) => (
            <PessoaLowPoly key={i} posicao={[DEGRAUS[1].x - 1 + i * 0.4, BASE + DEGRAUS[1].h, -0.8]} cor="#8E99C2" escala={0.6} seed={20 + i} olhando={0.6} />
          ))}
      </Palco3D>
      {/* números nos degraus */}
      {DEGRAUS.map((d, i) => {
        const k = n === 0 ? mola(fala * (i === 0 ? 0.3 : i === 3 ? 0.55 : 0.42)) : n === i + 1 ? 1 : 0.55;
        const pos = projetar([d.x, BASE + d.h / 2, 1.55], cam, alvo, width, height);
        if (pos.left < -200 || pos.left > width + 200) return null;
        return (
          <div
            key={d.qi}
            style={{
              position: "absolute", left: pos.left - 110, top: pos.top - 50, width: 220, textAlign: "center", transform: `scale(${k})`,
              fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: n === i + 1 ? 90 : 64, color: n === i + 1 || n === 0 ? COR.branco : `${COR.branco}99`,
              textShadow: "0 6px 20px rgba(0,0,0,.6)",
            }}
          >
            {d.qi}
          </div>
        );
      })}
      {n > 0 && (
        <>
          <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 60, color: COR.branco, opacity: entre(p, 0.15, 0.25), textShadow: "0 6px 20px rgba(0,0,0,.6)" }}>
            DEGRAU {DEGRAUS[n - 1].qi}
          </div>
          <div style={{ position: "absolute", top: 160, width: "100%", display: "flex", justifyContent: "center", gap: 26 }}>
            {DEGRAUS[n - 1].chips.map((c, i) => {
              const k = mola(fala * (0.3 + i * 0.3));
              return (
                <div key={c} style={{ transform: `scale(${k})`, opacity: Math.min(1, k * 2), fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 38, color: COR.azulEscuro, background: i ? COR.ciano : COR.amarelo, padding: "10px 26px", borderRadius: 16 }}>
                  {c}
                </div>
              );
            })}
          </div>
        </>
      )}
      {n === 0 && (
        <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: COR.branco, opacity: entre(p, 0.6, 0.7), textShadow: "0 6px 20px rgba(0,0,0,.6)" }}>
          O MUNDO É O MESMO?
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Escada;
