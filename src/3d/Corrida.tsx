/**
 * "Gameplay" original do Descifre: um corredor low poly pulando entre plataformas no céu.
 * Feito do zero (sem Minecraft, Subway Surfers etc.), então não tem direito autoral de terceiros.
 * É contínuo: usa o frame GLOBAL do vídeo (passe "frame"), para não "reiniciar" a cada cena.
 */
import React, { useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { random } from "remotion";
import { PessoaLowPoly } from "./kit";

const L = 4.2; // comprimento de um trecho (plataforma + buraco)
const PLAT = 3.0; // parte com chão
const VEL = 0.17; // unidades por frame
const CORES = ["#22D3EE", "#FACC15", "#F43F5E", "#A78BFA", "#34D399", "#FB923C"];

const trecho = (i: number) => {
  const x = Math.sin(i * 0.9) * 1.6 + (random(`cx${i}`) - 0.5) * 0.8;
  const y = Math.round((Math.sin(i * 0.55) * 1.2 + (random(`cy${i}`) - 0.5)) * 2) / 2;
  return {
    x, y, z: -i * L,
    cor: CORES[Math.floor(random(`cor${i}`) * CORES.length)],
    moeda: random(`m${i}`) > 0.35,
    caixa: i > 3 && random(`cx2${i}`) > 0.7,
    largura: 1.6 + random(`lg${i}`) * 0.6,
  };
};

/** Onde o corredor está no frame f (posição e se está no ar). */
const corredor = (f: number) => {
  const s = f * VEL;
  const i = Math.floor(s / L);
  const u = s / L - i; // 0..1 dentro do trecho
  const a = trecho(i), b = trecho(i + 1);
  const fimChao = PLAT / L;
  if (u < fimChao * 0.85) {
    const k = u / (fimChao * 0.85);
    return { x: a.x, y: a.y, z: -s, ar: 0, i, k };
  }
  const k = (u - fimChao * 0.85) / (1 - fimChao * 0.85); // pulo até a próxima
  const e = k * k * (3 - 2 * k);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e + Math.sin(Math.PI * k) * 1.6, z: -s, ar: Math.sin(Math.PI * k), i, k };
};

const Camera: React.FC<{ f: number }> = ({ f }) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    // câmera suave: segue a média de alguns frames para não sacudir
    let x = 0, y = 0;
    for (let d = 0; d < 8; d++) {
      const c = corredor(f - d * 2);
      x += c.x; y += c.y;
    }
    x /= 8; y /= 8;
    const c = corredor(f);
    camera.position.set(x * 0.8, y + 2.5, c.z + 4.4);
    camera.lookAt(x * 0.95, y + 1.0, c.z - 4);
    camera.updateMatrixWorld();
  });
  return null;
};

const Plataforma: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const t = trecho(i);
  const c = corredor(f);
  const pegou = c.i > i || (c.i === i && c.k > 0.45);
  const zMoeda = t.z - PLAT * 0.45;
  return (
    <group position={[t.x, t.y, 0]}>
      {/* bloco da plataforma (topo claro + lateral) */}
      <mesh position={[0, -0.5, t.z - PLAT / 2]}>
        <boxGeometry args={[t.largura, 1, PLAT]} />
        <meshStandardMaterial color={t.cor} flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.005, t.z - PLAT / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[t.largura * 0.92, PLAT * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.22} />
      </mesh>
      {/* pilar até lá embaixo */}
      <mesh position={[0, -4, t.z - PLAT / 2]}>
        <cylinderGeometry args={[0.35, 0.55, 6, 6]} />
        <meshStandardMaterial color={t.cor} flatShading roughness={0.8} />
      </mesh>
      {t.moeda && (
        <mesh position={[0, 0.9 + Math.sin((f + i * 9) / 6) * 0.12, zMoeda]} rotation={[0, f / 7, 0]} scale={pegou ? 0.001 : 1}>
          <cylinderGeometry args={[0.32, 0.32, 0.08, 10]} />
          <meshStandardMaterial color="#FFD43B" emissive="#B8860B" emissiveIntensity={0.6} metalness={0.6} roughness={0.3} flatShading />
        </mesh>
      )}
      {t.caixa && (
        <mesh position={[t.largura * 0.28, 0.35, t.z - PLAT * 0.8]} rotation={[0, i, 0]}>
          <boxGeometry args={[0.6, 0.7, 0.6]} />
          <meshStandardMaterial color="#8B5A2B" flatShading />
        </mesh>
      )}
    </group>
  );
};

const Nuvens: React.FC<{ zBase: number }> = ({ zBase }) => {
  const itens = useMemo(() => Array.from({ length: 14 }, (_, k) => k), []);
  return (
    <>
      {itens.map((k) => {
        const z = zBase - ((k * 9 + 400) % 120);
        return (
          <mesh key={k} position={[(random(`nx${k}`) - 0.5) * 34, 6 + random(`ny${k}`) * 6, z]} scale={[2.4 + random(`ns${k}`) * 2, 1, 1.4]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#FFFFFF" flatShading roughness={1} />
          </mesh>
        );
      })}
    </>
  );
};

/** Ilhas e montanhas ao longe (paralaxe). */
const Fundo: React.FC<{ z: number }> = ({ z }) => (
  <>
    {Array.from({ length: 10 }, (_, k) => {
      const lado = k % 2 ? 1 : -1;
      const zz = Math.floor(z / 30) * 30 - k * 14;
      return (
        <mesh key={k} position={[lado * (16 + random(`mx${k}`) * 10), -6 + random(`my${k}`) * 3, zz - 20]}>
          <coneGeometry args={[4 + random(`mr${k}`) * 4, 10 + random(`mh${k}`) * 8, 5]} />
          <meshStandardMaterial color={k % 3 ? "#5B8DEF" : "#7AA8FF"} flatShading roughness={1} />
        </mesh>
      );
    })}
  </>
);

export const Corrida: React.FC<{ frame: number; width: number; height: number }> = ({ frame, width, height }) => {
  const c = corredor(frame);
  const visiveis = Array.from({ length: 16 }, (_, k) => c.i - 2 + k).filter((i) => i >= 0);
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 3, 6], fov: 50 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <color attach="background" args={["#8EC9FF"]} />
      <fog attach="fog" args={["#BFE3FF", 18, 60]} />
      <hemisphereLight args={["#FFFFFF", "#5B7BB5", 1.1]} />
      <directionalLight position={[5, 10, 4]} intensity={2.2} color="#FFF3D6" />
      <Camera f={frame} />
      <Fundo z={c.z} />
      <Nuvens zBase={Math.floor(c.z / 9) * 9} />
      {visiveis.map((i) => (
        <Plataforma key={i} i={i} f={frame} />
      ))}
      <group position={[c.x, c.y, c.z]} rotation={[c.ar * -0.25, Math.PI, 0]}>
        <PessoaLowPoly cor="#F43F5E" calca="#1E3A8A" pele="#E0B48F" cabelo="#1B1B2F" estilo="curto" andar={c.ar > 0.05 ? 0 : 1.8}
          bracos={c.ar > 0.3 ? "cima" : "baixo"} balanco={0} escala={0.9} />
      </group>
    </ThreeCanvas>
  );
};
