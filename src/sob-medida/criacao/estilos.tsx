/**
 * Cena 3D "Cada tipo de pai cria um tipo de filho" — um adulto e uma criança numa sala,
 * e a postura dos dois muda conforme o estilo de criação (Baumrind). Vertical.
 *
 * {"tipo":"sobmedida","nome":"criacao/estilos","props":{"estilo":"autoritario"}}
 *  estilo: "autoritario" (pai aponta, criança encolhe) | "permissivo" (pai de costas no sofá, criança pula)
 *        | "ausente" (pai longe olhando o celular, criança sozinha) | "firme" (pai agachado na altura da criança)
 *  rotulo: texto da etiqueta (padrão: nome do estilo) · cor: "vermelho" | "ciano" | "amarelo"
 *  entra:  proporção da fala em que a etiqueta aparece (padrão 0.1)
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

export const vertical = true;
export const sons: SomCena[] = [{ som: "whoosh_lento", p: 0.0, vol: 0.5 }, { som: "pop", p: 0.1, vol: 0.8 }];

type V3 = [number, number, number];
const mat = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.85} />;

const ROTULO: Record<string, { txt: string; cor: string }> = {
  autoritario: { txt: "AUTORITÁRIO", cor: COR.vermelho },
  permissivo: { txt: "PERMISSIVO", cor: COR.amarelo },
  ausente: { txt: "AUSENTE", cor: COR.azulClaro },
  firme: { txt: "FIRME E AFETUOSO", cor: COR.ciano },
};

const Sala: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 16]} />
      {mat("#6B4A2E")}
    </mesh>
    <mesh position={[0, 3, -3.5]}>
      <boxGeometry args={[16, 6, 0.2]} />
      {mat("#2E3B78")}
    </mesh>
    {/* tapete */}
    <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.6, 2.4]} />
      {mat("#B23A4A")}
    </mesh>
    {/* sofá ao fundo */}
    <group position={[-1.6, 0, -2.6]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2.4, 0.6, 1]} />
        {mat("#3F5BA9")}
      </mesh>
      <mesh position={[0, 0.8, -0.4]}>
        <boxGeometry args={[2.4, 0.8, 0.25]} />
        {mat("#344C8F")}
      </mesh>
    </group>
    {/* quadro e janela */}
    <mesh position={[1.9, 2.4, -3.38]}>
      <boxGeometry args={[1.5, 1.2, 0.05]} />
      <meshStandardMaterial color="#BFE3FF" emissive="#9ED3FF" emissiveIntensity={0.9} />
    </mesh>
    {/* brinquedo no chão */}
    <mesh position={[1.1, 0.14, 1.3]}>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      {mat(COR.amarelo)}
    </mesh>
    <mesh position={[0.75, 0.12, 1.5]}>
      <icosahedronGeometry args={[0.14, 0]} />
      {mat(COR.ciano)}
    </mesh>
  </group>
);

const Celular: React.FC<{ posicao: V3; rot: number }> = ({ posicao, rot }) => (
  <group position={posicao} rotation={[0.4, rot, 0]}>
    <mesh>
      <boxGeometry args={[0.2, 0.36, 0.03]} />
      <meshStandardMaterial color="#BFE6FF" emissive="#7CCBFF" emissiveIntensity={1.8} />
    </mesh>
    <pointLight intensity={5} distance={2.5} color="#8FD3FF" />
  </group>
);

const Estilos: React.FC<PropsSobMedida> = ({ dur, fala, props }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const estilo: string = props.estilo ?? "firme";
  const entra = (props.entra ?? 0.1) * fala;
  const k = spring({ frame: f - entra, fps, config: { damping: 9, stiffness: 180 } });
  const e = entre(f, 0, dur, 0, 1);
  const ee = e * e * (3 - 2 * e);

  // posições do adulto e da criança por estilo
  let adulto: V3 = [-0.7, 0, 0.2], crianca: V3 = [0.7, 0, 0.5];
  let olharA = 0.5, olharC = -0.5, bracosA: "baixo" | "cima" | "frente" | "cruzados" = "baixo", bracosC: typeof bracosA = "baixo";
  let escalaA = 1.15, agacha = 0, tremor = 0, pulo = 0;
  switch (estilo) {
    case "autoritario":
      adulto = [-0.9, 0, -0.9]; crianca = [0.8, 0, 0.8];
      bracosA = "frente"; bracosC = "cruzados"; olharA = 0.7; olharC = 0.9; escalaA = 1.25; tremor = 1;
      break;
    case "permissivo":
      adulto = [-1.6, 0.15, -2.4]; crianca = [0.6, 0, 0.6];
      bracosA = "baixo"; bracosC = "cima"; olharA = 0; olharC = -0.3; pulo = 1;
      break;
    case "ausente":
      adulto = [-1.5, 0, -1.9]; crianca = [0.9, 0, 0.7];
      bracosA = "frente"; bracosC = "baixo"; olharA = -1.4; olharC = 0.2;
      break;
    default: // firme
      adulto = [-0.55, 0, 0.3]; crianca = [0.55, 0, 0.5];
      bracosA = "frente"; bracosC = "baixo"; olharA = 0.9; olharC = -0.9; agacha = 1;
  }
  const pul = pulo ? Math.abs(Math.sin(f / 5)) * 0.25 : 0;
  const trem = tremor ? Math.sin(f * 1.8) * 0.02 : 0;

  // câmera: lateral baixa, aproximando devagar na direção da criança
  const cam: V3 = [1.0 - ee * 0.4, 2.0 - ee * 0.4, 6.2 - ee * 1.0];
  const alvo: V3 = [0, 0.9, 0.3];
  const r = ROTULO[estilo] ?? ROTULO.firme;
  const corRot = props.cor ? ({ vermelho: COR.vermelho, ciano: COR.ciano, amarelo: COR.amarelo } as Record<string, string>)[props.cor] ?? r.cor : r.cor;

  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo} fov={50} clima="dourado">
        <CameraFixa posicao={cam} alvo={alvo} />
        <Sala />
        <pointLight position={[0, 4.5, 1]} intensity={26} distance={12} color="#FFE0A8" />
        {/* adulto */}
        <group position={[adulto[0] + trem, adulto[1], adulto[2]]} scale={agacha ? escalaA * (1 - 0.3 * Math.min(1, f / 10)) : escalaA}>
          <PessoaLowPoly cor={estilo === "autoritario" ? "#8D2F3A" : estilo === "firme" ? "#2FB5A6" : "#4A5A9A"} seed={11} olhando={olharA} bracos={bracosA} sentado={estilo === "permissivo"} />
          {estilo === "ausente" && <Celular posicao={[0.2, 1.3, 0.35]} rot={olharA} />}
          {estilo === "permissivo" && <Celular posicao={[0.1, 1.35, 0.4]} rot={0} />}
        </group>
        {/* criança (menor) */}
        <group position={[crianca[0], crianca[1] + pul, crianca[2]]} scale={0.62}>
          <PessoaLowPoly cor={COR.amarelo} calca="#3D63E6" seed={23} olhando={olharC} bracos={bracosC} balanco={tremor ? 2.5 : 1} />
        </group>
      </Palco3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      <div style={{ position: "absolute", top: 180, width: "100%", textAlign: "center", transform: `scale(${k})` }}>
        <span
          style={{
            background: corRot, color: corRot === COR.vermelho || corRot === COR.azulClaro ? COR.branco : COR.azulEscuro,
            fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: (props.rotulo ?? r.txt).length > 12 ? 60 : 78,
            padding: "10px 36px", borderRadius: 20, boxShadow: "0 12px 0 rgba(0,0,0,.35)", display: "inline-block",
            transform: `rotate(${interpolate(k, [0, 1], [-8, -2])}deg)`,
          }}
        >
          {props.rotulo ?? r.txt}
        </span>
      </div>
    </AbsoluteFill>
  );
};
export default Estilos;
