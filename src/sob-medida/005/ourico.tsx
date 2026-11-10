/**
 * 005 — Razão 4: o ouriço de castanha (espinhos por fora, macio por dentro), em 3D.
 * Fala: "Quase sempre, a palavra dura está cobrindo outro sentimento: cansaço, preocupação, medo, solidão. (0–.55)
 *        | Igual a um ouriço de castanha: espinhos por fora, e algo macio por dentro. (.55–1)"
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, entre, Palco3D, useGeoDeformada } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "pop", p: 0.3 }, { som: "pop", p: 0.38 }, { som: "pop", p: 0.45 }, { som: "pop", p: 0.52 },
  { som: "mecanico", p: 0.72 },
  { som: "brilho", p: 0.84 },
];

const PALAVRAS: { t: string; p: number; x: number; y: number }[] = [
  { t: "CANSAÇO", p: 0.3, x: 330, y: 260 },
  { t: "PREOCUPAÇÃO", p: 0.38, x: 1260, y: 230 },
  { t: "MEDO", p: 0.45, x: 400, y: 620 },
  { t: "SOLIDÃO", p: 0.52, x: 1300, y: 600 },
];

const Espinhos: React.FC<{ metade: 1 | -1; tam: number }> = ({ metade, tam }) => {
  const lista = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const pos = g.attributes.position;
    const vistos = new Set<string>();
    const out: { p: THREE.Vector3; q: THREE.Quaternion }[] = [];
    const cima = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i).normalize();
      const chave = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      if ((v.y >= 0 ? 1 : -1) !== metade) continue;
      out.push({ p: v.clone(), q: new THREE.Quaternion().setFromUnitVectors(cima, v) });
    }
    return out;
  }, [metade]);
  return (
    <>
      {lista.map(({ p, q }, i) => (
        <mesh key={i} position={p.clone().multiplyScalar(1.15 + 0.35 * tam)} quaternion={q} scale={[1, Math.max(0.01, tam), 1]}>
          <coneGeometry args={[0.12, 0.75, 4]} />
          <meshStandardMaterial color={COR.ciano} flatShading />
        </mesh>
      ))}
    </>
  );
};

const Metade: React.FC<{ metade: 1 | -1; abre: number; tam: number }> = ({ metade, abre, tam }) => (
  <group position={[metade * abre * 0.5, metade * abre * 0.75, 0]} rotation={[0, 0, metade * abre * 0.35]}>
    <mesh>
      <sphereGeometry args={[1.2, 9, 5, 0, Math.PI * 2, metade === 1 ? 0 : Math.PI / 2, Math.PI / 2]} />
      <meshStandardMaterial color={COR.azulClaro} flatShading side={THREE.DoubleSide} />
    </mesh>
    <Espinhos metade={metade} tam={tam} />
  </group>
);

const Ourico: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const entra = mola(fala * 0.02);
  const abre = entre(p, 0.7, 0.84);
  const tam = 1 - entre(p, 0.7, 0.8) * 0.4;
  const miolo = entre(p, 0.72, 0.88);
  const geoMiolo = useGeoDeformada(0.85, 1, 0.12, 5);
  const pulsa = 1 + Math.sin(f / 5) * 0.04 * miolo;
  return (
    <AbsoluteFill>
      <Palco3D camera={[0, 0.4, 8.6]} alvo={[0, 0.2, 0]}>
        <CameraFixa posicao={[Math.sin(f * 0.01) * 0.8, 0.4, 8.6]} alvo={[0, 0.2, 0]} />
        <group position={[0, 0.25, 0]} scale={entra} rotation={[0.2, f * 0.02, 0]}>
          <Metade metade={1} abre={abre} tam={tam} />
          <Metade metade={-1} abre={abre} tam={tam} />
          <mesh geometry={geoMiolo} scale={miolo * pulsa}>
            <meshStandardMaterial color={COR.vermelho} flatShading emissive={COR.vermelho} emissiveIntensity={0.45 * miolo} />
          </mesh>
          <pointLight intensity={25 * miolo} color={COR.amarelo} distance={6} />
        </group>
      </Palco3D>
      {PALAVRAS.map((w) => {
        const k = mola(fala * w.p);
        const some = 1 - entre(p, 0.66, 0.72);
        return (
          <div
            key={w.t}
            style={{
              position: "absolute", left: w.x, top: w.y + Math.sin(f / 10 + w.x) * 8, transform: `scale(${k})`, opacity: Math.min(1, k * 2) * some,
              fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52, color: COR.amarelo, textShadow: "0 6px 24px rgba(0,0,0,.6)",
            }}
          >
            {w.t}
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 48, color: COR.branco, opacity: entre(p, 0.58, 0.64) * (1 - entre(p, 0.86, 0.9)) }}>
        ESPINHOS POR FORA...
      </div>
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 48, color: COR.vermelho, opacity: entre(p, 0.88, 0.93) }}>
        ...MACIO POR DENTRO
      </div>
    </AbsoluteFill>
  );
};

export default Ourico;
