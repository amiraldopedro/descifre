/**
 * 008 — O Bom Samaritano (Darley e Batson, 1973): o homem caído na porta e a pressa, em 3D.
 * Fala: "No caminho, os pesquisadores colocaram um homem caído numa porta, tossindo e gemendo. (0–.35)
 *        | O que mudava era só a pressa. (.35–.5) | A alguns, eles diziam: você está atrasado, corre. (.5–.75)
 *        | A outros: ainda tem tempo. (.75–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import { Parede } from "../../3d/pecas";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "desce", p: 0.12 },
  { som: "tique", p: 0.52 }, { som: "tique", p: 0.56 }, { som: "tique", p: 0.6 },
  { som: "passos", p: 0.55 },
  { som: "passos", p: 0.8, vol: 0.5 },
  { som: "brilho", p: 0.95 },
];

const Relogio: React.FC<{ cor: string; f: number; rapido: boolean }> = ({ cor, f, rapido }) => {
  const a = f * (rapido ? 12 : 2);
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={38} fill={COR.branco} stroke={cor} strokeWidth={7} />
      <path d={`M45 45 L45 20`} stroke={COR.azulEscuro} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a} 45 45)`} />
      <path d={`M45 45 L62 45`} stroke={COR.azulEscuro} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a / 12} 45 45)`} />
    </svg>
  );
};

const Samaritano: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  // estudante atrasado corre e passa direto (.5–.72); o que tem tempo anda devagar e para (.76–.95)
  const xA = -6 + entre(p, 0.5, 0.72) * 12;
  const xB = -6 + entre(p, 0.76, 0.93) * 5.4;
  const parou = p > 0.93;
  const cam: [number, number, number] = [0.8 + Math.sin(f * 0.006) * 0.5, 2.2, 7.4 - p * 0.6];
  const alvo: [number, number, number] = [0, 0.8, -0.6];
  const kA = mola(fala * 0.52) * (1 - entre(p, 0.74, 0.78));
  const kB = mola(fala * 0.78);
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo} clima="dourado">
        <CameraFixa posicao={cam} alvo={alvo} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 12]} />
          <meshStandardMaterial color="#5A5068" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.06, 0.6]}>
          <boxGeometry args={[24, 0.12, 2]} />
          <meshStandardMaterial color="#8C8496" flatShading />
        </mesh>
        <Parede posicao={[0, 0, -1.4]} largura={20} altura={3.6} cor="#6B4A5E" porta={0.3} />
        {/* homem caído encostado na porta */}
        <group position={[0.3, 0.12, -0.9]}>
          <PessoaLowPoly cor="#5A6390" calca="#2A2F4F" seed={21} sentado balanco={2} olhando={0.2} />
        </group>
        {p > 0.48 && p < 0.76 && <PessoaLowPoly posicao={[xA, 0.12, 0.7]} cor={COR.vermelho} seed={3} olhando={Math.PI / 2} andar={1.6} />}
        {p > 0.74 && (
          <group position={[xB, 0.12 - (parou ? 0.35 : 0), 0.4 - (parou ? 0.6 : 0)]}>
            <PessoaLowPoly cor={COR.ciano} seed={5} olhando={parou ? -2.4 : Math.PI / 2} andar={parou ? 0 : 0.6} bracos={parou ? "frente" : "baixo"} />
          </group>
        )}
      </Palco3D>
      {kA > 0.01 && (
        <div style={{ position: "absolute", left: 120, top: 120, transform: `scale(${kA})`, transformOrigin: "left top", display: "flex", alignItems: "center", gap: 18, background: "rgba(7,15,51,.85)", borderRadius: 20, padding: "12px 24px", border: `4px solid ${COR.vermelho}` }}>
          <Relogio cor={COR.vermelho} f={f} rapido />
          <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52, color: COR.vermelho }}>ATRASADO</div>
        </div>
      )}
      {kB > 0.01 && (
        <div style={{ position: "absolute", left: 120, top: 120, transform: `scale(${kB})`, transformOrigin: "left top", display: "flex", alignItems: "center", gap: 18, background: "rgba(7,15,51,.85)", borderRadius: 20, padding: "12px 24px", border: `4px solid ${COR.ciano}` }}>
          <Relogio cor={COR.ciano} f={f} rapido={false} />
          <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52, color: COR.ciano }}>COM TEMPO</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Samaritano;
