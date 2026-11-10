/**
 * Gancho do 003 — a cadeira empurrada, em 3D.
 * Fala: "Duas pessoas terminam o café e levantam da mesa. (0–.45) | Uma empurra a cadeira de volta. (.45–.72)
 *        | A outra só vai embora. (.72–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly, TerrenoLowPoly } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "sobe", p: 0.22 },
  { som: "mecanico", p: 0.5 },
  { som: "click", p: 0.66 },
  { som: "passos", p: 0.74 },
  { som: "ding", p: 0.9 },
];

const CHAO = -1.9;

const Cadeira: React.FC<{ x: number; lado: 1 | -1; giro?: number; brilho?: string }> = ({ x, lado, giro = 0, brilho }) => (
  <group position={[x, CHAO, 0]} rotation={[0, giro, 0]}>
    <mesh position={[0, 0.75, 0]}>
      <boxGeometry args={[0.8, 0.1, 0.8]} />
      <meshStandardMaterial color="#C98B4E" flatShading />
    </mesh>
    {/* encosto do lado de fora da mesa */}
    <mesh position={[0.36 * lado, 1.2, 0]}>
      <boxGeometry args={[0.08, 0.9, 0.8]} />
      <meshStandardMaterial color="#A86F3A" flatShading />
    </mesh>
    {[[-0.33, -0.33], [-0.33, 0.33], [0.33, -0.33], [0.33, 0.33]].map(([a, b], i) => (
      <mesh key={i} position={[a, 0.37, b]}>
        <boxGeometry args={[0.07, 0.75, 0.07]} />
        <meshStandardMaterial color="#7A4F2A" flatShading />
      </mesh>
    ))}
    {brilho && (
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.75, 24]} />
        <meshBasicMaterial color={brilho} />
      </mesh>
    )}
  </group>
);

const Cafe: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);

  const levanta = entre(p, 0.2, 0.36); // os dois levantam
  const recua = entre(p, 0.3, 0.42); // dão um passo para trás
  const empurra = entre(p, 0.48, 0.66); // A empurra a cadeira
  const sai = entre(p, 0.74, 1.02); // B vai embora
  const marca = entre(p, 0.86, 0.95);

  // A (esquerda, amarelo): senta em x -1.35, fica em pé atrás da cadeira, empurra
  const cadA = -1.95 + empurra * 0.65;
  const pesA = -1.45 - recua * 1.0 + empurra * 0.55;
  // B (direita, ciano claro): levanta, vira e sai
  const cadB = 1.95;
  const virarB = entre(p, 0.72, 0.8);
  const pesB = 1.45 + recua * 1.0 + sai * 7;

  const y = (k: number) => CHAO - 0.5 * (1 - k);
  const tagA = mola(fala * 0.88);
  const tagB = mola(fala * 0.92);

  return (
    <AbsoluteFill>
      <Palco3D camera={[0, 1.5, 6.6]} alvo={[0, -1.6, 0]}>
        <CameraFixa posicao={[Math.sin(f * 0.004) * 0.6, 1.5, 6.6 - p * 0.5]} alvo={[0, -1.6, 0]} />
        <TerrenoLowPoly y={-2} altura={0.12} cor={COR.azul} />
        <mesh position={[0, CHAO - 0.05, 0]}>
          <boxGeometry args={[9, 0.1, 4]} />
          <meshStandardMaterial color="#22357E" flatShading />
        </mesh>
        {/* mesa */}
        <mesh position={[0, CHAO + 0.95, 0]}>
          <cylinderGeometry args={[1.05, 1.05, 0.1, 10]} />
          <meshStandardMaterial color={COR.branco} flatShading />
        </mesh>
        <mesh position={[0, CHAO + 0.47, 0]}>
          <cylinderGeometry args={[0.1, 0.18, 0.95, 6]} />
          <meshStandardMaterial color="#3B4466" flatShading />
        </mesh>
        {/* xícaras */}
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, CHAO + 1.08, 0.15]}>
            <cylinderGeometry args={[0.13, 0.1, 0.18, 8]} />
            <meshStandardMaterial color={COR.vermelho} flatShading />
          </mesh>
        ))}
        <Cadeira x={cadA} lado={-1} brilho={marca > 0 ? COR.ciano : undefined} />
        <Cadeira x={cadB} lado={1} giro={-0.35 * entre(p, 0.3, 0.42)} brilho={marca > 0 ? COR.vermelho : undefined} />
        <PessoaLowPoly posicao={[pesA, y(levanta), 0]} cor={COR.amarelo} olhando={Math.PI / 2} seed={1} />
        <PessoaLowPoly posicao={[pesB, y(levanta), 0]} cor={COR.azulClaro} olhando={-Math.PI / 2 + virarB * Math.PI} seed={2} balanco={1 + sai * 3} />
      </Palco3D>
      <div style={{ position: "absolute", top: 120, left: 0, width: "100%", display: "flex", justifyContent: "space-between", padding: "0 360px" }}>
        <div style={{ transform: `scale(${tagA})`, opacity: Math.min(1, tagA * 2), fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 46, color: COR.azulEscuro, background: COR.ciano, padding: "10px 26px", borderRadius: 16 }}>
          EMPURROU
        </div>
        <div style={{ transform: `scale(${tagB})`, opacity: Math.min(1, tagB * 2), fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 46, color: COR.branco, background: COR.vermelho, padding: "10px 26px", borderRadius: 16 }}>
          DEIXOU
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Cafe;
