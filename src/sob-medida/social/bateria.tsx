/**
 * Cena 3D "Bateria social" — uma pessoa (vermelha) no meio de uma festa, com uma
 * bateria em cima da cabeça que vai esvaziando enquanto a fala avança. Vertical.
 *
 * {"tipo":"sobmedida","nome":"social/bateria","props":{...}}
 *  cenario: "festa" (padrão: gente em volta, luzes) | "sofa" (sozinha em casa, recarregando)
 *  de, ate: nível da bateria no começo e no fim da fala (0..1). Padrão festa 1→0.1, sofá 0.1→1
 *  rotulo:  texto no topo (opcional) · cor: "vermelho" | "ciano" | "amarelo"
 *  gente:   quantas pessoas em volta na festa (padrão 7)
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { random } from "remotion";
import { CameraFixa, entre, Palco3D, PessoaLowPoly } from "../../3d/kit";
import { COR, FONTE_TITULO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";

export const vertical = true;
export const sons: SomCena[] = [
  { som: "whoosh_lento", p: 0.0, vol: 0.5 },
  { som: "desce", p: 0.5, vol: 0.5, fase: "festa" },
  { som: "alerta", p: 0.9, vol: 0.8, fase: "festa" },
  { som: "sobe", p: 0.5, vol: 0.5, fase: "sofa" },
  { som: "ding", p: 0.92, vol: 0.8, fase: "sofa" },
];

type V3 = [number, number, number];
const mat = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.85} />;

const Chao: React.FC<{ festa: boolean }> = ({ festa }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18]} />
      {mat(festa ? "#1C2250" : "#6B4A2E")}
    </mesh>
    <mesh position={[0, 3, -4]}>
      <boxGeometry args={[18, 6, 0.2]} />
      {mat(festa ? "#141B45" : "#2E3B78")}
    </mesh>
  </group>
);

const Luzes: React.FC = () => {
  const f = useCurrentFrame();
  const cores = [COR.vermelho, COR.ciano, COR.amarelo, "#B06CFF"];
  return (
    <group>
      {cores.map((c, i) => {
        const a = f * 0.03 + (i * Math.PI) / 2;
        return <pointLight key={i} position={[Math.sin(a) * 3.5, 3.6, Math.cos(a) * 3.5 - 1]} intensity={28 + Math.sin(f / 4 + i) * 10} distance={9} color={c} />;
      })}
      {/* globo de festa */}
      <mesh position={[0, 3.6, -0.5]} rotation={[0, f * 0.02, 0]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#DDE6FF" metalness={0.9} roughness={0.2} flatShading />
      </mesh>
    </group>
  );
};

const Sofa: React.FC = () => (
  <group position={[0, 0, -0.3]}>
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[2.6, 0.6, 1.1]} />
      {mat("#3F5BA9")}
    </mesh>
    <mesh position={[0, 0.85, -0.45]}>
      <boxGeometry args={[2.6, 0.9, 0.25]} />
      {mat("#344C8F")}
    </mesh>
    {[-1.15, 1.15].map((x) => (
      <mesh key={x} position={[x, 0.65, 0]}>
        <boxGeometry args={[0.3, 0.5, 1.1]} />
        {mat("#344C8F")}
      </mesh>
    ))}
    {/* abajur quente */}
    <group position={[1.9, 0, -0.2]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 6]} />
        {mat("#333")}
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.2, 0.34, 0.36, 8]} />
        <meshStandardMaterial color="#FFE7B0" emissive="#FFC867" emissiveIntensity={1.3} flatShading />
      </mesh>
      <pointLight position={[0, 1.3, 0]} intensity={16} distance={7} color="#FFC46B" />
    </group>
  </group>
);

/** Bateria 2D desenhada por cima da cabeça da pessoa. */
const Bateria: React.FC<{ nivel: number; y: number; k: number }> = ({ nivel, y, k }) => {
  const f = useCurrentFrame();
  const cor = nivel > 0.5 ? COR.ciano : nivel > 0.22 ? COR.amarelo : COR.vermelho;
  const pisca = nivel <= 0.22 ? 0.65 + Math.abs(Math.sin(f / 4)) * 0.35 : 1;
  const L = 300, A = 130;
  return (
    <div style={{ position: "absolute", top: y, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${k})`, opacity: pisca }}>
      <svg width={L + 40} height={A + 20} viewBox={`0 0 ${L + 40} ${A + 20}`} style={{ filter: `drop-shadow(0 10px 20px rgba(0,0,0,.5)) drop-shadow(0 0 24px ${cor}88)` }}>
        <rect x={10} y={10} width={L} height={A} rx={22} fill="rgba(7,15,51,.85)" stroke={COR.branco} strokeWidth={10} />
        <rect x={L + 12} y={A / 2 - 22} width={22} height={64} rx={8} fill={COR.branco} />
        <rect x={26} y={26} width={Math.max(0, (L - 32) * nivel)} height={A - 32} rx={12} fill={cor} />
        <text x={L / 2 + 10} y={A / 2 + 28} textAnchor="middle" fontFamily={FONTE_TITULO} fontWeight={900} fontSize={58} fill={COR.branco} stroke={COR.azulEscuro} strokeWidth={8} paintOrder="stroke fill">
          {Math.round(nivel * 100)}%
        </text>
      </svg>
    </div>
  );
};

const BateriaSocial: React.FC<PropsSobMedida> = ({ dur, fala, props }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const festa = (props.cenario ?? "festa") === "festa";
  const de = props.de ?? (festa ? 1 : 0.1);
  const ate = props.ate ?? (festa ? 0.08 : 1);
  const nivel = interpolate(f, [fala * 0.1, fala * 0.95], [de, ate], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const k = spring({ frame: f - 4, fps, config: { damping: 10, stiffness: 160 } });
  const e = entre(f, 0, dur, 0, 1);
  const ee = e * e * (3 - 2 * e);
  const gente: number = props.gente ?? 7;
  const cansaco = festa ? 1 - nivel : 0; // quanto mais vazia, mais a pessoa murcha

  const cam: V3 = festa ? [0.6 - ee * 0.3, 3.0 - ee * 0.6, 7.6 - ee * 1.6] : [1.2 - ee * 0.4, 1.9 - ee * 0.3, 4.8 - ee * 1.0];
  const alvo: V3 = festa ? [0, 1.0, 0] : [0, 0.9, -0.2];

  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo} fov={52} clima={festa ? "noite" : "dourado"}>
        <CameraFixa posicao={cam} alvo={alvo} />
        <Chao festa={festa} />
        {festa ? <Luzes /> : <Sofa />}
        {!festa && <pointLight position={[0, 4.2, 1]} intensity={14} distance={10} color="#FFE0A8" />}
        {/* a pessoa principal */}
        <group position={[0, festa ? 0 : 0.15, 0]} rotation={[cansaco * 0.25, 0, 0]} scale={[1, 1 - cansaco * 0.12, 1]}>
          <PessoaLowPoly cor="#F43F5E" seed={4} olhando={festa ? 0.2 : 0} bracos={festa ? (cansaco > 0.6 ? "baixo" : "frente") : "baixo"} sentado={!festa} balanco={festa ? 1 + cansaco : 0.4} />
        </group>
        {/* gente em volta, conversando e balançando */}
        {festa &&
          Array.from({ length: gente }).map((_, i) => {
            const a = (i / gente) * Math.PI * 2 + 0.4;
            const r = 1.9 + random(`r${i}`) * 0.9;
            const x = Math.sin(a) * r, z = Math.cos(a) * r - 0.4;
            if (z > 0.9) return null; // ninguém na frente da câmera
            const cores = [COR.ciano, COR.amarelo, "#B06CFF", "#2FB5A6", "#FF8A3D", COR.azulClaro, "#F4F7FF"];
            return (
              <group key={i} position={[x, 0, z]}>
                <PessoaLowPoly cor={cores[i % cores.length]} seed={30 + i} olhando={Math.atan2(-x, -z)} bracos={i % 3 === 0 ? "cima" : i % 3 === 1 ? "frente" : "baixo"} andar={i % 2 ? 0.5 : 0} balanco={1.6} />
              </group>
            );
          })}
      </Palco3D>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%)" }} />
      <Bateria nivel={nivel} y={festa ? 520 : 470} k={k} />
      {props.rotulo && (
        <div style={{ position: "absolute", top: 180, width: "100%", textAlign: "center", transform: `scale(${k})` }}>
          <span
            style={{
              background: ({ vermelho: COR.vermelho, ciano: COR.ciano, amarelo: COR.amarelo } as Record<string, string>)[props.cor ?? "vermelho"] ?? COR.vermelho,
              color: props.cor && props.cor !== "vermelho" ? COR.azulEscuro : COR.branco,
              fontFamily: FONTE_TITULO, fontWeight: 900, fontSize: 72, padding: "10px 36px", borderRadius: 20,
              boxShadow: "0 12px 0 rgba(0,0,0,.35)", display: "inline-block", transform: `rotate(${interpolate(k, [0, 1], [-8, -2])}deg)`,
            }}
          >
            {props.rotulo}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
export default BateriaSocial;
