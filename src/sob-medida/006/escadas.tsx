/**
 * 006 — Teste 1: escolha uma escada (3D).
 * fase "escolha":  "Escolha uma escada. Sem pensar. A primeira que chamar a sua atenção." (+ contagem)
 *                  as letras A, B, C, D aparecem em p .25/.35/.45/.55
 * fase "destaque" (props.letra): "Escada X, a ... (0–.25) | traço 1 (.25–.6) | traço 2 (.6–1)"
 *                  a câmera voa até a escada escolhida; os traços aparecem em p .3 e .65
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COR, FONTE_TITULO } from "../../tema";
import { CameraFixa, Cristal, entre, Palco3D, TerrenoLowPoly, useTamanho } from "../../3d/kit";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Contador, Rotulo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02, fase: "escolha" },
  { som: "pop", p: 0.25, fase: "escolha" }, { som: "pop", p: 0.35, fase: "escolha" },
  { som: "pop", p: 0.45, fase: "escolha" }, { som: "pop", p: 0.55, fase: "escolha" },
  { som: "tique", fim: 3, fase: "escolha" }, { som: "tique", fim: 2, fase: "escolha" }, { som: "tique", fim: 1, fase: "escolha" },
  { som: "whoosh", p: 0.02, fase: "destaque" },
  { som: "ding", p: 0.3, fase: "destaque" },
  { som: "brilho", p: 0.65, fase: "destaque" },
];

const BASE = -1.5;
const X: Record<string, number> = { A: -4.6, B: -1.55, C: 1.55, D: 4.6 };
const NOMES: Record<string, string> = { A: "A ESPIRAL", B: "A RETA", C: "A DO JARDIM", D: "A ESCONDIDA" };
const TRACOS: Record<string, [string, string]> = {
  A: ["CUIDADOSO", "PENSA DEMAIS"],
  B: ["DIRETO", "DÚVIDAS ESCONDIDAS"],
  C: ["VALORIZA O CAMINHO", "SE SENTE INCOMPREENDIDO"],
  D: ["RESERVADO", "POTENCIAL GUARDADO"],
};

const Degrau: React.FC<{ pos: [number, number, number]; tam?: [number, number, number]; rot?: number; cor?: string }> = ({ pos, tam = [1.1, 0.16, 0.42], rot = 0, cor = COR.branco }) => (
  <mesh position={pos} rotation={[0, rot, 0]}>
    <boxGeometry args={tam} />
    <meshStandardMaterial color={cor} flatShading />
  </mesh>
);

const Espiral: React.FC<{ f: number }> = ({ f }) => (
  <group position={[X.A, BASE, 0]} rotation={[0, f * 0.004, 0]}>
    <mesh position={[0, 1.6, 0]}>
      <cylinderGeometry args={[0.12, 0.12, 3.4, 6]} />
      <meshStandardMaterial color={COR.azulClaro} flatShading />
    </mesh>
    {Array.from({ length: 13 }).map((_, i) => {
      const a = i * 0.55;
      return <Degrau key={i} pos={[Math.cos(a) * 0.55, 0.15 + i * 0.25, Math.sin(a) * 0.55]} tam={[1.0, 0.1, 0.34]} rot={-a} cor={i % 2 ? COR.ciano : COR.branco} />;
    })}
  </group>
);

const Reta: React.FC = () => (
  <group position={[X.B, BASE, 0.6]}>
    {Array.from({ length: 11 }).map((_, i) => (
      <Degrau key={i} pos={[0, 0.14 + i * 0.29, -i * 0.3]} cor={i % 2 ? COR.amarelo : COR.branco} />
    ))}
  </group>
);

const Jardim: React.FC = () => (
  <group position={[X.C, BASE, 0.8]}>
    {Array.from({ length: 10 }).map((_, i) => (
      <Degrau key={i} pos={[Math.sin(i * 0.8) * 0.6, 0.1 + i * 0.14, -i * 0.38]} tam={[0.9, 0.12, 0.36]} rot={Math.cos(i * 0.8) * 0.5} cor="#C98B4E" />
    ))}
    {[[-0.9, 0.3, -0.2], [0.95, 0.4, -1.2], [-1.0, 0.5, -2.4], [0.9, 0.6, -3.2]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]}>
        <coneGeometry args={[0.32, 0.8, 6]} />
        <meshStandardMaterial color={i % 2 ? COR.ciano : "#3FB37F"} flatShading />
      </mesh>
    ))}
  </group>
);

const Escondida: React.FC<{ f: number }> = ({ f }) => (
  <group position={[X.D, BASE, 0.4]}>
    {/* batente da porta */}
    {[-0.7, 0.7].map((x) => (
      <mesh key={x} position={[x, 1.25, 0]}>
        <boxGeometry args={[0.16, 2.5, 0.2]} />
        <meshStandardMaterial color={COR.azulClaro} flatShading />
      </mesh>
    ))}
    <mesh position={[0, 2.55, 0]}>
      <boxGeometry args={[1.56, 0.16, 0.2]} />
      <meshStandardMaterial color={COR.azulClaro} flatShading />
    </mesh>
    {/* a porta entreaberta */}
    <group position={[-0.62, 0, 0.05]} rotation={[0, -1.0 - Math.sin(f / 30) * 0.08, 0]}>
      <mesh position={[0.62, 1.2, 0]}>
        <boxGeometry args={[1.24, 2.4, 0.08]} />
        <meshStandardMaterial color={COR.vermelho} flatShading />
      </mesh>
    </group>
    {/* escada atrás, com luz */}
    {Array.from({ length: 6 }).map((_, i) => (
      <Degrau key={i} pos={[0, 0.1 + i * 0.3, -0.4 - i * 0.32]} tam={[1.1, 0.14, 0.34]} cor={COR.amarelo} />
    ))}
    <pointLight position={[0, 1.4, -1.2]} intensity={14} color={COR.amarelo} distance={4} />
  </group>
);

/** Projeta um ponto 3D na tela (para pôr as letras sobre as escadas). */
const projetar = (p: THREE.Vector3, cam: [number, number, number], alvo: [number, number, number], w: number, h: number) => {
  const c = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  c.position.set(...cam);
  c.lookAt(...alvo);
  c.updateMatrixWorld();
  const v = p.clone().project(c);
  return { left: ((v.x + 1) / 2) * w, top: ((1 - v.y) / 2) * h };
};

const Escadas: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const { width, height } = useTamanho();
  const p = f / Math.max(1, fala);
  const destaque = props.fase === "destaque" ? (props.letra as string) : null;

  const geral: [number, number, number] = [Math.sin(f * 0.006) * 1.2, 2.6, 12];
  const alvoGeral: [number, number, number] = [0, 0.3, 0];
  let cam = geral;
  let alvo = alvoGeral;
  if (destaque) {
    const x = X[destaque];
    const k = entre(p, 0, 0.25);
    const perto: [number, number, number] = [x * 0.8, 2.4, 7.8];
    cam = [interpolate(k, [0, 1], [0, perto[0]]), interpolate(k, [0, 1], [2.6, perto[1]]), interpolate(k, [0, 1], [12, perto[2]])];
    alvo = [interpolate(k, [0, 1], [0, x]), interpolate(k, [0, 1], [0.3, 0.1]), 0];
  }

  const letras = ["A", "B", "C", "D"];
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo}>
        <CameraFixa posicao={cam} alvo={alvo} />
        <TerrenoLowPoly y={BASE - 0.05} altura={0.2} cor={COR.azul} />
        <Espiral f={f} />
        <Reta />
        <Jardim />
        <Escondida f={f} />
        <Cristal posicao={[0, 3.2, -4]} cor={COR.ciano} escala={0.4} seed={2} />
        <Cristal posicao={[-6, 2.6, -5]} cor={COR.vermelho} escala={0.35} seed={4} />
      </Palco3D>
      {letras.map((L, i) => {
        const k = destaque ? 0 : mola(fala * (0.25 + i * 0.1));
        if (k < 0.01) return null;
        const pos = projetar(new THREE.Vector3(X[L], BASE + 3.9, 0), cam, alvo, width, height);
        return (
          <div
            key={L}
            style={{
              position: "absolute", left: pos.left - 50, top: pos.top - 50, width: 100, height: 100, borderRadius: 50,
              background: COR.amarelo, color: COR.azulEscuro, fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 60,
              display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${k})`, boxShadow: "0 10px 30px rgba(0,0,0,.5)",
            }}
          >
            {L}
          </div>
        );
      })}
      {!destaque && (
        <>
          <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center" }}>
            <Rotulo texto="TESTE 1 DE 4 · ESCOLHA PELO INSTINTO" />
          </div>
          <Contador fala={fala} dur={dur} y={780} texto="ESCOLHA!" />
        </>
      )}
      {destaque && (
        <>
          <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 56, color: COR.branco, opacity: entre(p, 0.05, 0.15), textShadow: "0 6px 20px rgba(0,0,0,.6)" }}>
            ESCADA {destaque} · {NOMES[destaque]}
          </div>
          <div style={{ position: "absolute", top: 180, width: "100%", display: "flex", justifyContent: "center", gap: 30 }}>
            {TRACOS[destaque].map((t, i) => {
              const k = mola(fala * (i ? 0.65 : 0.3));
              return (
                <div key={t} style={{ transform: `scale(${k})`, opacity: Math.min(1, k * 2), fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 40, color: COR.azulEscuro, background: i ? COR.ciano : COR.amarelo, padding: "10px 26px", borderRadius: 16 }}>
                  {t}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export default Escadas;
