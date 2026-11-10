/**
 * Cena sob medida 3D — "O experimento do elevador".
 * Quatro pessoas estão de costas para a porta. Alguém entra (vermelho), estranha,
 * e acaba se virando também. Conta a história do efeito manada.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COR } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";

// momentos em proporção da fala (0..1): a animação acompanha a narração.
// Fala: "...uma pessoa entra num elevador. E todo mundo lá dentro está virado para o fundo.
//        Ela estranha. Olha pros lados. E, em poucos segundos, se vira também."
const P_PORTA = 0.05;
const P_ENTRA = 0.15;
const P_OLHA = 0.55;
const P_VIRA = 0.84;

export const sons: SomCena[] = [
  { som: "porta", p: 0.05 },
  { som: "passos", p: 0.15 },
  { som: "tique", p: 0.55 },
  { som: "whoosh", p: 0.84 },
  { som: "ding", p: 0.95 },
];

const Elevador: React.FC<PropsSobMedida> = ({ vertical, fala }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = (p: number) => p * fala; // proporção da fala -> frame
  const porta = entre(f, q(P_PORTA), q(P_PORTA) + 0.7 * fps);
  const entra = entre(f, q(P_ENTRA), q(P_ENTRA) + 1.2 * fps);
  const olha = Math.sin(entre(f, q(P_OLHA), q(P_OLHA) + 1.4 * fps) * Math.PI) * 0.9; // olha pros lados
  const vira = entre(f, q(P_VIRA), q(P_VIRA) + 0.8 * fps);
  const luz = 0.6 + Math.sin(f / 9) * 0.05;

  return (
    <Palco3D camera={[0, 1.2, 9]} fov={vertical ? 62 : 42}>
      <CameraFixa posicao={[1.2 + Math.sin(f * 0.006) * 0.6, 1.6, vertical ? 9 : 6.8]} alvo={[0, -0.6, 0]} />
      {/* cabine */}
      <mesh position={[0, 0.5, -2]}>
        <boxGeometry args={[6, 5, 0.2]} />
        <meshStandardMaterial color={COR.azul} flatShading />
      </mesh>
      {[-3, 3].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.2, 5, 4]} />
          <meshStandardMaterial color={COR.azul} flatShading />
        </mesh>
      ))}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[6, 0.2, 4]} />
        <meshStandardMaterial color={COR.azulEscuro} flatShading />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[6, 0.2, 4]} />
        <meshStandardMaterial color={COR.azul} emissive={COR.ciano} emissiveIntensity={luz * 0.4} flatShading />
      </mesh>
      {/* portas deslizando */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * (0.75 + porta * 1.5), 0.5, 2]}>
          <boxGeometry args={[1.5, 5, 0.1]} />
          <meshStandardMaterial color="#9FB0D6" metalness={0.6} roughness={0.3} flatShading transparent opacity={1 - porta * 0.85} />
        </mesh>
      ))}
      {/* as quatro pessoas de costas (olhando para o fundo) */}
      {[-2.2, -1.1, 1.1, 2.2].map((x, i) => (
        <PessoaLowPoly key={i} posicao={[x, -1.9, -0.6 + (i % 2) * 0.3]} olhando={Math.PI} seed={i} balanco={0.4} />
      ))}
      {/* quem entra */}
      <PessoaLowPoly
        posicao={[0, -1.9, 3.4 - entra * 2.6]}
        cor={COR.vermelho}
        escala={1.05}
        olhando={olha + vira * Math.PI}
        balanco={entra < 1 ? 2 : 0.5}
      />
    </Palco3D>
  );
};

export default Elevador;
