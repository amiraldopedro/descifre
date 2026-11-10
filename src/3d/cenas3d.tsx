/**
 * Cenas 3D PADRÃO (reutilizáveis em qualquer vídeo).
 * No roteiro: "animacao": { "tipo": "cena3d", "nome": "cerebro", "texto": "..." }
 * Para cenas que contam a história de UM vídeo, use src/sob-medida/vNNN/.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../tema";
import {
  CabecaLowPoly,
  CameraFixa,
  CameraOrbita,
  CerebroLowPoly,
  Cristal,
  entre,
  Palco3D,
  PessoaLowPoly,
  RedeNeural,
  TerrenoLowPoly,
  TunelParticulas,
  useMola,
} from "./kit";

export type Cena3DProps = { dur: number };

const cerebro: React.FC<Cena3DProps> = () => {
  const k = useMola(0, 11);
  return (
    <Palco3D camera={[0, 0.4, 9]}>
      <CameraOrbita raio={9.5} altura={0.4} velocidade={0.003} aproximar={1.2} alvo={[0, -0.6, 0]} />
      <group scale={k}>
        <CerebroLowPoly escala={1} />
      </group>
      <TunelParticulas quantidade={60} velocidade={0.05} raio={6} />
    </Palco3D>
  );
};

const neuronios: React.FC<Cena3DProps> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Palco3D camera={[0, 0, 9]}>
      <CameraOrbita raio={9} altura={1} velocidade={0.003} aproximar={2} />
      <RedeNeural nos={34} acender={entre(f, 0, Math.min(60, dur * 0.5))} />
    </Palco3D>
  );
};

const tunel: React.FC<Cena3DProps> = () => (
  <Palco3D camera={[0, 0, 6]}>
    <TunelParticulas quantidade={260} velocidade={0.45} raio={2.6} />
    <Cristal escala={0.5} cor={COR.vermelho} posicao={[0, 0, -4]} />
  </Palco3D>
);

const cabeca: React.FC<Cena3DProps> = () => {
  const k = useMola(4, 12);
  return (
    <Palco3D camera={[0, 0.3, 7.5]}>
      <CameraOrbita raio={7.5} altura={0.4} velocidade={0.002} />
      <CabecaLowPoly>
        <group scale={0.55 * k}>
          <CerebroLowPoly escala={1} brilho={0.5} giro={0.02} />
        </group>
      </CabecaLowPoly>
    </Palco3D>
  );
};

const cristais: React.FC<Cena3DProps> = () => (
  <Palco3D camera={[0, 0.5, 8]}>
    <CameraOrbita raio={8} altura={0.8} velocidade={0.004} />
    <Cristal escala={1.2} cor={COR.ciano} />
    <Cristal escala={0.5} cor={COR.vermelho} posicao={[-2.4, -0.5, 0.5]} seed={1} />
    <Cristal escala={0.6} cor={COR.amarelo} posicao={[2.3, 0.3, -0.5]} seed={2} />
    <TerrenoLowPoly y={-2.2} />
  </Palco3D>
);

/** Multidão: um boneco vermelho anda e todos se viram para segui-lo (efeito manada / influência). */
const multidao: React.FC<Cena3DProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const vira = entre(f, dur * 0.25, dur * 0.6);
  const lider = entre(f, 0, dur, -3, 3);
  const pessoas = [];
  for (let x = -4; x <= 4; x++)
    for (let z = -3; z <= 1; z++) {
      if (x === 0 && z === 0) continue;
      const ang = Math.atan2(lider - x, 0 - z);
      pessoas.push(<PessoaLowPoly key={`${x}${z}`} posicao={[x * 1.1 + (z % 2) * 0.4, -2, z * 1.3]} seed={x * 7 + z} olhando={ang * vira} />);
    }
  return (
    <Palco3D camera={[0, 3, 10]}>
      <CameraFixa posicao={[Math.sin(f * 0.004) * 2, 4.5, 11]} alvo={[0, -3.2, 0]} />
      <TerrenoLowPoly y={-2} altura={0.25} />
      {pessoas}
      <PessoaLowPoly posicao={[lider, -2, 2.2]} cor={COR.vermelho} escala={1.15} balanco={2} />
    </Palco3D>
  );
};

export const CENAS3D: Record<string, React.FC<Cena3DProps>> = { cerebro, neuronios, tunel, cabeca, cristais, multidao };

/** Envelope: cena 3D em tela cheia + título opcional por cima. */
export const Cena3D: React.FC<{ nome: string; texto?: string; dur: number; vertical?: boolean }> = ({ nome, texto, dur, vertical }) => {
  const C = CENAS3D[nome] ?? cerebro;
  const k = useMola(10);
  return (
    <AbsoluteFill>
      <C dur={dur} />
      {texto && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: vertical ? 260 : 90 }}>
          <div
            style={{
              fontFamily: FONTE_TITULO,
              fontWeight: 800,
              fontSize: vertical ? 84 : 76,
              color: COR.branco,
              textAlign: "center",
              maxWidth: vertical ? 900 : 1500,
              textTransform: "uppercase",
              opacity: k,
              transform: `translateY(${(1 - k) * -30}px)`,
              textShadow: `0 8px 30px rgba(0,0,0,.7), 0 0 30px ${COR.azulClaro}99`,
            }}
          >
            {texto}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
