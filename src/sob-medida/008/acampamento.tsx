/**
 * 008 — Robbers Cave (Sherif, 1954), em 3D.
 * fase "grupos": "O psicólogo Muzafer Sherif dividiu os meninos em dois grupos, em cabanas separadas. (0–.35)
 *                 | Na primeira semana, cada grupo nem sabia que o outro existia. (.35–.7) | Eles criaram nomes:
 *                 as Águias e as Cascavéis. (.7–1)"
 * fase "corda":  "A água do acampamento foi cortada, e todos tiveram que procurar o defeito juntos. (0–.35)
 *                 | Depois, o caminhão da comida não pegou. (.35–.55) | E os meninos usaram a mesma corda do cabo de
 *                 guerra para puxar o caminhão, Águias e Cascavéis lado a lado. (.55–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, entre, Palco3D, PessoaLowPoly, TerrenoLowPoly } from "../../3d/kit";
import { Cabana, Caminhao } from "../../3d/pecas";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02, fase: "grupos" },
  { som: "pop", p: 0.12, fase: "grupos" }, { som: "pop", p: 0.18, fase: "grupos" },
  { som: "sobe", p: 0.72, fase: "grupos" },
  { som: "ding", p: 0.8, fase: "grupos" },
  { som: "whoosh", p: 0.02, fase: "corda" },
  { som: "desce", p: 0.08, fase: "corda" },
  { som: "mecanico", p: 0.4, fase: "corda" },
  { som: "pop", p: 0.6, fase: "corda" },
  { som: "sobe", p: 0.72, fase: "corda" },
  { som: "brilho", p: 0.95, fase: "corda" },
];

const Pinheiro: React.FC<{ p: [number, number, number]; h?: number }> = ({ p, h = 2.2 }) => (
  <group position={p}>
    <mesh position={[0, h * 0.15, 0]}>
      <cylinderGeometry args={[0.08, 0.1, h * 0.3, 5]} />
      <meshStandardMaterial color="#4A2F1E" flatShading />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, h * (0.4 + i * 0.2), 0]}>
        <coneGeometry args={[h * (0.32 - i * 0.07), h * 0.38, 6]} />
        <meshStandardMaterial color={i % 2 ? "#2E6B4A" : "#2A5E43"} flatShading />
      </mesh>
    ))}
  </group>
);

const Bandeira: React.FC<{ x: number; z: number; cor: string; k: number; f: number }> = ({ x, z, cor, k, f }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 1.4, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 2.8, 5]} />
      <meshStandardMaterial color="#C5CBE0" />
    </mesh>
    <mesh position={[0.36, 0.9 + k * 1.6, 0]} rotation={[0, Math.sin(f / 8) * 0.3, 0]}>
      <boxGeometry args={[0.7, 0.42, 0.02]} />
      <meshStandardMaterial color={cor} flatShading emissive={cor} emissiveIntensity={0.2} />
    </mesh>
  </group>
);

const Acampamento: React.FC<PropsSobMedida> = ({ fala, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const corda = props.fase === "corda";
  const kNomes = mola(fala * 0.72);
  const ladoA = COR.vermelho, ladoB = COR.ciano;

  if (!corda) {
    const cam: [number, number, number] = [Math.sin(f * 0.006) * 1.5, 4.2, 11 - p * 1.2];
    const alvo: [number, number, number] = [0, 0.4, 0];
    const k1 = entre(p, 0.08, 0.2);
    return (
      <AbsoluteFill>
        <Palco3D camera={cam} alvo={alvo} clima="dourado">
          <CameraFixa posicao={cam} alvo={alvo} />
          <TerrenoLowPoly y={-0.05} altura={0.15} cor="#3E7A4E" cor2="#2F6340" />
          <Cabana posicao={[-4, 0, -1]} escala={1.1} />
          <Cabana posicao={[4, 0, -1]} escala={1.1} />
          {/* floresta no meio: um grupo não vê o outro */}
          {[-0.6, 0, 0.6, -0.3, 0.3].map((x, i) => <Pinheiro key={i} p={[x, 0, -2.4 + i * 1.1]} h={2.4 + (i % 2) * 0.6} />)}
          {Array.from({ length: 5 }).map((_, i) => (
            <PessoaLowPoly key={`a${i}`} posicao={[-4.6 + (i % 3) * 0.6, 0, 0.9 + Math.floor(i / 3) * 0.7]} escala={0.62 * k1} cor={ladoA} seed={i} olhando={0.3} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <PessoaLowPoly key={`b${i}`} posicao={[3.4 + (i % 3) * 0.6, 0, 0.9 + Math.floor(i / 3) * 0.7]} escala={0.62 * k1} cor={ladoB} seed={10 + i} olhando={-0.3} />
          ))}
          <Bandeira x={-2.6} z={0.4} cor={ladoA} k={kNomes} f={f} />
          <Bandeira x={2.6} z={0.4} cor={ladoB} k={kNomes} f={f} />
        </Palco3D>
        <div style={{ position: "absolute", top: 110, width: "100%", display: "flex", justifyContent: "space-between", padding: "0 260px" }}>
          {[["ÁGUIAS", ladoA], ["CASCAVÉIS", ladoB]].map(([t, c]) => (
            <div key={t} style={{ transform: `scale(${kNomes})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 64, color: c, textShadow: "0 6px 20px rgba(0,0,0,.6)" }}>{t}</div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // corda: água cortada (0–.35), caminhão parado (.35–.55), todos puxam juntos (.6–1)
  const anda = entre(p, 0.72, 1) * 2.2;
  const alinhar = entre(p, 0.56, 0.68);
  const cam: [number, number, number] = [2 + Math.sin(f * 0.006), 3.4, 9 - p * 1];
  const alvo: [number, number, number] = [0.5 + anda * 0.5, 0.6, 0];
  const kAgua = mola(fala * 0.06) * (1 - entre(p, 0.33, 0.38));
  const kJuntos = mola(fala * 0.86);
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo} clima="dourado">
        <CameraFixa posicao={cam} alvo={alvo} />
        <TerrenoLowPoly y={-0.05} altura={0.12} cor="#3E7A4E" cor2="#2F6340" />
        {/* estrada de terra */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 2.4]} />
          <meshStandardMaterial color="#8A6A45" roughness={1} />
        </mesh>
        <Caminhao posicao={[-2.6 + anda, 0, 0]} rodas={anda * 3} />
        {/* a corda */}
        <mesh position={[0.9 + anda, 0.85, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, alinhar, 1]}>
          <cylinderGeometry args={[0.035, 0.035, 5.2, 5]} />
          <meshStandardMaterial color="#D9B97A" />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const lado = i % 2 ? 0.45 : -0.45;
          const xFinal = -0.6 + i * 0.6 + anda;
          const xIni = (i % 2 ? 4 : -1) + (i % 4) * 0.5;
          const zIni = (i % 2 ? -2.6 : 2.6);
          const x = xIni + (xFinal - xIni) * alinhar;
          const z = zIni + (lado - zIni) * alinhar;
          return (
            <PessoaLowPoly key={i} posicao={[x, 0, z]} escala={0.62} cor={i % 2 ? ladoB : ladoA} seed={i * 3} olhando={alinhar > 0.9 ? Math.PI / 2 : i % 2 ? Math.PI : 0} andar={p > 0.7 ? 1 : alinhar > 0 && alinhar < 1 ? 1 : 0} bracos={alinhar > 0.9 ? "frente" : "baixo"} />
          );
        })}
      </Palco3D>
      {kAgua > 0.01 && (
        <div style={{ position: "absolute", left: 160, top: 160, transform: `scale(${kAgua})`, display: "flex", alignItems: "center", gap: 16, background: "rgba(7,15,51,.8)", padding: "14px 24px", borderRadius: 18 }}>
          <svg width={60} height={70} viewBox="0 0 60 70">
            <path d="M30 4 C30 4 6 34 6 46 A24 24 0 0 0 54 46 C54 34 30 4 30 4 Z" fill={COR.ciano} />
            <path d="M8 8 L52 62" stroke={COR.vermelho} strokeWidth={8} strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: COR.branco }}>SEM ÁGUA</div>
        </div>
      )}
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", transform: `scale(${kJuntos})`, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 60, color: COR.amarelo, textShadow: "0 6px 20px rgba(0,0,0,.6)" }}>
        LADO A LADO
      </div>
    </AbsoluteFill>
  );
};

export default Acampamento;
