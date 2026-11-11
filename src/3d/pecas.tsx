/**
 * Peças 3D low poly reutilizáveis (além das do kit): bebê, rato, macaco, caminhão, cabana, jaula,
 * mesa, cadeira, porta, painel e balão de fala. Todas determinísticas (só o frame do Remotion).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { COR } from "../tema";

const M: React.FC<{ c: string; r?: number; e?: string; ei?: number }> = ({ c, r = 0.75, e, ei = 0 }) => (
  <meshStandardMaterial color={c} flatShading roughness={r} emissive={e ?? "#000000"} emissiveIntensity={ei} />
);

/** Bebê sentado (frente = +z). chora: 0..1 (treme e solta lágrimas); braco: 0..1 estica o braço direito. */
export const Bebe: React.FC<{ posicao?: [number, number, number]; escala?: number; chora?: number; braco?: number; olhando?: number }> = ({ posicao = [0, 0, 0], escala = 1, chora = 0, braco = 0, olhando = 0 }) => {
  const f = useCurrentFrame();
  const treme = chora > 0 ? Math.sin(f * 1.7) * 0.05 * chora : 0;
  const pele = "#F3D2B6";
  return (
    <group position={[posicao[0] + treme, posicao[1], posicao[2]]} scale={escala} rotation={[0, olhando, 0]}>
      <mesh position={[0, 0.35, 0]} scale={[1, 0.9, 0.9]}>
        <icosahedronGeometry args={[0.38, 1]} />
        <M c="#FFFFFF" />
      </mesh>
      {/* pernas para a frente */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.12, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.09, 0.4, 6]} />
          <M c="#FFFFFF" />
        </mesh>
      ))}
      {/* braços */}
      <mesh position={[-0.36, 0.42, 0.05]} rotation={[0.3, 0, 0.4]}>
        <cylinderGeometry args={[0.07, 0.06, 0.38, 6]} />
        <M c={pele} />
      </mesh>
      <group position={[0.36, 0.52, 0]} rotation={[-1.4 * braco, 0, -0.4 + braco * 0.3]}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.38, 6]} />
          <M c={pele} />
        </mesh>
      </group>
      {/* cabeça grande */}
      <mesh position={[0, 0.95, 0]}>
        <icosahedronGeometry args={[0.36, 1]} />
        <M c={pele} />
      </mesh>
      <mesh position={[0, 1.18, -0.05]} scale={[1, 0.5, 1]}>
        <icosahedronGeometry args={[0.28, 1]} />
        <M c="#C9A15B" />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.98, 0.32]} scale={[1, chora > 0.3 ? 0.35 : 1, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color={COR.azulEscuro} />
        </mesh>
      ))}
      {/* boca: aberta quando chora */}
      <mesh position={[0, 0.8, 0.33]} scale={[1, 0.4 + chora * 1.2, 0.5]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color="#7A1F2B" />
      </mesh>
      {chora > 0.3 &&
        [-0.13, 0.13].map((x, i) => {
          const y = 0.92 - ((f * 0.03 + i * 0.4) % 0.5);
          return (
            <mesh key={x} position={[x, y, 0.34]}>
              <sphereGeometry args={[0.035, 6, 4]} />
              <meshStandardMaterial color={COR.ciano} emissive={COR.ciano} emissiveIntensity={0.5} />
            </mesh>
          );
        })}
    </group>
  );
};

/** Rato branco. Frente = +x. andar: 0..1 mexe as patas. */
export const Rato: React.FC<{ posicao?: [number, number, number]; escala?: number; olhando?: number; andar?: number; cor?: string }> = ({ posicao = [0, 0, 0], escala = 1, olhando = 0, andar = 0, cor = "#F4F4F8" }) => {
  const f = useCurrentFrame();
  const q = Math.abs(Math.sin(f / 2.5)) * 0.03 * andar;
  return (
    <group position={[posicao[0], posicao[1] + q, posicao[2]]} scale={escala} rotation={[0, olhando, 0]}>
      <mesh position={[0, 0.16, 0]} scale={[1.5, 0.85, 0.9]}>
        <icosahedronGeometry args={[0.17, 1]} />
        <M c={cor} />
      </mesh>
      <mesh position={[0.26, 0.19, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.22, 6]} />
        <M c={cor} />
      </mesh>
      {[-0.07, 0.07].map((z) => (
        <mesh key={z} position={[0.2, 0.3, z]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <M c="#F7B7C4" />
        </mesh>
      ))}
      <mesh position={[0.37, 0.19, 0]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <M c="#F28AA0" />
      </mesh>
      {[-0.05, 0.05].map((z) => (
        <mesh key={`o${z}`} position={[0.28, 0.24, z]}>
          <sphereGeometry args={[0.018, 6, 4]} />
          <meshBasicMaterial color="#1A1A2A" />
        </mesh>
      ))}
      <mesh position={[-0.42, 0.1, 0]} rotation={[0, 0, Math.PI / 2 - 0.3 + Math.sin(f / 6) * 0.2]}>
        <cylinderGeometry args={[0.012, 0.02, 0.42, 4]} />
        <M c="#F28AA0" />
      </mesh>
    </group>
  );
};

/** Filhote de macaco. Frente = +z. agarrado: encolhe e abraça. */
export const Macaco: React.FC<{ posicao?: [number, number, number]; escala?: number; olhando?: number; agarrado?: number; andar?: number }> = ({ posicao = [0, 0, 0], escala = 1, olhando = 0, agarrado = 0, andar = 0 }) => {
  const f = useCurrentFrame();
  const pelo = "#8A5A3C", rosto = "#E8B998";
  const q = Math.abs(Math.sin(f / 3)) * 0.05 * andar;
  return (
    <group position={[posicao[0], posicao[1] + q, posicao[2]]} scale={escala} rotation={[0, olhando, 0]}>
      <mesh position={[0, 0.32, 0]} scale={[0.9, 1, 0.85]}>
        <icosahedronGeometry args={[0.26, 1]} />
        <M c={pelo} r={0.95} />
      </mesh>
      <mesh position={[0, 0.72, 0.02]}>
        <icosahedronGeometry args={[0.22, 1]} />
        <M c={pelo} r={0.95} />
      </mesh>
      <mesh position={[0, 0.69, 0.17]} scale={[1, 0.85, 0.5]}>
        <icosahedronGeometry args={[0.14, 1]} />
        <M c={rosto} />
      </mesh>
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.76, 0]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <M c={rosto} />
        </mesh>
      ))}
      {[-0.06, 0.06].map((x) => (
        <mesh key={`o${x}`} position={[x, 0.74, 0.23]}>
          <sphereGeometry args={[0.032, 6, 4]} />
          <meshBasicMaterial color="#1A1A2A" />
        </mesh>
      ))}
      {/* braços longos: abertos (0) ou abraçando para a frente (1) */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.24, 0.42, 0.08 * agarrado]} rotation={[-1.2 * agarrado, 0, l * (0.5 - agarrado * 0.4)]}>
          <cylinderGeometry args={[0.05, 0.045, 0.45, 6]} />
          <M c={pelo} r={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.3]} rotation={[0.8, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.02, 0.5, 4]} />
        <M c={pelo} />
      </mesh>
    </group>
  );
};

/** Caminhão antigo. Frente = +x. */
export const Caminhao: React.FC<{ posicao?: [number, number, number]; escala?: number; cor?: string; rodas?: number }> = ({ posicao = [0, 0, 0], escala = 1, cor = "#C94A3A", rodas = 0 }) => (
  <group position={posicao} scale={escala}>
    <mesh position={[-0.4, 0.75, 0]}>
      <boxGeometry args={[2.2, 0.9, 1.2]} />
      <M c="#6B4A2E" />
    </mesh>
    <mesh position={[1.05, 0.8, 0]}>
      <boxGeometry args={[0.8, 1, 1.15]} />
      <M c={cor} />
    </mesh>
    <mesh position={[1.36, 0.95, 0]}>
      <boxGeometry args={[0.2, 0.4, 0.95]} />
      <meshStandardMaterial color="#9CC8FF" roughness={0.2} metalness={0.3} />
    </mesh>
    {[[-1.1, 0.6], [-1.1, -0.6], [1.0, 0.6], [1.0, -0.6]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, rodas]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 10]} />
        <M c="#1A1A2A" />
      </mesh>
    ))}
  </group>
);

/** Cabana de madeira. */
export const Cabana: React.FC<{ posicao?: [number, number, number]; escala?: number; luz?: boolean }> = ({ posicao = [0, 0, 0], escala = 1, luz = true }) => (
  <group position={posicao} scale={escala}>
    <mesh position={[0, 0.7, 0]}>
      <boxGeometry args={[2, 1.4, 1.6]} />
      <M c="#7A5232" />
    </mesh>
    <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[1.65, 0.9, 4]} />
      <M c="#4A2F1E" />
    </mesh>
    <mesh position={[0, 0.5, 0.81]}>
      <boxGeometry args={[0.45, 1, 0.04]} />
      <M c="#3A2416" />
    </mesh>
    <mesh position={[0.6, 0.85, 0.81]}>
      <boxGeometry args={[0.36, 0.32, 0.04]} />
      <meshStandardMaterial color={luz ? "#FFD27A" : "#22305E"} emissive={luz ? "#FFB45E" : "#000"} emissiveIntensity={luz ? 0.8 : 0} />
    </mesh>
  </group>
);

/** Jaula (só as grades). */
export const Jaula: React.FC<{ largura?: number; altura?: number; fundo?: number; posicao?: [number, number, number] }> = ({ largura = 4, altura = 2.4, fundo = 2.4, posicao = [0, 0, 0] }) => {
  const barras: [number, number][] = [];
  for (let x = -largura / 2; x <= largura / 2 + 0.01; x += 0.32) barras.push([x, -fundo / 2]);
  for (let z = -fundo / 2; z <= fundo / 2 + 0.01; z += 0.32) { barras.push([-largura / 2, z]); barras.push([largura / 2, z]); }
  return (
    <group position={posicao}>
      {barras.map(([x, z], i) => (
        <mesh key={i} position={[x, altura / 2, z]}>
          <cylinderGeometry args={[0.025, 0.025, altura, 5]} />
          <meshStandardMaterial color="#8E99C2" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, altura, 0]}>
        <boxGeometry args={[largura + 0.1, 0.06, fundo + 0.1]} />
        <meshStandardMaterial color="#5A6390" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
};

/** Mesa simples. */
export const Mesa: React.FC<{ posicao?: [number, number, number]; largura?: number; cor?: string }> = ({ posicao = [0, 0, 0], largura = 2, cor = "#6B4A2E" }) => (
  <group position={posicao}>
    <mesh position={[0, 0.78, 0]}>
      <boxGeometry args={[largura, 0.08, 0.9]} />
      <M c={cor} />
    </mesh>
    {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
      <mesh key={i} position={[a * (largura / 2 - 0.08), 0.38, b * 0.36]}>
        <boxGeometry args={[0.07, 0.76, 0.07]} />
        <M c="#3A2416" />
      </mesh>
    ))}
  </group>
);

/** Cadeira. Frente = +z (o encosto fica atrás). */
export const Cadeira: React.FC<{ posicao?: [number, number, number]; olhando?: number; cor?: string }> = ({ posicao = [0, 0, 0], olhando = 0, cor = "#5A3A24" }) => (
  <group position={posicao} rotation={[0, olhando, 0]}>
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[0.6, 0.07, 0.6]} />
      <M c={cor} />
    </mesh>
    <mesh position={[0, 0.85, -0.27]}>
      <boxGeometry args={[0.6, 0.65, 0.06]} />
      <M c={cor} />
    </mesh>
    {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
      <mesh key={i} position={[a * 0.26, 0.25, b * 0.26]}>
        <boxGeometry args={[0.05, 0.5, 0.05]} />
        <M c="#2A1A10" />
      </mesh>
    ))}
  </group>
);

/** Parede com porta (fundo da cena). */
export const Parede: React.FC<{ posicao?: [number, number, number]; largura?: number; altura?: number; cor?: string; porta?: number; rotacao?: number }> = ({ posicao = [0, 0, 0], largura = 6, altura = 3, cor = "#2A3570", porta, rotacao = 0 }) => (
  <group position={posicao} rotation={[0, rotacao, 0]}>
    <mesh position={[0, altura / 2, 0]}>
      <boxGeometry args={[largura, altura, 0.15]} />
      <M c={cor} r={0.9} />
    </mesh>
    {porta !== undefined && (
      <>
        <mesh position={[porta, 1.05, 0.09]}>
          <boxGeometry args={[0.95, 2.1, 0.05]} />
          <M c="#4A2F1E" />
        </mesh>
        <mesh position={[porta + 0.33, 1.05, 0.13]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color={COR.amarelo} metalness={0.7} roughness={0.3} />
        </mesh>
      </>
    )}
  </group>
);
