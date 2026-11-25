// Motor de cinema do Descifre: 3D retrô (PS1/PS2) com luz de verdade.
// Referências: pasta STILE (luz única e dura, sombra, feixes na névoa, pixel + dithering, grão)
// e Born in Lore (planos de cinema, etiqueta de idade, nome com seta, legenda).
//
// Como funciona: a cena é desenhada numa resolução baixa (1/3 do vídeo) em HDR, com sombras e
// luzes pontuais do three.js. Um passe final faz o "filme": brilho (bloom barato), tonemap ACES,
// cor reduzida com pontilhado Bayer, grão, vinheta, tarjas e fades. O CSS amplia sem suavizar.
// Tudo é função de t (core.js), então qualquer quadro sai igual em qualquer máquina.
import * as THREE from 'three';
export { THREE };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// ruído suave 1D determinístico (para câmera na mão, chama de lampião)
export const ruido = (x, s = 0) => { const i = Math.floor(x), f = x - i, h = n => { const r = rng((n + s * 7919) * 2654435761 | 0); r(); return r() * 2 - 1; }; const u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u); };

// ───────── curvas de movimento (tokens) ─────────
// câmera de cinema: aceleração longa, nunca quica
export const EASE = {
  linear: k => k,
  inout: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,           // cúbica: push-in, grua
  expo: k => k === 0 ? 0 : k === 1 ? 1 : k < .5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
  sai: k => 1 - Math.pow(1 - k, 3),                                                    // chega devagar
  entra: k => k * k * k,                                                               // sai devagar, acelera
  lento: k => 1 - Math.pow(1 - k, 1.6),                                                // drift
};

// ───────── estúdio ─────────
const SNAP = { value: new THREE.Vector2(640, 360) };
export function estudio(o = {}) {
  const V = window.VIDEO, st = document.getElementById('stage');
  const div = o.divisor ?? 3, W = Math.round(V.w / div), H = Math.round(V.h / div);
  SNAP.value.set(W, H);
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const cv = renderer.domElement; cv.className = 'layer'; cv.style.imageRendering = 'pixelated';
  st.appendChild(cv);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05060a');
  scene.fog = new THREE.Fog('#05060a', 8, 40);
  const camera = new THREE.PerspectiveCamera(o.fov ?? 35, W / H, .03, 400);

  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, samples: 0 });
  const U = {
    tCor: { value: rt.texture }, uRes: { value: new THREE.Vector2(W, H) }, uT: { value: 0 },
    uExpo: { value: 1 }, uNiveis: { value: o.niveis ?? 28 }, uDither: { value: o.dither ?? 1 },
    uGrao: { value: o.grao ?? .06 }, uVinheta: { value: o.vinheta ?? .55 }, uBloom: { value: o.bloom ?? .9 },
    uTarja: { value: o.tarja ?? 0 }, uFade: { value: 0 }, uFlash: { value: 0 },
    uTinta: { value: new THREE.Color(o.tinta ?? '#ffffff') }, uSat: { value: o.sat ?? 1 },
  };
  const final = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tCor; uniform vec2 uRes; uniform float uT, uExpo, uNiveis, uDither, uGrao, uVinheta, uBloom, uTarja, uFade, uFlash, uSat;
      uniform vec3 uTinta; varying vec2 vUv;
      const int B[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
      void main(){
        vec2 px = 1.0 / uRes;
        vec3 c = texture2D(tCor, vUv).rgb;
        // brilho: o que passa de 1.0 vaza para os vizinhos (lampião, sol, faísca)
        vec3 b = vec3(0.0);
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 0.5236; vec2 d = vec2(cos(a), sin(a));
          b += max(texture2D(tCor, vUv + d * px * 2.5).rgb - 0.9, 0.0);
          b += max(texture2D(tCor, vUv + d * px * 6.0).rgb - 0.9, 0.0) * 0.6;
        }
        c += b / 12.0 * uBloom;
        c = aces(c * uExpo) * uTinta;
        float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat);
        c = pow(c, vec3(1.0/2.2));
        // vinheta e grão (grão muda a cada quadro, como película)
        vec2 q = vUv - 0.5; c *= 1.0 - uVinheta * dot(q, q) * 1.6;
        c += (h(gl_FragCoord.xy + fract(uT * 7.13) * 91.7) - 0.5) * uGrao;
        c = mix(c, vec3(1.0), uFlash);
        c *= 1.0 - uFade;
        // cor reduzida com pontilhado Bayer 4x4
        ivec2 bq = ivec2(mod(gl_FragCoord.xy, 4.0));
        float d = (float(B[bq.x + bq.y * 4]) / 16.0 - 0.5) * uDither;
        c = floor(c * uNiveis + 0.5 + d) / uNiveis;
        // tarjas de cinema
        if (abs(vUv.y - 0.5) > 0.5 - uTarja) c = vec3(0.0);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
  }));
  final.frustumCulled = false;
  const cenaFinal = new THREE.Scene(); cenaFinal.add(final);
  const camFinal = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const S = { scene, camera, renderer, W, H, U, update: [], t: 0 };
  onTick(async t => {
    S.t = t; U.uT.value = t;
    for (const f of S.update) f(t);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(cenaFinal, camFinal);
  });
  return S;
}

// ───────── materiais (com vértice "tremido" do PS1) ─────────
function psx(m, tremor = 1) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uSnap = SNAP;
    sh.vertexShader = 'uniform vec2 uSnap;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      { vec2 g = uSnap * ${(0.5 / tremor).toFixed(3)}; gl_Position.xy = floor(gl_Position.xy / gl_Position.w * g + 0.5) / g * gl_Position.w; }`);
  };
  return m;
}
// mat({cor, mapa, rep:[x,y], brilho (0 fosco … 1 metal polido), emiss, emissI, lados, alfa})
export function mat(o = {}) {
  const base = { color: new THREE.Color(o.cor ?? '#ffffff'), side: o.lados ? THREE.DoubleSide : THREE.FrontSide };
  if (o.mapa) { const m = o.mapa.clone(); m.needsUpdate = true; if (o.rep) m.repeat.set(...o.rep); base.map = m; }
  if (o.emiss) { base.emissive = new THREE.Color(o.emiss); base.emissiveIntensity = o.emissI ?? 1; }
  if (o.alfa != null) { base.transparent = true; base.opacity = o.alfa; base.depthWrite = false; }
  const m = o.brilho ? new THREE.MeshPhongMaterial({ ...base, shininess: 10 + o.brilho * 140, specular: new THREE.Color(o.spec ?? '#ffffff').multiplyScalar(o.brilho) })
    : new THREE.MeshLambertMaterial(base);
  if (o.flat) m.flatShading = true;
  return psx(m, o.tremor);
}
export function basico(cor, o = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(cor), transparent: o.alfa != null, opacity: o.alfa ?? 1, side: o.lados ? THREE.DoubleSide : THREE.FrontSide, fog: o.fog ?? true, depthWrite: o.alfa == null, blending: o.soma ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false });
}

// ───────── texturas pintadas em pixel ─────────
export function textura(w, h, desenha, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  desenha(x, w, h, rng(o.seed ?? 1));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const cor = (h, s, l) => `hsl(${h},${s}%,${l}%)`;
// manchas de ruído (cada pixel um tom), a base de pedra, terra, madeira gasta
function salpico(x, w, h, r, tons, n = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (r() > n) continue; x.fillStyle = tons[Math.floor(r() * tons.length)]; x.fillRect(i, j, 1, 1); } }
export const TEX = {
  rocha: (s = 1) => textura(64, 64, (x, w, h, r) => {
    x.fillStyle = '#6b6258'; x.fillRect(0, 0, w, h);
    salpico(x, w, h, r, ['#5d554c', '#776d61', '#827767', '#4f4840', '#6f665a'], .9);
    x.strokeStyle = 'rgba(25,20,16,.55)'; x.lineWidth = 1;
    for (let i = 0; i < 9; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - .5) * 18; py += r() * 10; x.lineTo(Math.floor(px), Math.floor(py)); } x.stroke(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(220,205,180,.18)'; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 2, 1); }
  }, { seed: s }),
  terra: (s = 2) => textura(32, 32, (x, w, h, r) => { x.fillStyle = '#5a4430'; x.fillRect(0, 0, w, h); salpico(x, w, h, r, ['#4e3a28', '#6a503a', '#735a40', '#433222', '#7d6448'], .95); }, { seed: s }),
  cascalho: (s = 3) => textura(32, 32, (x, w, h, r) => { x.fillStyle = '#6d655b'; x.fillRect(0, 0, w, h); salpico(x, w, h, r, ['#5a534a', '#857b6e', '#9a8f7f', '#4a443d', '#6f6253'], 1); }, { seed: s }),
  grama: (s = 4) => textura(32, 32, (x, w, h, r) => { x.fillStyle = '#4c5a2a'; x.fillRect(0, 0, w, h); salpico(x, w, h, r, ['#5b6b30', '#3f4b22', '#6f7a35', '#8a8a3a', '#55632c'], .95); for (let i = 0; i < 30; i++) { x.fillStyle = '#9aa045'; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 2); } }, { seed: s }),
  madeira: (s = 5, base = '#6b4a2e') => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i++) { if (r() < .35) { x.fillStyle = r() < .5 ? 'rgba(30,15,5,.25)' : 'rgba(255,220,170,.08)'; x.fillRect(i, 0, 1, h); } }
    for (let j = 0; j < h; j += 8) { x.fillStyle = 'rgba(20,10,4,.55)'; x.fillRect(0, j, w, 1); }
    salpico(x, w, h, r, ['rgba(0,0,0,.12)', 'rgba(255,230,190,.06)'], .25);
  }, { seed: s }),
  ferro: (s = 6) => textura(16, 64, (x, w, h, r) => { x.fillStyle = '#3c3d40'; x.fillRect(0, 0, w, h); for (let j = 0; j < h; j++) { x.fillStyle = `rgba(${200 + r() * 55},${190 + r() * 50},${170},${r() * .12})`; x.fillRect(0, j, w, 1); } x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(5, 0, 2, h); salpico(x, w, h, r, ['rgba(120,60,30,.35)'], .06); }, { seed: s }),
  tecido: (base = '#5b4632', s = 7) => textura(16, 16, (x, w, h, r) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let j = 0; j < h; j += 2) { x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, j, w, 1); } salpico(x, w, h, r, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.1)'], .4); }, { seed: s }),
  tabua: (s = 8) => textura(64, 32, (x, w, h, r) => {
    const tons = ['#5e4127', '#6a4a2c', '#553a22', '#71512f'];
    for (let j = 0; j < 4; j++) { x.fillStyle = tons[j]; x.fillRect(0, j * 8, w, 8); x.fillStyle = 'rgba(15,8,2,.6)'; x.fillRect(0, j * 8 + 7, w, 1); x.fillRect(Math.floor(r() * w), j * 8, 1, 7); }
    salpico(x, w, h, r, ['rgba(0,0,0,.14)', 'rgba(255,220,170,.07)'], .3);
  }, { seed: s }),
  tijolo: (s = 9) => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = '#3b2a22'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < h; j += 4) for (let i = (j / 4) % 2 ? -4 : 0; i < w; i += 8) { x.fillStyle = cor(15 + r() * 10, 35 + r() * 15, 28 + r() * 10); x.fillRect(i + 1, j + 1, 7, 3); }
  }, { seed: s }),
};

// ───────── céu com sol e degradê (fundo de exteriores) ─────────
export function ceu(o = {}) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTopo: { value: new THREE.Color(o.topo ?? '#1b2440') }, uMeio: { value: new THREE.Color(o.meio ?? '#c0703a') }, uBaixo: { value: new THREE.Color(o.baixo ?? '#f3b56a') },
      uSol: { value: new THREE.Vector3(...(o.sol ?? [0, .08, -1])).normalize() }, uSolCor: { value: new THREE.Color(o.solCor ?? '#ffd9a0') }, uSolI: { value: o.solI ?? 4 },
      uNuvem: { value: o.nuvem ?? .5 },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`uniform vec3 uTopo, uMeio, uBaixo, uSol, uSolCor; uniform float uSolI, uNuvem; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ float y = vD.y;
        vec3 c = y > 0.12 ? mix(uMeio, uTopo, smoothstep(0.12, 0.6, y)) : mix(uBaixo, uMeio, smoothstep(-0.05, 0.12, y));
        float s = max(dot(normalize(vD), uSol), 0.0);
        c += uSolCor * (pow(s, 600.0) * uSolI * 3.0 + pow(s, 12.0) * 0.6 + pow(s, 3.0) * 0.15);
        // faixas de nuvem compridas, como nos céus pintados dos jogos da época
        vec2 q = vec2(atan(vD.x, vD.z) * 3.0, y * 22.0);
        float nv = smoothstep(0.55, 0.85, n(q * vec2(1.0, 1.0)) * 0.7 + n(q * 3.1) * 0.3) * smoothstep(0.02, 0.18, y) * (1.0 - smoothstep(0.3, 0.6, y));
        c = mix(c, mix(uBaixo, uSolCor, 0.4) * 0.9 + uTopo * 0.2, nv * uNuvem);
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const g = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 12), m); g.frustumCulled = false; g.renderOrder = -10;
  return g;
}

// ───────── terreno ondulado ─────────
export function terreno(o = {}) {
  const w = o.w ?? 80, d = o.d ?? 80, seg = o.seg ?? 48;
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, a = o.altura ?? 1.5, plano = o.plano ?? 4;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), dist = Math.hypot(x - (o.cx ?? 0), z - (o.cz ?? 0));
    const k = clamp((dist - plano) / 10);   // perto do centro fica plano (onde a ação acontece)
    p.setY(i, (Math.sin(x * .17 + 1.3) * Math.cos(z * .13) + ruido(x * .3, 3) * .5 + ruido(z * .25, 9) * .5) * a * k + (o.y ?? 0));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat({ mapa: o.mapa ?? TEX.grama(), rep: [w / 3, d / 3], cor: o.cor ?? '#ffffff' }));
  m.receiveShadow = true;
  return m;
}

// pedra deformada (bloco de rocha, paredão)
export function rocha(o = {}) {
  const geo = new THREE.BoxGeometry(o.w ?? 2, o.h ?? 2, o.d ?? 2, o.seg ?? 6, o.seg ?? 6, o.seg ?? 6);
  const p = geo.attributes.position, f = o.forca ?? .25, s = o.seed ?? 1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // ruído pela posição (nunca pelo índice, senão a malha racha nas arestas)
    const k = 1 + ruido(x * 1.7 + y * .9, s) * f + ruido(z * 1.3 - y * 1.1, s + 4) * f * .6;
    p.setXYZ(i, x * k, y * (1 + ruido(x * 2 + z, s + 8) * f * .3), z * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat({ mapa: o.mapa ?? TEX.rocha(s), rep: o.rep ?? [3, 3], cor: o.cor ?? '#ffffff', flat: o.flat ?? true }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

// ───────── luz ─────────
// lampião/abajur: luz pontual quente que tremula + brilho visível
export function luzPontual(o = {}) {
  const g = new THREE.Group();
  const l = new THREE.PointLight(o.cor ?? '#ffb060', o.forca ?? 6, o.alcance ?? 8, 1.6);
  if (o.sombra) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -.002; l.shadow.radius = 1; }
  g.add(l); g.luz = l;
  if (o.bulbo !== false) { const b = new THREE.Mesh(new THREE.SphereGeometry(o.raio ?? .05, 6, 4), basico(o.bulboCor ?? '#fff1c8')); b.material.color.multiplyScalar(o.bulboI ?? 6); g.add(b); }
  const base = l.intensity;
  g.tremula = (t, k = .12) => { l.intensity = base * (1 + ruido(t * 9, o.seed ?? 1) * k + ruido(t * 23, (o.seed ?? 1) + 3) * k * .5); };
  return g;
}
// sol ou luz de janela: direcional com sombra de verdade
export function sol(o = {}) {
  const l = new THREE.DirectionalLight(o.cor ?? '#ffcf96', o.forca ?? 3);
  l.position.set(...(o.pos ?? [8, 6, -10])); l.target.position.set(...(o.alvo ?? [0, 0, 0]));
  l.castShadow = true; l.shadow.mapSize.set(o.mapa ?? 1024, o.mapa ?? 1024); l.shadow.bias = -.0015; l.shadow.normalBias = .03;
  const e = o.area ?? 12; Object.assign(l.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: .5, far: 60 });
  const g = new THREE.Group(); g.add(l, l.target); g.luz = l;
  return g;
}
export function foco(o = {}) {   // holofote (luz de porta, janela estreita)
  const l = new THREE.SpotLight(o.cor ?? '#ffd8a0', o.forca ?? 30, o.alcance ?? 15, o.angulo ?? .5, o.penumbra ?? .5, 1.5);
  l.position.set(...(o.pos ?? [0, 4, 0])); l.target.position.set(...(o.alvo ?? [0, 0, 0]));
  l.castShadow = o.sombra !== false; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -.0008; l.shadow.radius = 1;
  const g = new THREE.Group(); g.add(l, l.target); g.luz = l;
  return g;
}

// feixe de luz na névoa (god ray): cone aditivo que some na ponta e nas bordas
export function feixe(o = {}) {
  const comp = o.comp ?? 6;
  const geo = new THREE.CylinderGeometry(o.r0 ?? .2, o.r1 ?? 1.4, comp, 24, 8, true);
  geo.translate(0, -comp / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uCor: { value: new THREE.Color(o.cor ?? '#ffcf8a') }, uI: { value: o.forca ?? .35 }, uComp: { value: comp }, uT: { value: 0 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vY = position.y; vP = position; vec4 w = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-w.xyz); gl_Position = projectionMatrix * w; }',
    fragmentShader: `uniform vec3 uCor; uniform float uI, uComp, uT; varying float vY; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ float k = clamp(-vY / uComp, 0.0, 1.0);
        float borda = pow(abs(dot(vN, vV)), 1.6);
        float listra = 0.75 + 0.25 * sin(atan(vP.x, vP.z) * 7.0 + uT * 0.4) * sin(atan(vP.x, vP.z) * 3.0 - uT * 0.25);
        float a = uI * borda * pow(1.0 - k, 1.4) * smoothstep(0.0, 0.08, k) * listra;
        gl_FragColor = vec4(uCor * a, 1.0); }`,
  });
  const f = new THREE.Mesh(geo, m); f.renderOrder = 5;
  f.posiciona = (de, para) => { const a = new THREE.Vector3(...de), b = new THREE.Vector3(...para); f.position.copy(a); f.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.sub(a).normalize()); };
  if (o.de) f.posiciona(o.de, o.para ?? [0, 0, 0]);
  f.anima = t => { m.uniforms.uT.value = t; };
  return f;
}

// poeira no ar (só aparece onde a luz bate: aditiva e pequena)
export function poeira(o = {}) {
  const n = o.n ?? 220, r = rng(o.seed ?? 5), caixa = o.caixa ?? [6, 3, 6], pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([(r() - .5) * caixa[0], r() * caixa[1], (r() - .5) * caixa[2], r() * 10]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(o.cor ?? '#ffe3b0').multiplyScalar(o.forca ?? 1.6), size: o.tam ?? 1.5, sizeAttenuation: false, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
  p.anima = t => { for (let i = 0; i < n; i++) { const [x, y, z, s] = base[i]; pos[i * 3] = x + ruido(t * .2 + s, i) * .25; pos[i * 3 + 1] = ((y + t * .05 * (.5 + s / 10)) % caixa[1]); pos[i * 3 + 2] = z + ruido(t * .17 + s, i + 99) * .25; } geo.attributes.position.needsUpdate = true; };
  p.renderOrder = 6;
  return p;
}

// ───────── pessoas de 1800 (low poly com rosto pintado) ─────────
export function rostoTex(o = {}) {
  return textura(40, 40, (x, w, h, r) => {
    const pele = o.pele ?? '#c99a7a', esc = o.peleEsc ?? '#9a6c50', cab = o.cabelo ?? '#3a2616';
    x.fillStyle = pele; x.fillRect(0, 0, w, h);
    // sombra das laterais e do queixo (volume pintado, como nos jogos de PS1)
    x.fillStyle = esc; x.fillRect(0, 0, 4, h); x.fillRect(w - 4, 0, 4, h); x.fillRect(0, h - 5, w, 5);
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(4, 0, 3, h); x.fillRect(w - 7, 0, 3, h);
    x.fillStyle = cab; x.fillRect(0, 0, w, o.testa ?? 8);                 // cabelo / testa
    x.fillRect(0, 0, 4, 22); x.fillRect(w - 4, 0, 4, 22);                  // costeletas
    // sobrancelhas
    x.fillStyle = o.sobr ?? '#2a1a0e'; x.fillRect(9, 14, 8, 2); x.fillRect(23, 14, 8, 2);
    if (o.bravo) { x.fillRect(15, 15, 2, 1); x.fillRect(23, 15, 2, 1); }
    // olhos (sombra da órbita, branco, íris)
    x.fillStyle = 'rgba(70,35,20,.35)'; x.fillRect(9, 16, 8, 5); x.fillRect(23, 16, 8, 5);
    const olho = (cx, fechado) => { if (fechado) { x.fillStyle = '#3a2216'; x.fillRect(cx - 3, 18, 7, 1); return; } x.fillStyle = '#e8ddd0'; x.fillRect(cx - 3, 17, 7, 3); x.fillStyle = o.iris ?? '#3d5a6e'; x.fillRect(cx - 1 + (o.olhar ?? 0), 17, 3, 3); x.fillStyle = '#0d0806'; x.fillRect(cx + (o.olhar ?? 0), 18, 1, 1); };
    olho(13, o.olhoE === false); olho(27, o.olhoD === false);
    // nariz e boca
    x.fillStyle = 'rgba(80,40,25,.45)'; x.fillRect(19, 19, 2, 8); x.fillRect(17, 26, 6, 2);
    x.fillStyle = o.boca ?? '#7a3f30'; x.fillRect(15, 31, 10, 2);
    if (o.abre) { x.fillStyle = '#2a0e08'; x.fillRect(16, 31, 8, 3); }
    if (o.bigode) { x.fillStyle = cab; x.fillRect(13, 28, 14, 3); }
    if (o.barba) { x.fillStyle = cab; x.fillRect(4, 30, 32, 10); x.fillStyle = pele; x.fillRect(15, 31, 10, 2); }
    salpico(x, w, h, r, ['rgba(0,0,0,.05)', 'rgba(255,230,210,.05)'], .5);
  }, { seed: o.seed ?? 11 });
}
export function pessoa(o = {}) {
  const g = new THREE.Group(), C = o.cores ?? {};
  const roupa = mat({ mapa: TEX.tecido(C.camisa ?? '#7d6a52'), cor: '#ffffff' });
  const colete = mat({ mapa: TEX.tecido(C.colete ?? '#3b3026'), cor: '#ffffff' });
  const calca = mat({ mapa: TEX.tecido(C.calca ?? '#2f2a26'), cor: '#ffffff' });
  const pele = mat({ cor: C.pele ?? '#c99a7a' });
  const bota = mat({ cor: C.bota ?? '#1d1612' });
  const add = (geo, m, x, y, z, pai = g) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; pai.add(me); return me; };
  // pernas (pivô no quadril)
  const pernas = [-.11, .11].map(x => { const q = new THREE.Group(); q.position.set(x, .92, 0); g.add(q); add(new THREE.BoxGeometry(.17, .8, .2), calca, 0, -.42, 0, q); add(new THREE.BoxGeometry(.19, .12, .3), bota, 0, -.86, .04, q); return q; });
  // tronco: camisa + colete
  const tronco = new THREE.Group(); tronco.position.y = .92; g.add(tronco);
  add(new THREE.CylinderGeometry(.24, .2, .62, 6), roupa, 0, .31, 0, tronco);
  add(new THREE.CylinderGeometry(.25, .21, .5, 6, 1, false, -1.9, 3.8), colete, 0, .27, 0, tronco);
  // braços (pivô no ombro)
  const bracos = [-1, 1].map(s => { const q = new THREE.Group(); q.position.set(s * .3, .58, 0); tronco.add(q); add(new THREE.BoxGeometry(.13, .56, .14), roupa, 0, -.27, 0, q); add(new THREE.BoxGeometry(.11, .12, .12), pele, 0, -.6, 0, q); return q; });
  // cabeça: caixa com rosto pintado na frente
  const cab = new THREE.Group(); cab.position.y = .64; tronco.add(cab);
  const faceMat = mat({ mapa: rostoTex(o.rosto ?? {}) });
  const lado = mat({ cor: C.pele ?? '#c99a7a' }), cabelo = mat({ cor: o.rosto?.cabelo ?? '#3a2616' });
  const gc = new THREE.BoxGeometry(.26, .3, .27, 3, 4, 3), pc = gc.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pc.count; i++) { v.fromBufferAttribute(pc, i); const n = v.clone().normalize().multiplyScalar(.17); v.lerp(n.multiply(new THREE.Vector3(.85, 1, .9)), .38); if (v.y < -.05) { v.x *= 1 - (-.05 - v.y) * 1.6; } pc.setXYZ(i, v.x, v.y, v.z); }
  gc.computeVertexNormals();
  const cabeca = add(gc, [lado, lado, cabelo, lado, faceMat, cabelo], 0, .16, 0, cab);
  add(new THREE.BoxGeometry(.035, .06, .04), pele, 0, .14, .135, cab);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(.025, .06, .04), pele, sx * .125, .16, 0, cab);
  add(new THREE.BoxGeometry(.09, .08, .09), pele, 0, -.02, 0, cab);   // pescoço
  if (o.chapeu !== false) {
    const ch = mat({ cor: C.chapeu ?? '#2a221c' });
    add(new THREE.CylinderGeometry(.27, .27, .025, 10), ch, 0, .33, 0, cab);
    add(new THREE.CylinderGeometry(.15, .16, .18, 8), ch, 0, .42, 0, cab);
  }
  g.partes = { pernas, tronco, bracos, cab, cabeca, face: faceMat };
  g.trocaRosto = r => { faceMat.map = rostoTex(r); faceMat.map.needsUpdate = true; faceMat.needsUpdate = true; };
  return g;
}

// ───────── a barra de ferro de Gage: 1,09 m, 3,2 cm, ponta afinada ─────────
export function barraFerro() {
  const g = new THREE.Group();
  const m = mat({ mapa: TEX.ferro(), cor: '#b9b4ab', brilho: .8, spec: '#ffe0b0' });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .78, 8), m); corpo.position.y = .39 + .3;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.016, .004, .31, 8), m); base.position.y = .155;
  g.add(corpo, base); [corpo, base].forEach(x => x.castShadow = true);
  return g;   // comprimento total ~1,09 (y de 0 a 1,09), ponta fina embaixo
}

// lampião de ferrovia: gaiola + vidro aceso + luz
export function lampiao(o = {}) {
  const g = new THREE.Group(), f = mat({ cor: '#1e1a16', brilho: .3 });
  const add = (geo, m, y) => { const me = new THREE.Mesh(geo, m); me.position.y = y; me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(.07, .08, .03, 8), f, 0);
  add(new THREE.CylinderGeometry(.055, .055, .14, 8), basico('#ffcf7a', {}), .09).material.color.multiplyScalar(4);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.008, .16, .008), f); const a = i * Math.PI / 2 + .4; b.position.set(Math.cos(a) * .065, .09, Math.sin(a) * .065); g.add(b); }
  add(new THREE.ConeGeometry(.08, .06, 8), f, .19); add(new THREE.TorusGeometry(.04, .006, 4, 10), f, .25);
  const l = luzPontual({ cor: o.cor ?? '#ffa850', forca: o.forca ?? 5, alcance: o.alcance ?? 7, sombra: o.sombra, bulbo: false, seed: o.seed });
  l.position.y = .09; g.add(l); g.tremula = l.tremula; g.luz = l.luz;
  return g;
}

// ───────── câmera: planos com movimento e "câmera na mão" ─────────
// plano: { t0, t1, de:{pos, alvo, fov}, ate:{pos, alvo, fov}, ease, mao (0..1), rolo }
export function rodaCamera(S, planos) {
  const cam = S.camera, alvo = new THREE.Vector3();
  S.update.push(t => {
    const p = planos.find(x => t >= x.t0 && t < x.t1) ?? planos[planos.length - 1];
    if (!p || !p.de) return;
    const k = (EASE[p.ease ?? 'inout'])(clamp((t - p.t0) / Math.max(.01, p.t1 - p.t0)));
    const a = p.de, b = p.ate ?? p.de;
    const pos = lerp3(a.pos, b.pos, k), al = lerp3(a.alvo, b.alvo, k);
    const m = p.mao ?? .25;   // tremor de operador: lento e pequeno
    pos[0] += ruido(t * .7, 1) * .03 * m; pos[1] += ruido(t * .6, 2) * .025 * m;
    al[0] += ruido(t * .5, 3) * .02 * m; al[1] += ruido(t * .55, 4) * .02 * m;
    cam.position.set(...pos); alvo.set(...al); cam.lookAt(alvo);
    if (p.rolo) cam.rotation.z += p.rolo;
    const fov = lerp(a.fov ?? 35, b.fov ?? a.fov ?? 35, k);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  });
}

// ───────── sobreposições nítidas (DOM): legenda, idade, nome com seta, capítulo ─────────
const css = `
.cine-ov{position:absolute;inset:0;pointer-events:none;font-family:'Poppins',sans-serif}
.cine-leg{position:absolute;left:8%;right:8%;text-align:center;color:#fff;font-weight:600;line-height:1.25;text-shadow:0 0 6px #000,0 3px 0 #000,0 0 18px rgba(0,0,0,.8)}
.cine-pill{position:absolute;background:#f4efe6;color:#141010;font-weight:800;letter-spacing:.04em;padding:.18em .7em;border-radius:.5em;box-shadow:0 4px 0 rgba(0,0,0,.45);transform-origin:left center;white-space:nowrap}
.cine-nome{position:absolute;color:#fff;font-weight:800;letter-spacing:.05em;text-shadow:0 3px 0 #000,0 0 14px rgba(0,0,0,.9);white-space:nowrap}
.cine-cap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#efe6d6;text-align:center}
.cine-cap .num{font-family:'Baskerville','Libre Baskerville',serif;font-style:italic;opacity:.85}
.cine-cap .tit{font-family:'Baskerville','Libre Baskerville',serif;letter-spacing:.08em}
.cine-marca{position:absolute;color:rgba(255,255,255,.55);font-weight:600;letter-spacing:.04em}`;
export function sobreposicoes(o = {}) {
  const V = window.VIDEO, st = document.getElementById('stage'), vert = V.h > V.w;
  const u = vert ? V.w / 1080 : V.h / 1080;   // escala: 1 = 1080 de altura (16:9) ou largura (9:16)
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  const ov = document.createElement('div'); ov.className = 'cine-ov'; st.appendChild(ov);
  const marca = document.createElement('div'); marca.className = 'cine-marca'; marca.textContent = '@descifre';
  Object.assign(marca.style, { fontSize: 26 * u + 'px', right: (vert ? 50 : 60) * u + 'px', top: (vert ? 230 : 70) * u + 'px' }); ov.appendChild(marca);
  // legenda por blocos (frases curtas), sincronizada pela palavra falada
  const leg = document.createElement('div'); leg.className = 'cine-leg';
  Object.assign(leg.style, { fontSize: (vert ? 58 : 46) * u + 'px', bottom: (vert ? 520 : (o.tarja ? 150 : 70)) * u + 'px' }); ov.appendChild(leg);
  const blocos = [];
  const pal = o.palavras ?? [];
  let atual = [];
  pal.forEach((p, i) => { atual.push(p); const fim = /[.!?…:]$/.test(p.w) || (/,$/.test(p.w) && atual.length >= 4) || atual.length >= (vert ? 5 : 8) || i === pal.length - 1; if (fim) { blocos.push({ t0: atual[0].t0 - .05, t1: atual[atual.length - 1].t1 + .25, txt: atual.map(x => x.w).join(' ') }); atual = []; } });
  blocos.forEach((b, i) => { if (blocos[i + 1]) b.t1 = Math.min(b.t1, blocos[i + 1].t0); });
  // marcadores: [{tipo:'idade'|'nome'|'cap'|'data', t0, t1, txt, x, y, seta:[dx,dy]}]
  const marcas = (o.marcas ?? []).map(m => {
    const el = document.createElement('div');
    if (m.tipo === 'cap') {
      el.className = 'cine-cap'; el.innerHTML = `${m.num ? `<div class="num" style="font-size:${40 * u}px">${m.num}</div>` : ''}<div class="tit" style="font-size:${(m.tam ?? 84) * u}px">${m.txt}</div>`;
    } else if (m.tipo === 'nome') {
      el.className = 'cine-nome'; el.style.fontSize = 44 * u + 'px';
      const [dx, dy] = m.seta ?? [120, 80];
      el.innerHTML = `${m.txt}<svg style="position:absolute;left:50%;top:100%;overflow:visible" width="1" height="1"><path d="M0 ${10 * u} Q ${dx * .2 * u} ${dy * .9 * u} ${dx * u} ${dy * u}" fill="none" stroke="#fff" stroke-width="${5 * u}" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><path d="M${dx * u} ${dy * u} l ${-22 * u} ${-4 * u} M${dx * u} ${dy * u} l ${-8 * u} ${-20 * u}" stroke="#fff" stroke-width="${5 * u}" stroke-linecap="round" opacity="0"/></svg>`;
    } else {
      el.className = 'cine-pill'; el.style.fontSize = (m.tipo === 'data' ? 34 : 38) * u + 'px'; el.textContent = m.txt;
      if (m.tipo === 'data') Object.assign(el.style, { background: 'transparent', color: '#f1e3c8', boxShadow: 'none', fontFamily: "'Baskerville','Libre Baskerville',serif", fontStyle: 'italic', fontWeight: 400, letterSpacing: '.12em', textShadow: '0 2px 0 #000,0 0 12px #000' });
    }
    if (m.tipo !== 'cap') Object.assign(el.style, { left: m.x + '%', top: m.y + '%' });
    el.style.opacity = 0; ov.appendChild(el);
    return { ...m, el };
  });
  onTick(t => {
    const b = blocos.find(x => t >= x.t0 && t < x.t1);
    leg.textContent = b ? b.txt : '';
    for (const m of marcas) {
      const vis = t >= m.t0 && t < m.t1, k = clamp((t - m.t0) / .35), sai = clamp((m.t1 - t) / .25);
      m.el.style.opacity = vis ? Math.min(k, sai) : 0;
      if (m.tipo === 'idade' || m.tipo === 'data') m.el.style.transform = `scale(${vis ? .85 + .15 * EASE.sai(k) : 1})`;
      if (m.tipo === 'cap') m.el.style.transform = `translateY(${(1 - EASE.sai(k)) * 20 * u}px)`;
      if (m.tipo === 'nome') { const [l, h] = m.el.querySelectorAll('path'); const kk = clamp((t - m.t0 - .15) / .5); l.setAttribute('stroke-dashoffset', 1 - EASE.sai(kk)); h.setAttribute('opacity', kk >= 1 ? 1 : 0); }
    }
  });
  return { ov };
}

// troca de "cenário" por plano: liga um grupo, desliga os outros, ajusta névoa e fundo
export function cenarios(S, mapa, planos) {
  S.update.unshift(t => {
    const p = planos.find(x => t >= x.t0 && t < x.t1) ?? planos[planos.length - 1];
    for (const [nome, c] of Object.entries(mapa)) c.grupo.visible = nome === p.cena;
    const c = mapa[p.cena]; if (!c) return;
    S.scene.background = c.fundo ?? null;
    if (c.nevoa) { S.scene.fog.color.set(c.nevoa[0]); S.scene.fog.near = c.nevoa[1]; S.scene.fog.far = c.nevoa[2]; }
    S.U.uExpo.value = c.expo ?? 1; S.U.uTinta.value.set(c.tinta ?? '#ffffff');
    if (c.anima) c.anima(t, p);
  });
}
