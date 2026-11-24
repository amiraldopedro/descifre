/**
 * Cena 3D "Em que posição você dorme?" — uma pessoa na cama vista de cima,
 * que troca de posição acompanhando a fala: de costas → de lado → de bruços.
 * Feita para o Short em pé (vertical = true).
 *
 * {"tipo":"sobmedida","nome":"sono/posicoes","props":{...}}
 *  posicao: "ciclo" (padrão: troca em p=0.05, 0.38, 0.7) | "costas" | "lado" | "brucos" (fixa)
 *  rotulos: true (padrão) mostra a etiqueta da posição
 *  cerebro: true = cérebro brilhando dentro da cabeça (a "limpeza" quando dorme de lado)
 *  ronco:   true = "Zzz" trêmulo grande (ronco) na posição de costas
 *
 * Fala de referência (ciclo): "Em que posição você dorme? De costas, de lado ou de bruços?"
 *   p 0.05 costas · p 0.38 lado · p 0.70 bruços
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraFixa, CerebroLowPoly, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

export const vertical = true;
export const sons: SomCena[] = [
  { som: "whoosh_lento", p: 0.0, vol: 0.5 },
  { som: "swish", p: 0.38, vol: 0.8 },
  { som: "swish", p: 0.7, vol: 0.8 },
];

type V3 = [number, number, number];
type Posicao = "costas" | "lado" | "brucos";
const ORDEM: Posicao[] = ["costas", "lado", "brucos"];
const NOME: Record<Posicao, string> = { costas: "DE COSTAS", lado: "DE LADO", brucos: "DE BRUÇOS" };
const mat = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.85} />;

const Cama: React.FC = () => (
  <group>
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[2.1, 0.5, 3.2]} />
      {mat("#5A3A24")}
    </mesh>
    <mesh position={[0, 0.6, 0]}>
      <boxGeometry args={[1.95, 0.25, 3.05]} />
      {mat("#EDEFF7")}
    </mesh>
    <mesh position={[0, 0.9, -1.55]}>
      <boxGeometry args={[2.1, 1.2, 0.15]} />
      {mat("#4A2E1C")}
    </mesh>
    <mesh position={[0, 0.84, -1.15]} rotation={[0.2, 0, 0]}>
      <boxGeometry args={[1.2, 0.22, 0.55]} />
      {mat("#FFFFFF")}
    </mesh>
    {/* coberta até a cintura */}
    <mesh position={[0, 1.0, 0.95]}>
      <boxGeometry args={[2.0, 0.42, 1.6]} />
      {mat("#3D63E6")}
    </mesh>
  </group>
);

const Quarto: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 14]} />
      {mat("#3A2A1E")}
    </mesh>
    <mesh position={[0, 3, -3.4]}>
      <boxGeometry args={[14, 6, 0.2]} />
      {mat("#2E3B78")}
    </mesh>
    <mesh position={[-3.8, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[14, 6, 0.2]} />
      {mat("#2E3B78")}
    </mesh>
    {/* abajur aceso */}
    <group position={[1.7, 0, -1.2]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        {mat("#6B4A2E")}
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.16, 0.3, 0.32, 8]} />
        <meshStandardMaterial color="#FFE7B0" emissive="#FFC867" emissiveIntensity={1.2} flatShading />
      </mesh>
      <pointLight position={[0, 1.1, 0]} intensity={10} distance={6} color="#FFC46B" />
    </group>
  </group>
);

/** Pessoa deitada na cama. rot = rotação em torno do eixo do corpo (0 costas, ±90° lado, 180° bruços). */
const Deitada: React.FC<{ rot: number; sobe: number; cerebro: boolean }> = ({ rot, sobe, cerebro }) => (
  <group>
    <group position={[0, 1.0 + sobe, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
      <group position={[0, -0.6, 0]} rotation={[0, rot, 0]}>
        <PessoaLowPoly cor="#F43F5E" seed={4} balanco={0.3} bracos="baixo" />
      </group>
    </group>
    {cerebro && (
      <group position={[0, 2.4, -1.0]} scale={0.22}>
        <CerebroLowPoly escala={1} brilho={1} faiscas />
      </group>
    )}
  </group>
);

const Posicoes: React.FC<PropsSobMedida> = ({ dur, fala, props }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fixa: Posicao | undefined = props.posicao && props.posicao !== "ciclo" ? props.posicao : undefined;
  const marcas = [0.05, 0.38, 0.7].map((p) => p * fala);
  let idx = 0;
  if (!fixa) for (let i = 0; i < marcas.length; i++) if (f >= marcas[i]) idx = i;
  const atual: Posicao = fixa ?? ORDEM[idx];
  const inicioTroca = fixa ? 0 : marcas[idx];
  const k = spring({ frame: f - inicioTroca, fps, config: { damping: 11, stiffness: 150, mass: 0.7 } });
  const alvoRot: Record<Posicao, number> = { costas: 0, lado: Math.PI / 2, brucos: Math.PI };
  const anterior: Posicao = fixa ? atual : ORDEM[Math.max(0, idx - 1)];
  const rot = fixa || idx === 0 ? alvoRot[atual] : interpolate(k, [0, 1], [alvoRot[anterior], alvoRot[atual]]);
  const sobe = fixa ? 0 : Math.sin(Math.min(1, k) * Math.PI) * 0.25; // pulinho na troca

  // câmera: de cima em diagonal, aproximando devagar
  const e = entre(f, 0, dur, 0, 1);
  const cam: V3 = [2.6 - e * 0.5, 5.8 - e * 0.7, 4.8 - e * 0.7];
  const alvo: V3 = [0, 0.9, -0.5];
  const kRot = spring({ frame: f - inicioTroca - 3, fps, config: { damping: 10, stiffness: 200 } });

  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo} fov={48} clima="dourado">
        <CameraFixa posicao={cam} alvo={alvo} />
        <Quarto />
        <Cama />
        <Deitada rot={rot} sobe={sobe} cerebro={!!props.cerebro && atual === "lado"} />
        <pointLight position={[0, 4.5, 0.5]} intensity={22} distance={12} color="#FFE0A8" />
      </Palco3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      {props.rotulos !== false && (
        <div style={{ position: "absolute", top: 190, width: "100%", textAlign: "center", transform: `scale(${kRot})` }}>
          <span
            style={{
              background: atual === "lado" ? COR.ciano : atual === "costas" ? COR.vermelho : COR.amarelo,
              color: COR.azulEscuro,
              fontFamily: FONTE_TITULO,
              fontWeight: 900,
              fontSize: 78,
              padding: "10px 36px",
              borderRadius: 20,
              boxShadow: "0 12px 0 rgba(0,0,0,.35)",
              display: "inline-block",
              transform: `rotate(${interpolate(kRot, [0, 1], [-8, -2])}deg)`,
            }}
          >
            {NOME[atual]}
          </span>
        </div>
      )}
      {props.ronco && atual === "costas" && (
        <div style={{ position: "absolute", top: 560 + Math.sin(f / 6) * 14, left: 0, width: "100%", textAlign: "center", transform: `rotate(${Math.sin(f / 4) * 6}deg)` }}>
          <span style={{ fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: 150, color: COR.vermelho, WebkitTextStroke: `10px ${COR.azulEscuro}`, paintOrder: "stroke fill" }}>
            ZZZ
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
export default Posicoes;
