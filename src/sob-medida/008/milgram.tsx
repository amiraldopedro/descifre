/**
 * 008 — Milgram: o professor, o homem de jaleco e o aluno do outro lado da parede, em 3D.
 * Fala: "Conforme a voltagem subia, o aluno gritava, reclamava do coração, implorava para sair. (0–.5)
 *        | E então ficava em silêncio. (.5–.62) | Se o professor hesitava, o homem de jaleco dizia apenas:
 *        por favor, continue. (.62–1)"
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import { Cadeira, Mesa, Parede } from "../../3d/pecas";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "zap", p: 0.06 }, { som: "zap", p: 0.2 }, { som: "zap", p: 0.34 }, { som: "zap", p: 0.46 },
  { som: "desce", p: 0.52 },
  { som: "tique", p: 0.6 },
  { som: "click", p: 0.7 },
];

const BALOES = [
  { t: "AI!", p: 0.07 },
  { t: "MEU CORAÇÃO!", p: 0.2 },
  { t: "ME TIRA DAQUI!", p: 0.34 },
];

const Balao: React.FC<{ texto: string; k: number; x: number; y: number; cor?: string; corTexto?: string }> = ({ texto, k, x, y, cor = COR.branco, corTexto = COR.azulEscuro }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${k})`, transformOrigin: "bottom left", opacity: Math.min(1, k * 2) }}>
    <div style={{ background: cor, color: corTexto, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, padding: "14px 26px", borderRadius: 26, whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>{texto}</div>
    <div style={{ width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderTop: `24px solid ${cor}`, marginLeft: 40 }} />
  </div>
);

const Milgram: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const volts = Math.round(interpolate(p, [0, 0.5], [150, 330], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) / 15) * 15;
  const silencio = p > 0.52;
  const hesita = entre(p, 0.6, 0.64);
  const kContinue = mola(fala * 0.7);
  const cam: [number, number, number] = [interpolate(p, [0, 1], [3.2, -0.6]), 2.6, 7.2 - p * 1.2];
  const alvo: [number, number, number] = [interpolate(p, [0, 1], [0.6, -1.4]), 1, 0];
  const atual = BALOES.filter((b) => p >= b.p && p < 0.5).pop();
  const piscar = !silencio && Math.floor(f / 4) % 2 === 0;
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo}>
        <CameraFixa posicao={cam} alvo={alvo} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="#2A2B48" roughness={0.95} />
        </mesh>
        <Parede posicao={[0, 0, -2.2]} largura={14} altura={3.2} cor="#323C78" />
        {/* parede que separa as duas salas */}
        <Parede posicao={[1.2, 0, -0.4]} largura={3.6} altura={3.2} cor="#3B4688" rotacao={Math.PI / 2} />
        {/* sala do professor */}
        <Mesa posicao={[-1.6, 0, 0.2]} largura={1.8} />
        <mesh position={[-1.6, 0.95, 0.05]}>
          <boxGeometry args={[1.5, 0.28, 0.4]} />
          <meshStandardMaterial color="#3A4060" flatShading />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[-2.25 + i * 0.145, 0.95, 0.26]}>
            <boxGeometry args={[0.08, 0.12, 0.04]} />
            <meshStandardMaterial color={i > 6 ? COR.vermelho : "#C5CBE0"} emissive={i === Math.min(9, Math.floor((volts - 150) / 20)) ? COR.amarelo : "#000"} emissiveIntensity={0.9} />
          </mesh>
        ))}
        <PessoaLowPoly posicao={[-1.6, 0, 1.15]} cor="#6E7BB0" seed={7} olhando={Math.PI + hesita * 0.6} bracos={hesita > 0.5 ? "baixo" : "frente"} />
        {/* homem de jaleco cinza */}
        <PessoaLowPoly posicao={[-3.1, 0, -0.9]} cor="#8C8F9E" calca="#3A3D4E" cabelo="#1B1B2F" estilo="curto" seed={9} olhando={0.6} bracos="cruzados" />
        {/* sala do aluno */}
        <Cadeira posicao={[3, 0, -0.4]} olhando={-Math.PI / 2} />
        <PessoaLowPoly posicao={[3, 0, -0.4]} cor="#C94A3A" seed={11} olhando={-Math.PI / 2} sentado balanco={silencio ? 0 : 4} />
        {[-0.25, 0.25].map((z) => (
          <mesh key={z} position={[2.75, 0.62, -0.4 + z]}>
            <boxGeometry args={[0.12, 0.06, 0.12]} />
            <meshStandardMaterial color="#1A1A2A" emissive={piscar ? COR.ciano : "#000"} emissiveIntensity={1} />
          </mesh>
        ))}
      </Palco3D>
      {/* voltímetro */}
      <div style={{ position: "absolute", left: 70, top: 110, background: "rgba(7,15,51,.85)", border: `4px solid ${volts >= 300 ? COR.vermelho : COR.amarelo}`, borderRadius: 20, padding: "14px 28px" }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: COR.ciano }}>VOLTAGEM</div>
        <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 84, color: volts >= 300 ? COR.vermelho : COR.branco, lineHeight: 1 }}>{volts} V</div>
      </div>
      {atual && <Balao key={atual.t} texto={atual.t} k={mola(fala * atual.p)} x={1180} y={230} />}
      {silencio && p < 0.66 && <Balao texto="..." k={mola(fala * 0.53)} x={1220} y={230} cor="#8E99C2" />}
      {kContinue > 0.01 && <Balao texto="Por favor, continue." k={kContinue} x={260} y={260} cor="#C5CBE0" />}
    </AbsoluteFill>
  );
};

export default Milgram;
