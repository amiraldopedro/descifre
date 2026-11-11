/**
 * Kit 3D low poly do Descifre.
 * Peças reutilizáveis para montar cenas 3D — as fixas (cenas3d.tsx) e as feitas
 * sob medida para a história de cada vídeo (src/sob-medida/vNNN/).
 *
 * Regras: tudo é determinístico (usa o frame do Remotion, nunca relógio),
 * flatShading para o visual low poly, cores sempre da paleta COR.
 */
import React, { createContext, useContext, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COR } from "../tema";

export const P = {
  azulEscuro: new THREE.Color(COR.azulEscuro),
  azul: new THREE.Color(COR.azul),
  azulClaro: new THREE.Color(COR.azulClaro),
  vermelho: new THREE.Color(COR.vermelho),
  ciano: new THREE.Color(COR.ciano),
  amarelo: new THREE.Color(COR.amarelo),
  branco: new THREE.Color(COR.branco),
};

/** Mola de entrada 0..1 (atraso em frames). */
export const useMola = (atraso = 0, damping = 13) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - atraso, fps, config: { damping, mass: 0.8 } });
};

/** Interpola valor entre frames, com clamp. */
export const entre = (f: number, de: number, ate: number, a = 0, b = 1) =>
  interpolate(f, [de, ate], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Ruído suave determinístico (para deformar vértices). */
const ruido3 = (x: number, y: number, z: number, seed: number) =>
  Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7 + seed * 1.3) * Math.sin(z * 2.3 + seed * 0.7);

/** Esfera low poly deformada (base de cérebro, pedras, planetas). */
export const useGeoDeformada = (raio: number, detalhe: number, forca: number, seed: number, escala: [number, number, number] = [1, 1, 1]) =>
  useMemo(() => {
    const g = new THREE.IcosahedronGeometry(raio, detalhe);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      // ruído pela POSIÇÃO (não pelo índice): vértices iguais deformam igual, sem rachaduras
      const chave = `${n.x.toFixed(3)},${n.y.toFixed(3)},${n.z.toFixed(3)}`;
      const d = 1 + ruido3(n.x, n.y, n.z, seed) * forca + (random(`d${seed}-${chave}`) - 0.5) * forca * 0.6;
      v.copy(n.multiplyScalar(raio * d));
      pos.setXYZ(i, v.x * escala[0], v.y * escala[1], v.z * escala[2]);
    }
    const ng = g.toNonIndexed();
    ng.computeVertexNormals();
    return ng;
  }, [raio, detalhe, forca, seed, escala[0], escala[1], escala[2]]);

/** Tamanho do palco: normalmente o do vídeo; no Short, uma cena deitada roda numa "telinha" 1920x1080. */
export const TamanhoPalco = createContext<{ width: number; height: number } | null>(null);
export const useTamanho = () => {
  const cfg = useVideoConfig();
  return useContext(TamanhoPalco) ?? { width: cfg.width, height: cfg.height };
};

/* ------------------------------------------------------------------ */
/* Palco: canvas + luzes + névoa na paleta. Todas as cenas 3D usam.    */
/* ------------------------------------------------------------------ */
export const Palco3D: React.FC<{
  children: React.ReactNode;
  camera?: [number, number, number];
  alvo?: [number, number, number];
  fov?: number;
  fundo?: boolean; // desenha fundo azul escuro com névoa
  sombras?: boolean; // sombras de verdade (padrão: sim)
  clima?: "noite" | "dia" | "dourado"; // cor da luz principal
}> = ({ children, camera = [0, 0, 8], alvo = [0, 0, 0], fov = 40, fundo = true, sombras = true, clima = "noite" }) => {
  const { width, height } = useTamanho();
  const chave = clima === "dia" ? "#FFF4E0" : clima === "dourado" ? "#FFC98A" : "#E8EEFF";
  const ceu = clima === "dia" ? "#9CC8FF" : COR.azulClaro;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: camera, fov }}
      shadows={sombras ? { type: THREE.PCFSoftShadowMap } : false}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      onCreated={({ camera: c }) => c.lookAt(...alvo)}
    >
      {fundo && <color attach="background" args={[COR.azulEscuro]} />}
      {fundo && <fog attach="fog" args={[COR.azulEscuro, 10, 30]} />}
      {/* luz de céu (de cima, azul) e de chão (de baixo, escura): dá volume a tudo */}
      <hemisphereLight args={[ceu, "#0A0F2A", 0.9]} />
      <ambientLight intensity={0.12} color={COR.branco} />
      {/* luz principal com sombra macia */}
      <directionalLight
        position={[6, 11, 7]}
        intensity={2.3}
        color={chave}
        castShadow={sombras}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
      />
      {/* contorno: luz ciano por trás separa os objetos do fundo */}
      <directionalLight position={[-6, 4, -8]} intensity={1.4} color={COR.ciano} />
      {/* preenchimento colorido da marca */}
      <pointLight position={[-6, -1, 4]} intensity={22} color={COR.vermelho} distance={20} />
      <pointLight position={[6, 2, -3]} intensity={18} color={COR.ciano} distance={20} />
      {sombras && <Sombras />}
      {children}
    </ThreeCanvas>
  );
};

/** Liga sombra em toda malha da cena (as de material básico, como brilhos e linhas, não projetam sombra). */
const Sombras: React.FC = () => {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const basico = (m.material as THREE.Material & { isMeshBasicMaterial?: boolean })?.isMeshBasicMaterial;
      m.castShadow = !basico;
      m.receiveShadow = !basico;
    });
  });
  return null;
};

/** Câmera em órbita lenta (coloque dentro do Palco3D). */
export const CameraOrbita: React.FC<{ raio?: number; altura?: number; velocidade?: number; aproximar?: number; alvo?: [number, number, number] }> = ({
  raio = 8,
  altura = 0.6,
  velocidade = 0.004,
  aproximar = 0,
  alvo = [0, 0, 0],
}) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const r = raio - aproximar * (f / Math.max(1, durationInFrames));
  const a = f * velocidade;
  return <CameraFixa posicao={[Math.sin(a) * r, altura, Math.cos(a) * r]} alvo={alvo} />;
};

/** Posiciona a câmera a cada frame (determinístico). */
export const CameraFixa: React.FC<{ posicao: [number, number, number]; alvo?: [number, number, number] }> = ({ posicao, alvo = [0, 0, 0] }) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...posicao);
    camera.lookAt(...alvo);
    camera.updateMatrixWorld();
  });
  return null;
};

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

/** Cérebro low poly: dois hemisférios deformados, com "faíscas" piscando. */
export const CerebroLowPoly: React.FC<{ escala?: number; cor?: string; brilho?: number; giro?: number; faiscas?: boolean }> = ({
  escala = 1,
  cor = COR.vermelho,
  brilho = 0.25,
  giro = 0.01,
  faiscas = true,
}) => {
  const f = useCurrentFrame();
  const esq = useGeoDeformada(1.25, 2, 0.12, 7, [0.85, 0.9, 1.35]);
  const dir = useGeoDeformada(1.25, 2, 0.12, 11, [0.85, 0.9, 1.35]);
  const tronco = useGeoDeformada(0.35, 1, 0.1, 3, [1, 2.2, 1]);
  const pontos = useMemo(
    () =>
      new Array(26).fill(0).map((_, i) => {
        const th = random(`th${i}`) * Math.PI * 2;
        const ph = Math.acos(2 * random(`ph${i}`) - 1);
        const lado = i % 2 ? 1 : -1;
        return {
          p: [lado * 0.95 + Math.sin(ph) * Math.cos(th) * 0.95, 0.15 + Math.cos(ph) * 1.0, Math.sin(ph) * Math.sin(th) * 1.4] as [number, number, number],
          fase: random(`fa${i}`) * 60,
        };
      }),
    []
  );
  return (
    <group scale={escala} rotation={[0.15, f * giro, 0]}>
      <mesh geometry={esq} position={[-0.95, 0.15, 0]}>
        <meshStandardMaterial color={cor} flatShading roughness={0.55} emissive={cor} emissiveIntensity={brilho} />
      </mesh>
      <mesh geometry={dir} position={[0.95, 0.15, 0]}>
        <meshStandardMaterial color={cor} flatShading roughness={0.55} emissive={cor} emissiveIntensity={brilho} />
      </mesh>
      {/* malha "científica" por cima */}
      {[esq, dir].map((g, i) => (
        <mesh key={i} geometry={g} position={[i ? 0.95 : -0.95, 0.15, 0]} scale={1.01}>
          <meshBasicMaterial color={COR.ciano} wireframe transparent opacity={0.18} />
        </mesh>
      ))}
      <mesh geometry={tronco} position={[0, -1.15, -0.4]}>
        <meshStandardMaterial color={COR.vermelhoEsc} flatShading />
      </mesh>
      {faiscas &&
        pontos.map((pt, i) => {
          const on = Math.max(0, Math.sin((f + pt.fase) / 6)) ** 6;
          return (
            <mesh key={i} position={pt.p} scale={0.06 + on * 0.1}>
              <octahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color={i % 3 ? COR.ciano : COR.amarelo} transparent opacity={0.3 + on * 0.7} />
            </mesh>
          );
        })}
    </group>
  );
};

/** Rede de neurônios 3D: nós low poly e sinais correndo pelas ligações. */
export const RedeNeural: React.FC<{ nos?: number; raio?: number; seed?: number; acender?: number }> = ({ nos = 28, raio = 3.2, seed = 1, acender = 1 }) => {
  const f = useCurrentFrame();
  const { pts, ligs } = useMemo(() => {
    const pts = new Array(nos).fill(0).map((_, i) => {
      const th = random(`n${seed}a${i}`) * Math.PI * 2;
      const ph = Math.acos(2 * random(`n${seed}b${i}`) - 1);
      const r = raio * (0.45 + random(`n${seed}c${i}`) * 0.55);
      return new THREE.Vector3(Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * 0.7, Math.sin(ph) * Math.sin(th) * r);
    });
    const ligs: [number, number][] = [];
    pts.forEach((p, i) => {
      const prox = pts
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter((x) => x.j > i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      prox.forEach((x) => ligs.push([i, x.j]));
    });
    return { pts, ligs };
  }, [nos, raio, seed]);
  const linhas = useMemo(() => {
    const arr = new Float32Array(ligs.length * 6);
    ligs.forEach(([a, b], i) => {
      arr.set([pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z], i * 6);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [ligs, pts]);
  const visiveis = Math.floor(ligs.length * acender);
  return (
    <group rotation={[0, f * 0.006, 0]}>
      <lineSegments geometry={linhas}>
        <lineBasicMaterial color={COR.ciano} transparent opacity={0.35 * acender} />
      </lineSegments>
      {pts.map((p, i) => (
        <mesh key={i} position={p} scale={(0.14 + Math.sin(f / 7 + i) * 0.03) * Math.min(1, acender * 1.5)}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 4 ? COR.azulClaro : COR.vermelho} flatShading emissive={i % 4 ? COR.azulClaro : COR.vermelho} emissiveIntensity={0.4} />
        </mesh>
      ))}
      {ligs.slice(0, visiveis).map(([a, b], i) => {
        const t = ((f + i * 11) % 45) / 45;
        const p = pts[a].clone().lerp(pts[b], t);
        return (
          <mesh key={`s${i}`} position={p} scale={0.07}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={COR.amarelo} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Túnel de partículas low poly vindo em direção à câmera (transições, ganchos). */
export const TunelParticulas: React.FC<{ quantidade?: number; velocidade?: number; raio?: number }> = ({ quantidade = 180, velocidade = 0.25, raio = 3 }) => {
  const f = useCurrentFrame();
  const ps = useMemo(
    () =>
      new Array(quantidade).fill(0).map((_, i) => ({
        a: random(`ta${i}`) * Math.PI * 2,
        r: raio * (0.7 + random(`tr${i}`) * 0.6),
        z: random(`tz${i}`) * 40,
        s: 0.05 + random(`ts${i}`) * 0.12,
        c: i % 5 === 0 ? COR.vermelho : i % 3 === 0 ? COR.amarelo : COR.ciano,
        g: random(`tg${i}`) * 6,
      })),
    [quantidade, raio]
  );
  return (
    <group>
      {ps.map((p, i) => {
        const z = ((p.z + f * velocidade) % 40) - 32;
        const a = p.a + f * 0.004;
        return (
          <mesh key={i} position={[Math.cos(a) * p.r, Math.sin(a) * p.r, z]} rotation={[f * 0.03 + p.g, f * 0.02, 0]} scale={p.s}>
            <tetrahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={p.c} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Cabeça de perfil low poly (busto) — coloque algo dentro (filho). */
export const CabecaLowPoly: React.FC<{ children?: React.ReactNode; transparente?: boolean; giro?: number }> = ({ children, transparente = true, giro = 0.004 }) => {
  const f = useCurrentFrame();
  const cranio = useGeoDeformada(1.6, 1, 0.08, 21, [0.9, 1.05, 1.0]);
  const rosto = useGeoDeformada(0.7, 1, 0.1, 5, [0.6, 1.0, 0.7]);
  const pescoco = useGeoDeformada(0.55, 1, 0.06, 9, [1, 1.6, 1]);
  const mat = (
    <meshStandardMaterial color={COR.azulClaro} flatShading transparent={transparente} opacity={transparente ? 0.32 : 1} roughness={0.4} />
  );
  return (
    <group rotation={[0, -0.5 + Math.sin(f * giro) * 0.5, 0]}>
      <mesh geometry={cranio} position={[0, 0.3, 0]}>{mat}</mesh>
      <mesh geometry={rosto} position={[0, -0.55, 1.05]}>{mat}</mesh>
      <mesh geometry={pescoco} position={[0, -1.6, -0.2]}>{mat}</mesh>
      <mesh geometry={cranio} position={[0, 0.3, 0]} scale={1.001}>
        <meshBasicMaterial color={COR.ciano} wireframe transparent opacity={0.25} />
      </mesh>
      <group position={[0, 0.35, 0]}>{children}</group>
    </group>
  );
};

/** Cristal/gema low poly (ideias, "a verdade", recompensa). */
export const Cristal: React.FC<{ posicao?: [number, number, number]; cor?: string; escala?: number; seed?: number }> = ({
  posicao = [0, 0, 0],
  cor = COR.ciano,
  escala = 1,
  seed = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <mesh position={[posicao[0], posicao[1] + Math.sin((f + seed * 20) / 18) * 0.15, posicao[2]]} rotation={[0, f * 0.02 + seed, 0.2]} scale={[escala * 0.7, escala * 1.3, escala * 0.7]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={cor} flatShading emissive={cor} emissiveIntensity={0.35} roughness={0.2} metalness={0.3} />
    </mesh>
  );
};

/** Chão low poly ondulado (cenários: "terreno da mente", paisagens). */
export const TerrenoLowPoly: React.FC<{ largura?: number; seg?: number; altura?: number; cor?: string; y?: number; cor2?: string }> = ({
  largura = 40,
  seg = 40,
  altura = 0.6,
  cor = COR.azul,
  y = -2,
  cor2,
}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(largura, largura, seg, seg);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const yy = pos.getY(i);
      pos.setZ(i, (Math.sin(x * 0.5) * Math.cos(yy * 0.4) + (random(`ter${i}`) - 0.5)) * altura);
    }
    const ng = g.toNonIndexed();
    ng.computeVertexNormals();
    // cada triângulo ganha um tom levemente diferente (visual low poly "pintado")
    const a = new THREE.Color(cor);
    const b = new THREE.Color(cor2 ?? cor).offsetHSL(0, 0, cor2 ? 0 : 0.06);
    const cores: number[] = [];
    for (let t = 0; t < ng.attributes.position.count / 3; t++) {
      const c = a.clone().lerp(b, random(`tc${t}`)).offsetHSL(0, 0, (random(`tl${t}`) - 0.5) * 0.04);
      for (let k = 0; k < 3; k++) cores.push(c.r, c.g, c.b);
    }
    ng.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
    return ng;
  }, [largura, seg, altura, cor, cor2]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} />
    </mesh>
  );
};

/** Pessoa low poly (pessoas numa história 3D). Frente = +z.
 *  cor = camisa. Opcionais: calca, pele, cabelo, estilo do cabelo, andar (0..1, balança pernas e braços),
 *  bracos ("baixo" | "cima" | "frente" | "cruzados"), sentado. */
export const PessoaLowPoly: React.FC<{
  posicao?: [number, number, number];
  cor?: string;
  escala?: number;
  balanco?: number;
  seed?: number;
  olhando?: number;
  calca?: string;
  pele?: string;
  cabelo?: string;
  estilo?: "curto" | "longo" | "careca" | "coque";
  andar?: number;
  bracos?: "baixo" | "cima" | "frente" | "cruzados";
  sentado?: boolean;
}> = ({
  posicao = [0, 0, 0],
  cor = COR.azulClaro,
  escala = 1,
  balanco = 1,
  seed = 0,
  olhando = 0,
  calca = "#2A2F4F",
  pele,
  cabelo,
  estilo,
  andar = 0,
  bracos = "baixo",
  sentado = false,
}) => {
  const f = useCurrentFrame();
  const PELES = ["#F1D3B8", "#E0B48F", "#C68E63", "#8D5A3B", "#F5DCC6"];
  const CABELOS = ["#1B1B2F", "#3B2A20", "#6B4A2E", "#C9A15B", "#D8D8E0"];
  const ESTILOS = ["curto", "longo", "curto", "coque", "careca"] as const;
  const pl = pele ?? PELES[Math.floor(random(`pele${seed}`) * PELES.length)];
  const cb = cabelo ?? CABELOS[Math.floor(random(`cab${seed}`) * CABELOS.length)];
  const es = estilo ?? ESTILOS[Math.floor(random(`est${seed}`) * ESTILOS.length)];
  const b = Math.sin((f + seed * 13) / 12) * 0.035 * balanco; // respiração/balanço
  const ciclo = Math.sin((f + seed * 7) / 4.5) * andar;
  const quique = Math.abs(Math.cos((f + seed * 7) / 4.5)) * 0.05 * andar;
  const pernaY = sentado ? 0.45 : 0;
  const brD = bracos === "cima" ? -2.6 : bracos === "frente" ? -1.3 : bracos === "cruzados" ? -1.1 : 0.08 - ciclo * 0.6;
  const brE = bracos === "cima" ? -2.6 : bracos === "frente" ? -1.3 : bracos === "cruzados" ? -1.1 : 0.08 + ciclo * 0.6;
  const mat = (c: string) => <meshStandardMaterial color={c} flatShading roughness={0.75} />;
  return (
    <group position={[posicao[0], posicao[1] + quique - pernaY, posicao[2]]} scale={escala} rotation={[0, olhando, b]}>
      {/* pernas e sapatos */}
      {[-0.13, 0.13].map((x, i) => (
        <group key={x} position={[x, 0.78, 0]} rotation={[sentado ? -1.5 : (i ? ciclo : -ciclo) * 0.7, 0, 0]}>
          <mesh position={[0, -0.36, 0]}>
            <cylinderGeometry args={[0.11, 0.09, 0.74, 6]} />
            {mat(calca)}
          </mesh>
          <mesh position={[0, -0.76, 0.06]}>
            <boxGeometry args={[0.17, 0.1, 0.3]} />
            {mat("#1A1A2A")}
          </mesh>
        </group>
      ))}
      {/* tronco (camisa) e quadril */}
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.24, 0.22, 0.2, 7]} />
        {mat(calca)}
      </mesh>
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.3, 0.23, 0.56, 7]} />
        {mat(cor)}
      </mesh>
      {/* braços */}
      {[
        [-0.36, brE],
        [0.36, brD],
      ].map(([x, rot], i) => (
        <group key={i} position={[x, 1.4, 0]} rotation={[rot, 0, (i ? -1 : 1) * (bracos === "cruzados" ? 0.9 : 0.12)]}>
          <mesh position={[0, -0.27, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.5, 6]} />
            {mat(cor)}
          </mesh>
          <mesh position={[0, -0.56, 0]}>
            <icosahedronGeometry args={[0.07, 0]} />
            {mat(pl)}
          </mesh>
        </group>
      ))}
      {/* pescoço e cabeça */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 6]} />
        {mat(pl)}
      </mesh>
      <mesh position={[0, 1.74, 0]} scale={[1, 1.1, 1]}>
        <icosahedronGeometry args={[0.24, 1]} />
        {mat(pl)}
      </mesh>
      {/* olhos (branco + pupila) e nariz: dá para ver quem olha para onde */}
      {[-0.085, 0.085].map((x) => (
        <group key={x} position={[x, 1.77, 0.21]}>
          <mesh>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshBasicMaterial color={COR.azulEscuro} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.7, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.035, 0.09, 4]} />
        {mat(pl)}
      </mesh>
      {/* cabelo */}
      {es !== "careca" && (
        <mesh position={[0, 1.83, -0.03]} scale={[1.06, es === "longo" ? 1.05 : 0.8, 1.06]}>
          <icosahedronGeometry args={[0.25, 1]} />
          {mat(cb)}
        </mesh>
      )}
      {es === "longo" && (
        <mesh position={[0, 1.55, -0.12]}>
          <boxGeometry args={[0.46, 0.45, 0.14]} />
          {mat(cb)}
        </mesh>
      )}
      {es === "coque" && (
        <mesh position={[0, 1.98, -0.12]}>
          <icosahedronGeometry args={[0.1, 0]} />
          {mat(cb)}
        </mesh>
      )}
    </group>
  );
};
