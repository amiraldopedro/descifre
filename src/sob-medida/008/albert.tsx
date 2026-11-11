/**
 * 008 — O pequeno Albert (Watson e Rayner, 1920), em 3D.
 * Fala: "Então começou o experimento. (0–.12) | Sempre que Albert esticava a mão para o rato, (.12–.33) | Watson batia
 *        com um martelo numa barra de aço, bem atrás da cabeça dele. (.33–.58) | O barulho era assustador. (.58–.68)
 *        | Depois de algumas repetições, bastava o rato aparecer para o bebê chorar. (.68–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import { Bebe, Parede, Rato } from "../../3d/pecas";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "passos", p: 0.08, vol: 0.4 },
  { som: "boom", p: 0.45 },
  { som: "boom", p: 0.6 },
  { som: "desce", p: 0.72 },
  { som: "glitch", p: 0.84 },
];

const Albert: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const batidas = [0.45, 0.6];
  const golpe = Math.max(...batidas.map((b) => Math.max(0, 1 - Math.abs(p - b) / 0.03)));
  const ergue = Math.max(...batidas.map((b) => entre(p, b - 0.06, b - 0.01) * (1 - entre(p, b, b + 0.04))));
  const susto = Math.max(...batidas.map((b) => entre(p, b, b + 0.02) * (1 - entre(p, b + 0.07, b + 0.1))));
  // rato entra (0–.15), sai (.62–.68), volta sozinho (.72)
  const ratoX = p < 0.66 ? 2.6 - entre(p, 0.03, 0.16) * 1.7 : 2.6 - entre(p, 0.72, 0.8) * 1.7;
  const braco = entre(p, 0.15, 0.3) * (1 - entre(p, 0.45, 0.47));
  const chora = Math.max(susto, entre(p, 0.8, 0.84));
  const tremor = golpe * 0.06;
  const cam: [number, number, number] = [1.2 + Math.sin(f * 0.01) * 0.3 + tremor, 2.0, 5.6 - p * 0.6];
  const alvo: [number, number, number] = [0.2, 0.6, 0];
  const kSelo = mola(fala * 0.84);
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo} clima="dourado">
        <CameraFixa posicao={cam} alvo={alvo} />
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial color="#3A3050" roughness={0.95} />
        </mesh>
        {/* colchonete */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[2.6, 0.08, 1.8]} />
          <meshStandardMaterial color="#C9C1B0" flatShading />
        </mesh>
        <Parede posicao={[0, 0, -2.2]} largura={10} altura={3.4} cor="#3B3A68" porta={3} />
        <Bebe posicao={[-0.3, 0.08, 0]} escala={0.9} chora={chora} braco={braco} olhando={0.5} />
        <Rato posicao={[ratoX, 0.08, 0.35]} escala={1.1} olhando={Math.PI} andar={p < 0.2 || (p > 0.72 && p < 0.8) ? 1 : 0} />
        {/* Watson atrás do bebê, com martelo e barra de aço */}
        <group position={[-1.6, 0, -1.1]} rotation={[0, 0.5, 0]}>
          <PessoaLowPoly cor="#E6E6EE" calca="#2A2F4F" cabelo="#3B2A20" estilo="curto" seed={4} bracos="frente" />
          <mesh position={[0.45, 1.35, 0.55]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
            <meshStandardMaterial color="#C5CBE0" metalness={0.8} roughness={0.25} />
          </mesh>
          <group position={[-0.1, 1.4, 0.6]} rotation={[0, 0, -1.2 * ergue + 0.2]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 5]} />
              <meshStandardMaterial color="#6B4A2E" />
            </mesh>
            <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.1, 0.2, 0.1]} />
              <meshStandardMaterial color="#555B70" metalness={0.7} />
            </mesh>
          </group>
        </group>
        {golpe > 0 && (
          <mesh position={[-1.25, 1.4, -0.5]} scale={0.3 + golpe * 1.4}>
            <ringGeometry args={[0.8, 1, 24]} />
            <meshBasicMaterial color={COR.amarelo} transparent opacity={golpe * 0.8} />
          </mesh>
        )}
      </Palco3D>
      {golpe > 0.05 && (
        <div style={{ position: "absolute", left: 420, top: 220, transform: `scale(${0.6 + golpe * 0.6}) rotate(-8deg)`, opacity: golpe, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 120, color: COR.amarelo, textShadow: "0 8px 30px rgba(0,0,0,.6)" }}>
          BANG!
        </div>
      )}
      <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", justifyContent: "center" }}>
        {kSelo > 0.01 && <Selo texto="SÓ O RATO = CHORO" k={kSelo} cor={COR.vermelho} rot={-3} />}
      </div>
    </AbsoluteFill>
  );
};

export default Albert;
