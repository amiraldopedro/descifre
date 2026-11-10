/**
 * Prova 4 — Ancoragem (Strack e Mussweiler, 1997), em 3D.
 * Fala: "Ele morreu com setenta e oito anos. (0–.16) | Mas repara: o número absurdo da pergunta puxou o seu chute. (.16–.41)
 *        | Num estudo de 1997, quem ouviu cento e quarenta chutou, em média, sessenta e sete anos. (.41–.89)
 *        | Quem ouviu nove chutou cinquenta. (.89–1)"
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import { CameraFixa, entre, Palco3D, useTamanho } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "pop", p: 0.03 },
  { som: "desce", p: 0.2 },
  { som: "batida", p: 0.28 },
  { som: "sobe", p: 0.6 },
  { som: "ding", p: 0.84 },
  { som: "sobe", p: 0.89, vol: 0.8 },
  { som: "ding", p: 0.99 },
];

const BASE = -1.9;
const ESC = 0.036; // unidades 3D por ano
const CAM: [number, number, number] = [0, 0.4, 10];
const ALVO: [number, number, number] = [0, -0.2, 0];

const Ancora: React.FC<{ x: number; y: number; cor: string; balanco: number }> = ({ x, y, cor, balanco }) => (
  <group position={[x, y, 0]} rotation={[0, 0, balanco]}>
    <mesh position={[0, 3, 0]}>
      <cylinderGeometry args={[0.025, 0.025, 6, 4]} />
      <meshBasicMaterial color={COR.ciano} transparent opacity={0.5} />
    </mesh>
    <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.2, 0.06, 4, 8]} />
      <meshStandardMaterial color={cor} flatShading metalness={0.5} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[0.08, 0.08, 1.5, 6]} />
      <meshStandardMaterial color={cor} flatShading metalness={0.5} />
    </mesh>
    <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.06, 0.06, 0.8, 6]} />
      <meshStandardMaterial color={cor} flatShading metalness={0.5} />
    </mesh>
    <mesh position={[0, -0.25, 0]} rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[0.55, 0.08, 4, 10, Math.PI]} />
      <meshStandardMaterial color={cor} flatShading metalness={0.5} />
    </mesh>
    {[-1, 1].map((l) => (
      <mesh key={l} position={[l * 0.55, -0.15, 0]} rotation={[0, 0, l * 0.5]}>
        <coneGeometry args={[0.14, 0.32, 4]} />
        <meshStandardMaterial color={cor} flatShading metalness={0.5} />
      </mesh>
    ))}
  </group>
);

const Barra: React.FC<{ x: number; valor: number; cor: string }> = ({ x, valor, cor }) => {
  const h = Math.max(0.001, valor * ESC);
  return (
    <mesh position={[x, BASE + h / 2, 0]}>
      <boxGeometry args={[1.5, h, 1.0]} />
      <meshStandardMaterial color={cor} flatShading emissive={cor} emissiveIntensity={0.25} />
    </mesh>
  );
};

const AncoraCena: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const { width, height } = useTamanho();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  // projeta pontos 3D na tela para colocar os textos no lugar certo
  const cam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    c.position.set(...CAM);
    c.lookAt(...ALVO);
    c.updateMatrixWorld();
    return c;
  }, [width, height]);
  const tela = (x: number, y: number) => {
    const v = new THREE.Vector3(x, y, 0).project(cam);
    return { left: ((v.x + 1) / 2) * width, top: ((1 - v.y) / 2) * height };
  };

  const k78 = mola(fala * 0.02);
  const desce = entre(p, 0.18, 0.3);
  const v140 = entre(p, 0.6, 0.84) * 67;
  const v9 = entre(p, 0.89, 0.99) * 50;
  const yAnc = 5.2 - desce * 3.25; // termina logo acima da linha dos 78
  const linha78 = BASE + 78 * ESC;

  const rotulo = (x: number, y: number, txt: string, cor: string, op: number, size = 40) => {
    const t = tela(x, y);
    return (
      <div style={{ position: "absolute", left: t.left, top: t.top, transform: "translate(-50%,-50%)", opacity: op, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: size, color: cor, whiteSpace: "nowrap", textShadow: "0 4px 16px rgba(0,0,0,.7)" }}>
        {txt}
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <Palco3D camera={CAM}>
        <CameraFixa posicao={CAM} alvo={ALVO} />
        {/* chão */}
        <mesh position={[0, BASE - 0.05, 0]}>
          <boxGeometry args={[9, 0.1, 2.5]} />
          <meshStandardMaterial color={COR.azul} flatShading />
        </mesh>
        {/* idade real */}
        <mesh position={[0, linha78, 0.6]} scale={[k78, 1, 1]}>
          <boxGeometry args={[7.5, 0.05, 0.05]} />
          <meshBasicMaterial color={COR.amarelo} />
        </mesh>
        <Barra x={-2} valor={v9} cor={COR.azulClaro} />
        <Barra x={2} valor={v140} cor={COR.vermelho} />
        <Ancora x={-2} y={yAnc} cor="#9FB0D6" balanco={Math.sin(f / 16) * 0.08 * (1 - desce * 0.5)} />
        <Ancora x={2} y={yAnc} cor="#9FB0D6" balanco={Math.sin(f / 16 + 1) * 0.08 * (1 - desce * 0.5)} />
      </Palco3D>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="PROVA 4 DE 7" />
      </div>
      {rotulo(0, linha78 + 0.25, "IDADE REAL: 78", COR.amarelo, k78, 34)}
      {rotulo(-3.6, yAnc + 0.1, "OUVIU 9", COR.ciano, desce)}
      {rotulo(3.75, yAnc + 0.1, "OUVIU 140", COR.vermelho, desce)}
      {v140 > 1 && rotulo(2, BASE + v140 * ESC - 0.35, `${Math.round(v140)}`, COR.branco, 1, 64)}
      {v9 > 1 && rotulo(-2, BASE + v9 * ESC - 0.35, `${Math.round(v9)}`, COR.branco, 1, 64)}
      {p > 0.6 && (
        <div style={{ position: "absolute", top: 800, width: "100%", textAlign: "center", fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 30, color: COR.branco, opacity: 0.8 }}>
          CHUTE MÉDIO DA IDADE
        </div>
      )}
    </AbsoluteFill>
  );
};

export default AncoraCena;
