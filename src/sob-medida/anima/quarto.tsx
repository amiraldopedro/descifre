/**
 * Cena 3D "animada" (estilo dos Shorts de animação 3D): uma pessoa num ambiente, câmera de cinema.
 * Feita para o Short em pé (vertical = true), serve para MUITOS roteiros mudando só os props.
 *
 * {"tipo":"sobmedida","nome":"anima/quarto","props":{...}}
 *  cenario: "quarto" (padrão) | "sala" | "escritorio" | "rua"
 *  luz:     "apagada" (padrão, noite) | "acesa" | "banheiro" (luz vazando da porta) | "celular" (tela no rosto) | "dia"
 *  pose:    "deitado" (padrão no quarto) | "sentado" | "em-pe" | "andando"
 *  coberta: 0..1 (quanto do corpo a coberta cobre; só deitado) · pe: true = um pé para fora da coberta
 *  olhos:   "abertos" | "fechados"
 *  camera:  "aproxima" (padrão) | "orbita" | "cima" | "rosto" | "afasta"
 *  efeito:  "zzz" | "pergunta" | "alerta" | "coracao" | "raio" | "suor" | "brilho" (aparece na cabeça)
 *  rotulo:  texto curto no topo (ex.: "MELATONINA ↓"), cor_rotulo: "vermelho" | "ciano" | "amarelo"
 *  cor:     cor da camisa · pessoas: [{"x":1.2,"z":-1,"pose":"em-pe","olhando":-0.6,"cor":"#..."}] (gente extra)
 *  entra:   proporção da fala em que o efeito/rótulo aparece (padrão 0.15)
 *  chuva:   true = chuva escorrendo na frente da câmera (como se visse pela janela) e relâmpago suave
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CameraFixa, Palco3D, PessoaLowPoly, entre } from "../../3d/kit";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

export const vertical = true;
export const sons: SomCena[] = [{ som: "whoosh_lento", p: 0.0, vol: 0.6 }, { som: "pop", p: 0.15, vol: 0.8 }];

type V3 = [number, number, number];
const mat = (c: string, extra: Record<string, unknown> = {}) => <meshStandardMaterial color={c} flatShading roughness={0.8} {...extra} />;

/* ---------------------------------------------------------------- móveis */

const Cama: React.FC<{ coberta: number; pe: boolean; corCoberta: string }> = ({ coberta, pe, corCoberta }) => (
  <group>
    <mesh position={[0, 0.25, 0]}>
      <boxGeometry args={[1.9, 0.5, 2.9]} />
      {mat("#5A3A24")}
    </mesh>
    <mesh position={[0, 0.6, 0]}>
      <boxGeometry args={[1.75, 0.25, 2.75]} />
      {mat("#EDEFF7")}
    </mesh>
    <mesh position={[0, 0.85, -1.4]}>
      <boxGeometry args={[1.9, 1.3, 0.15]} />
      {mat("#4A2E1C")}
    </mesh>
    <mesh position={[0, 0.85, -1.05]} rotation={[0.25, 0, 0]}>
      <boxGeometry args={[1.1, 0.22, 0.5]} />
      {mat("#FFFFFF")}
    </mesh>
    {coberta > 0 && (
      <mesh position={[0, 1.03, 1.4 - (2.1 * coberta) / 2 - (pe ? 0.4 : 0)]}>
        <boxGeometry args={[1.85, 0.5, 2.1 * coberta]} />
        {mat(corCoberta)}
      </mesh>
    )}
  </group>
);

const Abajur: React.FC<{ posicao: V3; acesa: boolean }> = ({ posicao, acesa }) => (
  <group position={posicao}>
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      {mat("#6B4A2E")}
    </mesh>
    <mesh position={[0, 0.8, 0]}>
      <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
      {mat("#333")}
    </mesh>
    <mesh position={[0, 1.1, 0]}>
      <cylinderGeometry args={[0.16, 0.3, 0.32, 8, 1, true]} />
      <meshStandardMaterial color="#FFE7B0" emissive="#FFC867" emissiveIntensity={acesa ? 1.4 : 0} side={THREE.DoubleSide} flatShading />
    </mesh>
    {acesa && <pointLight position={[0, 1.05, 0]} intensity={14} distance={7} color="#FFC46B" />}
  </group>
);

const Porta: React.FC<{ posicao: V3; luz: boolean; rotacao?: number }> = ({ posicao, luz, rotacao = 0 }) => (
  <group position={posicao} rotation={[0, rotacao, 0]}>
    <mesh position={[0, 1.15, 0]}>
      <boxGeometry args={[1.05, 2.3, 0.05]} />
      <meshStandardMaterial color={luz ? "#FFF6D8" : "#1A2050"} emissive={luz ? "#FFE9A8" : "#000"} emissiveIntensity={luz ? 1.6 : 0} />
    </mesh>
    {/* porta entreaberta */}
    <mesh position={[0.62, 1.15, 0.35]} rotation={[0, -0.9, 0]}>
      <boxGeometry args={[1, 2.25, 0.08]} />
      {mat("#E8E2D4")}
    </mesh>
    {luz && <spotLight position={[0, 1.6, -0.4]} target-position={[posicao[0], 0, posicao[2] + 3]} angle={0.7} penumbra={0.6} intensity={45} distance={12} color="#FFE2A0" />}
    {luz && <pointLight position={[0, 1.2, 0.5]} intensity={6} distance={5} color="#FFE9B8" />}
  </group>
);

const Paredes: React.FC<{ cor: string; chao: string; janela?: boolean; dia?: boolean }> = ({ cor, chao, janela, dia }) => (
  <group>
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 14]} />
      {mat(chao)}
    </mesh>
    <mesh position={[0, 3, -3.2]}>
      <boxGeometry args={[14, 6, 0.2]} />
      {mat(cor)}
    </mesh>
    <mesh position={[-3.6, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[14, 6, 0.2]} />
      {mat(cor)}
    </mesh>
    {janela && (
      <group position={[1.8, 2.6, -3.08]}>
        <mesh>
          <boxGeometry args={[1.6, 1.3, 0.05]} />
          <meshStandardMaterial color={dia ? "#BFE3FF" : "#0B1446"} emissive={dia ? "#9ED3FF" : "#1B2A7A"} emissiveIntensity={dia ? 1.2 : 0.4} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.06, 1.3, 0.04]} />
          {mat("#FFFFFF")}
        </mesh>
        {!dia && (
          <mesh position={[0.45, 0.3, 0.03]}>
            <circleGeometry args={[0.12, 10]} />
            <meshBasicMaterial color="#FFF3C4" />
          </mesh>
        )}
      </group>
    )}
  </group>
);

const Mesa: React.FC<{ posicao: V3 }> = ({ posicao }) => (
  <group position={posicao}>
    <mesh position={[0, 0.78, 0]}>
      <boxGeometry args={[1.8, 0.08, 0.9]} />
      {mat("#7A5233")}
    </mesh>
    {[-0.8, 0.8].map((x) => (
      <mesh key={x} position={[x, 0.38, 0]}>
        <boxGeometry args={[0.08, 0.76, 0.8]} />
        {mat("#5A3A24")}
      </mesh>
    ))}
    <mesh position={[0, 1.15, -0.2]}>
      <boxGeometry args={[0.9, 0.55, 0.05]} />
      <meshStandardMaterial color="#9AD8FF" emissive="#58B8FF" emissiveIntensity={1.1} />
    </mesh>
  </group>
);

const Sofa: React.FC<{ posicao: V3 }> = ({ posicao }) => (
  <group position={posicao}>
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[2.4, 0.6, 1]} />
      {mat("#3F5BA9")}
    </mesh>
    <mesh position={[0, 0.8, -0.4]}>
      <boxGeometry args={[2.4, 0.8, 0.25]} />
      {mat("#344C8F")}
    </mesh>
  </group>
);

const Rua: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      {mat("#2B2F45")}
    </mesh>
    {[-4, 4].map((x) => (
      <mesh key={x} position={[x, 0.08, 0]}>
        <boxGeometry args={[2.4, 0.16, 30]} />
        {mat("#5A607A")}
      </mesh>
    ))}
    {[-6, 6].map((x, i) =>
      [-10, -4, 2].map((z, j) => (
        <mesh key={`${i}${j}`} position={[x, 2.5 + ((i + j) % 2), z]}>
          <boxGeometry args={[3, 5 + ((i * 3 + j) % 3) * 1.5, 4]} />
          {mat(["#1D2A63", "#26357A", "#162055"][(i + j) % 3])}
        </mesh>
      )),
    )}
    <group position={[2.6, 0, -1]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 3.2, 6]} />
        {mat("#333")}
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshBasicMaterial color="#FFE6A0" />
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={20} distance={9} color="#FFD27A" />
    </group>
  </group>
);

/* ---------------------------------------------------------------- pessoa com pálpebras e pose */

type Pose = "deitado" | "sentado" | "em-pe" | "andando";
const Pessoa: React.FC<{ pose: Pose; posicao: V3; cor?: string; olhos?: string; olhando?: number; seed?: number; tremer?: number }> = ({
  pose, posicao, cor = "#F43F5E", olhos = "abertos", olhando = 0, seed = 2, tremer = 0,
}) => {
  const f = useCurrentFrame();
  const dx = tremer ? Math.sin(f * 2.1) * 0.02 * tremer : 0;
  const corpo = (
    <PessoaLowPoly cor={cor} seed={seed} olhando={pose === "deitado" ? 0 : olhando} sentado={pose === "sentado"} andar={pose === "andando" ? 1 : 0}
      balanco={pose === "deitado" ? 0.3 : 1} bracos="baixo" />
  );
  const palpebras = olhos === "fechados" && (
    <group rotation={[0, pose === "deitado" ? 0 : olhando, 0]} position={[0, pose === "sentado" ? -0.45 : 0, 0]}>
      {[-0.085, 0.085].map((x) => (
        <mesh key={x} position={[x, 1.775, 0.235]}>
          <boxGeometry args={[0.1, 0.06, 0.02]} />
          {mat("#E0B48F")}
        </mesh>
      ))}
    </group>
  );
  if (pose === "deitado") {
    // de barriga para cima, cabeça no travesseiro (cabeça para -z)
    return (
      <group position={[posicao[0] + dx, posicao[1], posicao[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <group position={[0, -0.6, 0]}>
          {corpo}
          {palpebras}
        </group>
      </group>
    );
  }
  return (
    <group position={[posicao[0] + dx, posicao[1], posicao[2]]}>
      {corpo}
      {palpebras}
    </group>
  );
};

/* ---------------------------------------------------------------- câmera */

const useCamera = (tipo: string, alvo: V3, dur: number): { pos: V3; alvo: V3 } => {
  const f = useCurrentFrame();
  const k = entre(f, 0, dur, 0, 1);
  const e = k * k * (3 - 2 * k);
  const [ax, ay, az] = alvo;
  switch (tipo) {
    case "orbita": {
      const a = 0.4 + e * 1.0;
      return { pos: [ax + Math.sin(a) * 4.2, ay + 2.3, az + Math.cos(a) * 4.2], alvo };
    }
    case "cima":
      return { pos: [ax + 0.6, ay + 5.2 - e * 1.0, az + 1.4], alvo };
    case "rosto":
      return { pos: [ax + 1.3 - e * 0.25, ay + 1.5 - e * 0.2, az + 1.1 - e * 0.2], alvo };
    case "afasta":
      return { pos: [ax + 1.6 + e * 1.4, ay + 1.6 + e * 1.6, az + 2.2 + e * 2.6], alvo };
    default: // aproxima
      return { pos: [ax + 3.4 - e * 1.3, ay + 2.2 - e * 0.5, az + 3.0 - e * 1.0], alvo };
  }
};

/* ---------------------------------------------------------------- efeitos 2D por cima */

const ICONES: Record<string, { txt: string; cor: string }> = {
  zzz: { txt: "Z z z", cor: COR.ciano },
  pergunta: { txt: "?", cor: COR.amarelo },
  alerta: { txt: "!", cor: COR.vermelho },
  coracao: { txt: "♥", cor: COR.vermelho },
  raio: { txt: "⚡", cor: COR.amarelo },
  suor: { txt: "💧", cor: COR.ciano },
  brilho: { txt: "✦", cor: COR.amarelo },
};

const Efeito: React.FC<{ nome: string; k: number; y: number }> = ({ nome, k, y }) => {
  const f = useCurrentFrame();
  const ic = ICONES[nome];
  if (!ic || k <= 0) return null;
  const flut = Math.sin(f / 9) * 18;
  return (
    <div style={{ position: "absolute", top: y + flut, width: "100%", textAlign: "center", transform: `scale(${k}) rotate(${Math.sin(f / 13) * 8}deg)` }}>
      <span style={{ fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: nome === "zzz" ? 130 : 220, color: ic.cor, WebkitTextStroke: `10px ${COR.azulEscuro}`, paintOrder: "stroke fill", textShadow: "0 12px 30px rgba(0,0,0,.5)" }}>
        {ic.txt}
      </span>
    </div>
  );
};

/** Chuva determinística por cima da cena (gotas em diagonal + brilho de relâmpago). */
const Chuva: React.FC<{ forca?: number }> = ({ forca = 1 }) => {
  const f = useCurrentFrame();
  const gotas = Array.from({ length: Math.round(90 * forca) }).map((_, i) => {
    const x0 = (i * 137.5) % 1180 - 50;
    const vel = 22 + ((i * 29) % 17);
    const comp = 60 + ((i * 53) % 90);
    const y = ((f * vel + i * 211) % 2200) - 200;
    return <line key={i} x1={x0} y1={y} x2={x0 - 14} y2={y + comp} stroke={COR.ciano} strokeWidth={i % 4 === 0 ? 4 : 2.5} strokeLinecap="round" opacity={0.18 + ((i * 7) % 5) * 0.08} />;
  });
  const rel = f % 170 > 160 ? interpolate(f % 170, [160, 162, 165, 170], [0, 0.35, 0.1, 0]) : 0;
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: "#DDE9FF", opacity: rel, mixBlendMode: "screen" }} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>{gotas}</svg>
    </>
  );
};

const CORES_ROTULO: Record<string, string> = { vermelho: COR.vermelho, ciano: COR.ciano, amarelo: COR.amarelo };

/* ---------------------------------------------------------------- cena */

const Quarto: React.FC<PropsSobMedida> = ({ dur, fala, props }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cenario: string = props.cenario ?? "quarto";
  const luz: string = props.luz ?? (cenario === "rua" ? "apagada" : "apagada");
  const pose: Pose = props.pose ?? (cenario === "quarto" ? "deitado" : cenario === "escritorio" || cenario === "sala" ? "sentado" : "em-pe");
  const coberta = props.coberta ?? 0.75;
  const entra = (props.entra ?? 0.15) * fala;
  const k = spring({ frame: f - entra, fps, config: { damping: 9, stiffness: 180 } });
  const dia = luz === "dia";

  // onde fica a pessoa (alvo da câmera)
  let pessoa: V3 = [0, 0, 0], alvo: V3 = [0, 1.2, 0];
  if (cenario === "quarto") {
    pessoa = pose === "deitado" ? [0, 0.95, 0.15] : [0.2, 0, 1.6];
    alvo = pose === "deitado" ? [0, 1.0, -0.6] : [0.2, 1.3, 1.6];
  } else if (cenario === "sala") {
    pessoa = [0, 0.15, 0.1]; alvo = [0, 1.1, 0.1];
  } else if (cenario === "escritorio") {
    pessoa = [0, 0.05, 0.95]; alvo = [0, 1.1, 0.45];
  } else {
    pessoa = [0, 0, 0]; alvo = [0, 1.3, 0];
  }
  const cam = useCamera(props.camera ?? "aproxima", alvo, dur);
  const clima = dia ? "dia" : luz === "acesa" ? "dourado" : "noite";
  const celular = luz === "celular";

  return (
    <AbsoluteFill>
      <Palco3D camera={cam.pos} alvo={cam.alvo} fov={50} clima={clima}>
        <CameraFixa posicao={cam.pos} alvo={cam.alvo} />
        {cenario === "rua" ? (
          <Rua />
        ) : (
          <Paredes cor={cenario === "escritorio" ? "#3B4B7A" : "#2E3B78"} chao={cenario === "sala" ? "#6B4A2E" : "#4A3424"} janela dia={dia} />
        )}
        {cenario === "quarto" && (
          <>
            <Cama coberta={pose === "deitado" ? coberta : 0} pe={!!props.pe} corCoberta={props.cor_coberta ?? "#6C8CFF"} />
            <Abajur posicao={[1.4, 0, -1.1]} acesa={luz === "acesa"} />
            <Porta posicao={[-3.48, 0, 1.2]} rotacao={Math.PI / 2} luz={luz === "banheiro"} />
            {luz === "acesa" && <pointLight position={[0, 4.5, 0]} intensity={30} distance={12} color="#FFE0A8" />}
          </>
        )}
        {cenario === "sala" && <Sofa posicao={[0, 0, -0.2]} />}
        {cenario === "escritorio" && <Mesa posicao={[0, 0, 0]} />}
        {cenario !== "quarto" && luz === "acesa" && <pointLight position={[0, 4.5, 1]} intensity={30} distance={12} color="#FFE0A8" />}
        <Pessoa pose={pose} posicao={pessoa} cor={props.cor} olhos={props.olhos} olhando={props.olhando ?? (cenario === "escritorio" ? Math.PI : 0)} tremer={props.tremer ?? 0} />
        {celular && (
          <mesh position={pose === "deitado" ? [0.1, 1.5, -0.5] : [pessoa[0] + 0.15, pessoa[1] + 1.45 - (pose === "sentado" ? 0.45 : 0), pessoa[2] + 0.45]}
            rotation={pose === "deitado" ? [Math.PI / 2, 0, 0] : [0.3, Math.PI, 0]}>
            <boxGeometry args={[0.22, 0.4, 0.03]} />
            <meshStandardMaterial color="#BFE6FF" emissive="#7CCBFF" emissiveIntensity={2} />
          </mesh>
        )}
        {celular && <pointLight position={[pessoa[0], pessoa[1] + (pose === "deitado" ? 0.9 : 1.5), pessoa[2] + 0.5]} intensity={8} distance={3} color="#8FD3FF" />}
        {(props.pessoas ?? []).map((p: { x: number; z: number; pose?: Pose; olhando?: number; cor?: string; seed?: number }, i: number) => (
          <Pessoa key={i} pose={p.pose ?? "em-pe"} posicao={[p.x, 0, p.z]} olhando={p.olhando ?? 0} cor={p.cor ?? "#22D3EE"} seed={p.seed ?? i + 5} />
        ))}
      </Palco3D>
      {/* vinheta de cinema nas bordas */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      {props.chuva && <Chuva forca={typeof props.chuva === "number" ? props.chuva : 1} />}
      {props.efeito && <Efeito nome={props.efeito} k={k} y={330} />}
      {props.rotulo && (
        <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", transform: `scale(${k})` }}>
          <span style={{
            background: CORES_ROTULO[props.cor_rotulo ?? "vermelho"] ?? COR.vermelho, color: props.cor_rotulo === "amarelo" ? COR.azulEscuro : COR.branco,
            fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: 76, padding: "10px 34px", borderRadius: 20, boxShadow: "0 12px 0 rgba(0,0,0,.35)",
            display: "inline-block", transform: `rotate(${interpolate(k, [0, 1], [-8, -2])}deg)`,
          }}>
            {props.rotulo}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
export default Quarto;
