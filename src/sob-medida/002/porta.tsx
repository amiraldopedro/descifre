/**
 * Prova 3 — Cegueira para mudanças (Simons e Levin, 1998), em 3D.
 * Fala: "Um pesquisador para alguém na rua e pede uma informação. | No meio da conversa, dois homens passam
 *        carregando uma porta entre os dois. | E, escondido atrás dela, o pesquisador é trocado por outra pessoa, com outra roupa."
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TEXTO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly, TerrenoLowPoly } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Rotulo, Selo, useMolaEm } from "../comum";

const P_PORTA_IN = 0.3;
const P_PORTA_OUT = 0.86;
const P_TROCA = (P_PORTA_IN + P_PORTA_OUT) / 2; // quando a porta passa pelo meio

export const sons: SomCena[] = [
  { som: "pop", p: 0.06 },
  { som: "passos", p: 0.3 },
  { som: "passos", p: 0.5 },
  { som: "glitch", p: 0.58 },
  { som: "ding", p: 0.88 },
];

const Porta: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const zPorta = entre(p, P_PORTA_IN, P_PORTA_OUT, -7, 7);
  const trocado = p >= P_TROCA;
  const balao = mola(fala * 0.06) * (1 - entre(p, 0.26, 0.3));
  const selo = mola(fala * 0.88);
  const fala2 = trocado ? Math.sin(f / 3) * 0.04 : 0;

  return (
    <AbsoluteFill>
      <Palco3D camera={[4, 2.6, 8]}>
        <CameraFixa posicao={[3.6 + Math.sin(f * 0.005) * 0.6, 2.4, 7.4]} alvo={[0, -0.8, 0]} />
        <TerrenoLowPoly y={-2} altura={0.15} cor={COR.azul} />
        {/* calçada */}
        <mesh position={[0, -1.95, 0]}>
          <boxGeometry args={[8, 0.1, 3]} />
          <meshStandardMaterial color="#2A3E86" flatShading />
        </mesh>
        {/* quem é abordado (olha para +x) */}
        <PessoaLowPoly posicao={[-1.3, -1.9, 0]} cor={COR.azulClaro} olhando={Math.PI / 2} seed={1} />
        {/* pesquisador: vermelho antes, amarelo e mais alto depois */}
        <group rotation={[0, 0, fala2]}>
          <PessoaLowPoly
            posicao={[1.3, -1.9, 0]}
            cor={trocado ? COR.amarelo : COR.vermelho}
            escala={trocado ? 1.12 : 1}
            olhando={-Math.PI / 2}
            seed={trocado ? 9 : 2}
          />
        </group>
        {/* a porta e os dois carregadores, passando ENTRE os dois */}
        <group position={[0, -1.9, zPorta]}>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.14, 2.5, 1.7]} />
            <meshStandardMaterial color="#C98B4E" flatShading />
          </mesh>
          <mesh position={[0.09, 1.2, 0.55]}>
            <sphereGeometry args={[0.07, 6, 4]} />
            <meshStandardMaterial color={COR.amarelo} metalness={0.7} roughness={0.3} />
          </mesh>
          <PessoaLowPoly posicao={[0, 0, 1.15]} cor="#3B4466" olhando={0} seed={4} balanco={2} />
          <PessoaLowPoly posicao={[0, 0, -1.15]} cor="#3B4466" olhando={0} seed={5} balanco={2} />
        </group>
      </Palco3D>
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <Rotulo texto="PROVA 3 DE 7" />
      </div>
      {balao > 0.01 && (
        <div
          style={{
            position: "absolute", left: 1060, top: 250, transform: `scale(${balao})`, transformOrigin: "bottom left",
            background: COR.branco, color: COR.azulEscuro, fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 40,
            padding: "18px 30px", borderRadius: "28px 28px 28px 6px",
          }}
        >
          Onde fica a estação?
        </div>
      )}
      <div style={{ position: "absolute", top: 230, width: "100%", display: "flex", justifyContent: "center" }}>
        {selo > 0.01 && <Selo texto="OUTRA PESSOA!" k={selo} cor={COR.vermelho} rot={4} />}
      </div>
    </AbsoluteFill>
  );
};

export default Porta;
