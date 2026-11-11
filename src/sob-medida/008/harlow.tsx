/**
 * 008 — As mães de pano e de arame (Harlow, 1958), em 3D.
 * Fala: "Na jaula, ele colocou duas mães de mentira. (0–.15) | Uma feita de arame, com uma mamadeira. (.15–.3)
 *        | Outra coberta de pano macio, sem comida nenhuma. (.3–.45) | Os filhotes passavam a maior parte do dia
 *        agarrados na mãe de pano. (.45–.72) | Iam até a de arame só para mamar, e voltavam correndo. (.72–1)"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import { CameraFixa, entre, Palco3D } from "../../3d/kit";
import { Jaula, Macaco } from "../../3d/pecas";
import type { PropsSobMedida, SomCena } from "../tipos";
import { useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "whoosh", p: 0.02 },
  { som: "mecanico", p: 0.16 },
  { som: "pop", p: 0.32 },
  { som: "brilho", p: 0.5 },
  { som: "passos", p: 0.76, vol: 0.4 },
  { som: "passos", p: 0.9, vol: 0.4 },
];

const XA = -1.2, XP = 1.2; // mãe de arame / mãe de pano

const MaeArame: React.FC<{ k: number }> = ({ k }) => (
  <group position={[XA, 0, -0.3]} scale={k}>
    <mesh position={[0, 0.9, 0]}>
      <cylinderGeometry args={[0.35, 0.42, 1.5, 10, 6, true]} />
      <meshStandardMaterial color="#AEB6D6" wireframe />
    </mesh>
    <mesh position={[0, 1.85, 0]}>
      <boxGeometry args={[0.5, 0.42, 0.4]} />
      <meshStandardMaterial color="#7A86B8" flatShading />
    </mesh>
    {[-0.12, 0.12].map((x) => (
      <mesh key={x} position={[x, 1.9, 0.21]}>
        <sphereGeometry args={[0.05, 6, 4]} />
        <meshBasicMaterial color="#1A1A2A" />
      </mesh>
    ))}
    {/* mamadeira */}
    <mesh position={[0, 1.15, 0.42]} rotation={[1.2, 0, 0]}>
      <cylinderGeometry args={[0.09, 0.09, 0.4, 8]} />
      <meshStandardMaterial color="#FFFFFF" transparent opacity={0.85} />
    </mesh>
    <mesh position={[0, 1.08, 0.62]} rotation={[1.2, 0, 0]}>
      <coneGeometry args={[0.06, 0.12, 8]} />
      <meshStandardMaterial color="#E0A060" />
    </mesh>
    <mesh position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.5, 0.55, 0.12, 10]} />
      <meshStandardMaterial color="#5A6390" flatShading />
    </mesh>
  </group>
);

const MaePano: React.FC<{ k: number; f: number }> = ({ k, f }) => (
  <group position={[XP, 0, -0.3]} scale={k}>
    <mesh position={[0, 0.9, 0]} scale={[1, 1, 0.9]}>
      <capsuleGeometry args={[0.42, 0.8, 6, 10]} />
      <meshStandardMaterial color="#D9A066" roughness={1} flatShading />
    </mesh>
    <mesh position={[0, 1.85, 0]}>
      <icosahedronGeometry args={[0.3, 1]} />
      <meshStandardMaterial color="#E8BE8A" roughness={1} flatShading />
    </mesh>
    {[-0.1, 0.1].map((x) => (
      <mesh key={x} position={[x, 1.9, 0.27]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial color="#1A1A2A" />
      </mesh>
    ))}
    <mesh position={[0, 1.78, 0.28]} scale={[1.2, 0.5, 0.5]}>
      <sphereGeometry args={[0.05, 8, 6]} />
      <meshBasicMaterial color="#B5524A" />
    </mesh>
    <pointLight position={[0, 1.2, 0.8]} intensity={4 + Math.sin(f / 10)} color="#FFC98A" distance={3} />
    <mesh position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.5, 0.55, 0.12, 10]} />
      <meshStandardMaterial color="#5A6390" flatShading />
    </mesh>
  </group>
);

const Harlow: React.FC<PropsSobMedida> = ({ fala }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const p = f / Math.max(1, fala);
  const kA = mola(fala * 0.15);
  const kP = mola(fala * 0.3);
  // filhote: centro -> pano (.45-.55) -> arame (.74-.8) -> mama -> volta ao pano (.88-.95)
  const xm =
    p < 0.74
      ? 0 + entre(p, 0.45, 0.55) * (XP - 0.45)
      : p < 0.88
        ? XP - 0.45 + entre(p, 0.74, 0.8) * (XA + 0.45 - (XP - 0.45))
        : XA + 0.45 + entre(p, 0.88, 0.95) * (XP - 0.45 - (XA + 0.45));
  const noPano = (p > 0.55 && p < 0.74) || p > 0.95;
  const naArame = p > 0.8 && p < 0.88;
  const ym = noPano ? 0.55 : naArame ? 0.45 : 0.06;
  const olhar = noPano ? -Math.PI / 2 : naArame ? Math.PI / 2 : 0;
  const andando = (p > 0.45 && p < 0.55) || (p > 0.74 && p < 0.8) || (p > 0.88 && p < 0.95);
  const kBarras = mola(fala * 0.58);
  const cam: [number, number, number] = [Math.sin(f * 0.008) * 0.8, 2.3, 6.4 - p * 0.5];
  const alvo: [number, number, number] = [0, 0.9, 0];
  return (
    <AbsoluteFill>
      <Palco3D camera={cam} alvo={alvo}>
        <CameraFixa posicao={cam} alvo={alvo} />
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial color="#2A3050" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[4.2, 0.04, 2.6]} />
          <meshStandardMaterial color="#C8B88E" flatShading />
        </mesh>
        <Jaula largura={4.2} altura={2.6} fundo={2.6} />
        <MaeArame k={kA} />
        <MaePano k={kP} f={f} />
        <Macaco posicao={[xm, ym, noPano || naArame ? 0.05 : 0.4]} escala={0.85} olhando={olhar} agarrado={noPano ? 1 : naArame ? 0.6 : 0} andar={andando ? 1 : 0} />
      </Palco3D>
      <div style={{ position: "absolute", top: 110, width: "100%", display: "flex", justifyContent: "center", gap: 360 }}>
        {[
          { t: "MÃE DE ARAME", s: "COM COMIDA", k: kA, c: "#AEB6D6" },
          { t: "MÃE DE PANO", s: "SEM COMIDA", k: kP, c: "#E8BE8A" },
        ].map((r) => (
          <div key={r.t} style={{ textAlign: "center", transform: `scale(${r.k})`, opacity: r.k }}>
            <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 44, color: r.c, textShadow: "0 4px 14px rgba(0,0,0,.6)" }}>{r.t}</div>
            <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 26, color: COR.branco }}>{r.s}</div>
          </div>
        ))}
      </div>
      {/* horas por dia em cada mãe */}
      <div style={{ position: "absolute", left: 80, top: 330, width: 330, opacity: kBarras, transform: `translateX(${(1 - kBarras) * -80}px)`, background: "rgba(7,15,51,.8)", borderRadius: 20, padding: 22 }}>
        <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: COR.ciano, marginBottom: 12 }}>HORAS POR DIA</div>
        {[
          { t: "Pano", h: 17, c: "#E8BE8A" },
          { t: "Arame", h: 1.5, c: "#AEB6D6" },
        ].map((b) => (
          <div key={b.t} style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 24, color: COR.branco }}>{b.t}: {b.h === 17 ? "~17 h" : "menos de 2 h"}</div>
            <div style={{ height: 22, width: `${(b.h / 18) * 100 * kBarras}%`, background: b.c, borderRadius: 11 }} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Harlow;
