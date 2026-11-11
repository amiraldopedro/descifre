/**
 * 008 — Efeito espectador (Darley e Latané, 1968): cabines e interfone, em 3D.
 * Fala: "Em 1968, eles colocaram estudantes em cabines, conversando por um interfone. (0–.22) | De repente, um dos
 *        participantes parecia ter uma convulsão. (.22–.42) | Quem achava que estava sozinho com a vítima ajudou em
 *        85% dos casos. (.42–.7) | Quem achava que havia mais quatro pessoas ouvindo, só em 31%. (.7–1)"
 * Parte 1 (até .7): 2 cabines, a pessoa sai para ajudar. Parte 2: 6 cabines, ninguém sai.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "glitch", p: 0.24 },
  { som: "passos", p: 0.48, vol: 0.5 },
  { som: "ding", p: 0.6 },
  { som: "whoosh", p: 0.7 },
  { som: "desce", p: 0.86 },
];

const Cabine: React.FC<{ x: number; vitima?: boolean; alerta: number; f: number }> = ({ x, vitima, alerta, f }) => (
  <group position={[x, 0, 0]}>
    {[-0.75, 0.75].map((dx) => (
      <mesh key={dx} position={[dx, 1.1, 0]}>
        <boxGeometry args={[0.08, 2.2, 1.6]} />
        <meshStandardMaterial color="#3B4688" flatShading />
      </mesh>
    ))}
    <mesh position={[0, 1.1, -0.8]}>
      <boxGeometry args={[1.58, 2.2, 0.08]} />
      <meshStandardMaterial color="#323C78" flatShading />
    </mesh>
    {/* interfone na parede */}
    <mesh position={[0, 1.45, -0.74]}>
      <boxGeometry args={[0.32, 0.4, 0.06]} />
      <meshStandardMaterial color="#C5CBE0" emissive={vitima || alerta > 0 ? COR.vermelho : "#000"} emissiveIntensity={vitima ? 0.6 + 0.4 * Math.sin(f / 2) : alerta * (0.4 + 0.4 * Math.sin(f / 2))} />
    </mesh>
  </group>
);

const Interfone: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const parte2 = p >= 0.7;
  const alerta = entre(p, 0.24, 0.3);
  const n = parte2 ? 6 : 2;
  const xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 1.75);
  const sai = parte2 ? 0 : entre(p, 0.48, 0.62);
  const cam: [number, number, number] = parte2 ? [0, 3.4, 9.6 - entre(p, 0.7, 1) * 0.8] : [0.6, 2.8, 6.2 - p * 0.6];
  const alvo: [number, number, number] = [0, 1, 0];
  const pct = parte2 ? Math.round(31 * entre(p, 0.78, 0.92)) : Math.round(85 * entre(p, 0.52, 0.66));
  const kPct = mola(fala * (parte2 ? 0.76 : 0.5));
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo}>
        <CameraFixa posicao={cam} alvo={alvo} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 12]} />
          <meshStandardMaterial color="#262A48" roughness={0.95} />
        </mesh>
        {xs.map((x, i) => {
          const vit = i === n - 1;
          return (
            <group key={i}>
              <Cabine x={x} vitima={vit && alerta > 0} alerta={vit ? 0 : alerta} f={f} />
              {vit ? null : (
                <PessoaLowPoly
                  posicao={[x + (i === 0 ? sai * 1.6 : 0), 0, -0.1 + (i === 0 ? sai * 1.4 : 0)]}
                  cor={i === 0 ? COR.amarelo : "#8E99C2"}
                  seed={i * 5}
                  olhando={i === 0 && sai > 0 ? Math.PI / 2 : Math.PI}
                  andar={i === 0 && sai > 0 && sai < 1 ? 1 : 0}
                  bracos={!parte2 && i === 0 ? "baixo" : alerta > 0.5 ? "cruzados" : "baixo"}
                />
              )}
            </group>
          );
        })}
      </Palco3D>
      {alerta > 0.1 && (
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={1920} height={1080}>
          <path d={`M${parte2 ? 1500 : 1180} 300 l30 -40 l30 60 l30 -70 l30 50 l30 -30`} stroke={COR.vermelho} strokeWidth={8} fill="none" opacity={0.6 + 0.4 * Math.sin(f / 3)} strokeLinejoin="round" />
        </svg>
      )}
      <div style={{ position: "absolute", left: 80, top: 110, transform: `scale(${kPct})`, transformOrigin: "left top", background: "rgba(7,15,51,.85)", borderRadius: 22, padding: "16px 30px", border: `4px solid ${parte2 ? COR.vermelho : COR.ciano}` }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 26, color: COR.branco }}>{parte2 ? "COM MAIS 4 OUVINDO" : "SOZINHO COM A VÍTIMA"}</div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 96, color: parte2 ? COR.vermelho : COR.ciano, lineHeight: 1.05 }}>{pct}%</div>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: `${COR.branco}AA` }}>AJUDARAM</div>
      </div>
      <div style={{ position: "absolute", right: 90, top: 120, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 26, color: `${COR.branco}99`, opacity: interpolate(p, [0.02, 0.1], [0, 1], { extrapolateRight: "clamp" }) }}>
        DARLEY E LATANÉ · 1968
      </div>
    </AbsoluteFill>
  );
};

export default Interfone;
