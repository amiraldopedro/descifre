// Biblioteca de estilo "low-poly PS1" para vídeos 9:16 (ou 16:9, com VIDEO={w:1920,h:1080}) renderizados quadro a quadro.
// O visual vem das limitações do PlayStation 1, reproduzidas no motor:
//   render em baixa resolução (1/4) ampliado sem suavização · vértice tremido (arredondado pro pixel)
//   textura afim (sem correção de perspectiva) · luz por vértice (Gouraud) · cor de 15 bits com
//   pontilhado Bayer 4×4 · textura pequena sem filtro · transparência de 1 bit · neblina de profundidade.
// Vértice tremido e textura afim seguem a mesma matemática do RetroPassNode oficial do three
// (que só roda em WebGPU), portada pro WebGL do motor.
import * as THREE from 'three';
export { THREE };

// PS1 não tinha gama nem espaço linear: a cor entra e sai como foi escrita
THREE.ColorManagement.enabled = false;

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const suave = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
export const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// uniformes compartilhados por todos os materiais (o palco ajusta uma vez)
export const G = {
  uRes: { value: new THREE.Vector2(270, 480) },
  uTremor: { value: 1 },
  uKeyDir: { value: new THREE.Vector3(-.45, .75, .5).normalize() },
  uKeyCor: { value: new THREE.Color('#efe9df') },
  uFillDir: { value: new THREE.Vector3(.7, .2, .4).normalize() },
  uFillCor: { value: new THREE.Color('#5d6470') },
  uAmb: { value: new THREE.Color('#5a5c62') },
  uFogCor: { value: new THREE.Color('#808080') },
  uFogPerto: { value: 1e4 }, uFogLonge: { value: 2e4 },
};

const VS = /* glsl */`
uniform vec2 uRes; uniform float uTremor, uFogPerto, uFogLonge; uniform vec2 uRep;
uniform vec3 uKeyDir, uKeyCor, uFillDir, uFillCor, uAmb;
varying vec3 vLuz; varying vec3 vAff; varying vec3 vCorV; varying float vFog;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 p = projectionMatrix * mv;
  // vértice tremido: o PS1 não tinha precisão abaixo do pixel
  if (uTremor > 0.0) { vec2 g = uRes * 0.5 / uTremor; p.xy = floor(p.xy / p.w * g + 0.5) / g * p.w; }
  gl_Position = p;
  // Gouraud: luz calculada no vértice e só interpolada na face
  vec3 N = normalize(mat3(modelMatrix) * normal);
  vLuz = uAmb + uKeyCor * max(dot(N, uKeyDir), 0.0) + uFillCor * max(dot(N, uFillDir), 0.0);
  // textura afim: uv·w e w interpolados juntos desfazem a correção de perspectiva
  vAff = vec3(uv * uRep * p.w, p.w);
  vFog = smoothstep(uFogPerto, uFogLonge, -mv.z);
  vCorV = vec3(1.0);
  #ifdef USE_COLOR
  vCorV = color;
  #endif
}`;

const FS = /* glsl */`
uniform vec3 uCor, uEmiss, uInterior, uFogCor; uniform sampler2D uMapa;
uniform float uTemMapa, uOpac, uTemInterior, uSemLuz;
varying vec3 vLuz; varying vec3 vAff; varying vec3 vCorV; varying float vFog;
void main() {
  vec2 uv = vAff.xy / vAff.z;
  vec4 tx = uTemMapa > 0.5 ? texture2D(uMapa, uv) : vec4(1.0);
  if (tx.a < 0.5) discard;                       // transparência de 1 bit (cor-chave)
  vec3 base = uCor * tx.rgb * vCorV;
  vec3 c = uSemLuz > 0.5 ? base : base * vLuz;
  if (uTemInterior > 0.5 && !gl_FrontFacing) c = uInterior * (uSemLuz > 0.5 ? 1.0 : 0.9);
  c += uEmiss;
  c = mix(c, uFogCor, vFog);
  gl_FragColor = vec4(c, uOpac);
}`;

// ───────────────────────── cenários do canal ─────────────────────────
// Padrão: "sala de teste" (céu cinza-azulado pontilhado + chão xadrez que some na névoa).
// "degrade": sem chão, pra cenas que não têm onde pisar (dentro do corpo, espaço, fluxo de dados).
export const CENARIOS = {
  sala: {
    ceu: { cores: [[0, '#6f8496'], [.5, '#aab5bd'], [1, '#c6cbce']], faixas: 16 },
    nevoa: { cor: '#c4c9cc', perto: 3.5, longe: 14 },
    chao: { passo: 1.2, cores: ['#a3abb2', '#7f888f'] },
  },
  degrade: {
    ceu: { cores: [[0, '#47535f'], [.62, '#8b959d'], [1, '#b7bcbe']], faixas: 10 },
  },
};

// ───────────────────────── palco ─────────────────────────
export function palco(o = {}) {
  const V = window.VIDEO, st = document.getElementById('stage');
  const div = o.divisor ?? 4, W = Math.round(V.w / div), H = Math.round(V.h / div);
  G.uRes.value.set(W, H); G.uTremor.value = o.tremor ?? 1;
  const L = o.luz || {};
  if (L.keyDir) G.uKeyDir.value.set(...L.keyDir).normalize();
  if (L.fillDir) G.uFillDir.value.set(...L.fillDir).normalize();
  if (L.keyCor) G.uKeyCor.value.set(L.keyCor);
  if (L.fillCor) G.uFillCor.value.set(L.fillCor);
  if (L.amb) G.uAmb.value.set(L.amb);
  // cenário: 'sala' (padrão) ou 'degrade'; fundoTex/fundo da cena passam por cima e desligam o cenário
  const cen = (o.fundoTex || o.fundo) ? null : CENARIOS[o.cenario ?? 'sala'];
  const nev = o.nevoa ?? cen?.nevoa;
  if (nev) { G.uFogCor.value.set(nev.cor); G.uFogPerto.value = nev.perto; G.uFogLonge.value = nev.longe; }

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const cv = renderer.domElement; cv.className = 'layer'; cv.style.imageRendering = 'pixelated';
  st.appendChild(cv);                                  // o CSS amplia 4× sem suavizar → 1080×1920

  const scene = new THREE.Scene();
  scene.background = o.fundoTex ?? (cen ? ceu(cen.ceu) : new THREE.Color(o.fundo ?? '#7a7a7a'));
  if (cen?.chao) scene.add(chao({ ...cen.chao, y: o.chaoY ?? 0 }));      // chaoY: altura do chão nessa cena
  const camera = new THREE.PerspectiveCamera(o.fov ?? 45, W / H, .05, 200);
  camera.position.set(...(o.cam ?? [0, 1, 5])); camera.lookAt(...(o.alvo ?? [0, 0, 0]));

  // passe final: cor de 15 bits com pontilhado Bayer 4×4, feito na resolução baixa
  const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  const final = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { tCor: { value: rt.texture }, uNiveis: { value: o.niveis ?? 31 }, uDither: { value: o.dither ?? 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tCor; uniform float uNiveis, uDither; varying vec2 vUv;
      const int B[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
      void main() {
        vec3 c = texture2D(tCor, vUv).rgb;
        ivec2 q = ivec2(mod(gl_FragCoord.xy, 4.0));
        float d = (float(B[q.x + q.y * 4]) / 16.0 - 0.5) * uDither;
        c = floor(c * uNiveis + 0.5 + d) / uNiveis;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  }));
  final.frustumCulled = false;
  const cenaFinal = new THREE.Scene(); cenaFinal.add(final);
  const camFinal = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const S = { scene, camera, renderer, W, H, update: null };
  onTick(async t => {
    if (S.update) S.update(t);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(cenaFinal, camFinal);
  });
  return S;
}

// ───────────────────────── material ─────────────────────────
// mapa · rep [u,v] · cor · emiss · opac · aditivo · semLuz · interior (cor do lado de dentro) · corVertice
export function mat(o = {}) {
  const transp = (o.opac ?? 1) < 1 || !!o.aditivo;
  return new THREE.ShaderMaterial({
    uniforms: {
      ...G,
      uCor: { value: new THREE.Color(o.cor ?? '#ffffff') },
      uMapa: { value: o.mapa ?? null }, uTemMapa: { value: o.mapa ? 1 : 0 },
      uRep: { value: new THREE.Vector2(...(o.rep ?? [1, 1])) },
      uEmiss: { value: new THREE.Color(o.emiss ?? '#000000') },
      uOpac: { value: o.opac ?? 1 },
      uInterior: { value: new THREE.Color(o.interior ?? '#000000') }, uTemInterior: { value: o.interior ? 1 : 0 },
      uSemLuz: { value: o.semLuz ? 1 : 0 },
    },
    vertexShader: VS, fragmentShader: FS,
    vertexColors: !!o.corVertice,
    side: o.lados ?? (o.interior ? THREE.DoubleSide : THREE.FrontSide),
    transparent: transp, depthWrite: !transp,
    blending: o.aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

// ───────────────────────── texturas (pequenas, sem filtro, paleta curta) ─────────────────────────
export function textura(w, h, desenha, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  desenha(x, w, h, rng(o.seed ?? 1));
  if (o.niveis !== 0) posterizar(x, w, h, o.niveis ?? 31);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
  return t;
}
function posterizar(x, w, h, n) {
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) for (let k = 0; k < 3; k++) p[i + k] = Math.round(Math.round(p[i + k] / 255 * n) / n * 255);
  x.putImageData(d, 0, 0);
}
const pontos = (x, w, h, r, n, cores) => { for (let i = 0; i < n; i++) { x.fillStyle = cores[Math.floor(r() * cores.length)]; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1 + Math.floor(r() * 2), 1); } };

export const TEX = {
  // azulejo de banheiro: 1 peça por repetição, rejunte no canto, reflexo do vidrado
  azulejo: (o = {}) => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#e6e3dc'; x.fillRect(0, 0, w, h);
    pontos(x, w, h, r, 60, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.10)', 'rgba(120,110,95,.08)']);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(4, 4, 7, 1); x.fillRect(4, 5, 1, 5);
    x.fillStyle = o.rejunte ?? '#a29c90'; x.fillRect(0, h - 2, w, 2); x.fillRect(w - 2, 0, 2, h);
    x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(0, h - 3, w - 2, 1); x.fillRect(w - 3, 0, 1, h - 2);
  }, o),
  // piso cerâmico: 2×2 peças por repetição
  piso: (o = {}) => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#bab2a3'; x.fillRect(0, 0, w, h);
    pontos(x, w, h, r, 110, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.08)', 'rgba(90,80,60,.10)']);
    x.fillStyle = o.rejunte ?? '#857e70';
    for (const k of [15, 31]) { x.fillRect(0, k, w, 1); x.fillRect(k, 0, 1, h); }
  }, { seed: 4, ...o }),
  // tijolo baiano visto no corte da parede
  tijolo: (o = {}) => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = '#968f84'; x.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let col = -1; col < 3; col++) {
      const bx = col * 16 + (row % 2 ? 8 : 0), by = row * 8;
      const tons = ['#b4613b', '#a9573a', '#bc6a42', '#9f5235'];
      x.fillStyle = tons[Math.floor(r() * tons.length)]; x.fillRect(bx + 1, by + 1, 14, 6);
      x.fillStyle = 'rgba(60,25,10,.35)'; x.fillRect(bx + 4, by + 3, 2, 2); x.fillRect(bx + 10, by + 3, 2, 2);   // furos do tijolo
    }
    pontos(x, w, h, r, 40, ['rgba(0,0,0,.12)', 'rgba(255,220,180,.10)']);
  }, { seed: 7, ...o }),
  plastico: (o = {}) => textura(16, 16, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#efefea'; x.fillRect(0, 0, w, h);
    pontos(x, w, h, r, 14, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.2)']);
  }, o),
  // crivo do chuveiro: furinhos em anéis (a tampa do cilindro já mapeia como disco)
  crivo: (o = {}) => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#e9e9e4'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#5b636b';
    for (const [rr, n] of [[4, 6], [8, 12], [12, 18]]) for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2; x.fillRect(Math.round(16 + Math.cos(a) * rr), Math.round(16 + Math.sin(a) * rr), 1, 1);
    }
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.arc(16, 16, 14.5, 0, 7); x.stroke();
  }, { niveis: 31, ...o }),
  // xadrez de "sala de teste" (as fases de depuração dos jogos 3D da época): 2×2 casas por repetição
  xadrez: (o = {}) => textura(16, 16, (x, w, h, r) => {
    const [a, b] = o.cores ?? ['#9ea6ad', '#7f888f'];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { x.fillStyle = (i + j) % 2 ? b : a; x.fillRect(i * 8, j * 8, 8, 8); }
    pontos(x, w, h, r, 26, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.07)']);
  }, o),
  // placa de concreto grande, com junta
  concreto: (o = {}) => textura(32, 32, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#b9b4aa'; x.fillRect(0, 0, w, h);
    pontos(x, w, h, r, 160, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.08)', 'rgba(80,70,60,.08)']);
    x.fillStyle = o.junta ?? '#8f8a80'; x.fillRect(0, h - 1, w, 1); x.fillRect(w - 1, 0, 1, h);
  }, { seed: 6, ...o }),
  // fumaça/brilho: disco de pixels com borda dura (transparência de 1 bit)
  disco: (o = {}) => textura(16, 16, (x) => {
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const d = Math.hypot(i - 7.5, j - 7.5) / 8; if (d > 1) continue;
      const v = Math.round(255 * (1 - d * d)); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i, j, 1, 1);
    }
  }, o),
};

// ───────────────────────── fundo blueprint (na resolução baixa) ─────────────────────────
export function blueprint(o = {}) {
  const V = window.VIDEO, div = o.divisor ?? 4, W = Math.round(V.w / div), H = Math.round(V.h / div);
  return textura(W, H, (x, w, h, r) => {
    const g = x.createRadialGradient(w * .5, h * .42, w * .05, w * .5, h * .5, h * .72);
    g.addColorStop(0, o.brilho ?? '#e9a916'); g.addColorStop(.42, o.centro ?? '#c0850a'); g.addColorStop(1, o.borda ?? '#4a3101');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const p = o.grade ?? 14, sub = o.sub ?? 5, f = o.forca ?? .24;
    x.fillStyle = o.corLinha ?? '#ffe9a8';
    for (let i = 0; i * p <= w; i++) { x.globalAlpha = i % sub ? f * .45 : f; x.fillRect(i * p, 0, 1, h); }
    for (let j = 0; j * p <= h; j++) { x.globalAlpha = j % sub ? f * .45 : f; x.fillRect(0, j * p, w, 1); }
    x.globalAlpha = f * .8; x.strokeStyle = o.corLinha ?? '#ffe9a8'; x.lineWidth = 1;
    for (let k = 0; k < 2; k++) { x.beginPath(); x.arc(w * (.2 + r() * .6), h * (.15 + r() * .7), 25 + r() * 55, 0, 7); x.stroke(); }
    x.globalAlpha = 1;
    const v = x.createRadialGradient(w * .5, h * .46, w * .2, w * .5, h * .5, h * .68);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.vinheta ?? .45})`);
    x.fillStyle = v; x.fillRect(0, 0, w, h);
  }, { seed: o.seed ?? 3, niveis: 0 });   // o pontilhado do passe final cuida da cor
}

// ───────────────────── fundos nativos de PS1 ─────────────────────
// céu em degradê feito na resolução baixa com POUCAS faixas de cor: as faixas aparentes, misturadas
// pelo pontilhado do passe final, são a assinatura dos céus e telas de seleção da época
export function ceu(o = {}) {
  const V = window.VIDEO, div = o.divisor ?? 4, W = Math.round(V.w / div), H = Math.round(V.h / div);
  const stops = o.cores ?? [[0, '#5d7286'], [.55, '#a9b4bb'], [1, '#d8d6cf']];
  return textura(W, H, (x, w, h, r) => {
    // amostra o degradê contínuo e reduz a N faixas QUE SEGUEM o próprio degradê (o tom não muda de faixa
    // pra faixa); a fronteira entre 2 faixas vizinhas é misturada com pontilhado Bayer 4×4
    const tmp = document.createElement('canvas'); tmp.width = 1; tmp.height = 256;
    const tx = tmp.getContext('2d'), g = tx.createLinearGradient(0, 0, 0, 256);
    for (const [k, c] of stops) g.addColorStop(k, c);
    tx.fillStyle = g; tx.fillRect(0, 0, 1, 256);
    const lut = tx.getImageData(0, 0, 1, 256).data, cor = t => { const i = Math.round(clamp(t) * 255) * 4; return [lut[i], lut[i + 1], lut[i + 2]]; };
    const N = o.faixas ?? 16, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const img = x.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) {
      const f = y / (h - 1) * (N - 1), k = Math.floor(f), fr = f - k;
      const c0 = cor(k / (N - 1)), c1 = cor(Math.min(N - 1, k + 1) / (N - 1));
      for (let xx = 0; xx < w; xx++) {
        const c = fr > (B4[(xx & 3) + (y & 3) * 4] + .5) / 16 ? c1 : c0, i = (y * w + xx) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    if (o.nuvens) nuvens(x, w, h, r, o.nuvens);
  }, { seed: o.seed ?? 2, niveis: 0 });
}
// nuvens de pixel com borda dura e barriga sombreada (céus do Spyro e do Crash)
function nuvens(x, w, h, r, o) {
  for (let i = 0; i < (o.n ?? 6); i++) {
    const cx = r() * w, cy = h * ((o.de ?? .08) + r() * ((o.ate ?? .42) - (o.de ?? .08))), s = (o.tam ?? 1) * (12 + r() * 16);
    for (let b = 0, nb = 4 + Math.floor(r() * 4); b < nb; b++) {
      const bx = cx + (r() - .5) * s * 2.4, by = cy + (r() - .3) * s * .45, br = Math.round(s * (.45 + r() * .4));
      for (let yy = -br; yy <= br; yy++) for (let xx = -br; xx <= br; xx++) if (xx * xx + yy * yy <= br * br) {
        x.fillStyle = yy > br * .4 ? (o.sombra ?? '#cdd5dc') : (o.cor ?? '#f4f6f7'); x.fillRect(Math.round(bx + xx), Math.round(by + yy), 1, 1);
      }
    }
  }
}
// chão grande e subdividido (a subdivisão segura o entortamento da textura afim no nível do PS1)
export function chao(o = {}) {
  const tam = o.tam ?? 60, passo = o.passo ?? 1.2;
  const m = mat({ mapa: o.mapa ?? TEX.xadrez(o), rep: [tam / passo, tam / passo] });
  return malha(new THREE.PlaneGeometry(tam, tam, o.seg ?? 48, o.seg ?? 48), m, { pos: [0, o.y ?? 0, 0], rot: [-Math.PI / 2, 0, 0] });
}

// ───────────────────────── geometria low-poly ─────────────────────────
export function malha(geo, m, o = {}) {
  const g = new THREE.Mesh(geo, m);
  if (o.pos) g.position.set(...o.pos); if (o.rot) g.rotation.set(...o.rot); if (o.esc) g.scale.set(...[].concat(o.esc, o.esc, o.esc).slice(0, 3));
  return g;
}
export const caixa = (w, h, d, m, o = {}) => malha(new THREE.BoxGeometry(w, h, d, o.sx ?? 1, o.sy ?? 1, o.sz ?? 1), m, o);
export const cilindro = (rt, rb, h, m, o = {}) => malha(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 10, o.sy ?? 1, !!o.aberto, o.ini ?? 0, o.arco ?? Math.PI * 2), m, o);
export const esfera = (r, m, o = {}) => malha(new THREE.SphereGeometry(r, o.seg ?? 8, o.segV ?? 6), m, o);
export const disco = (r, m, o = {}) => malha(new THREE.CircleGeometry(r, o.seg ?? 12), m, o);
export const tornear = (perfil, m, o = {}) => malha(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), o.seg ?? 12, o.ini ?? 0, o.arco ?? Math.PI * 2), m, o);
export const tubo = (pts, r, m, o = {}) => malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), o.seg ?? 24, r, o.lados ?? 5, false), m, o);
export function espiral({ raio = .15, de = 0, ate = .3, voltas = 5, fio = .015, lados = 5 } = {}, m, o = {}) {
  const pts = []; for (let i = 0; i <= 160; i++) { const k = i / 160, a = k * voltas * Math.PI * 2; pts.push([Math.cos(a) * raio, lerp(de, ate, k), Math.sin(a) * raio]); }
  return tubo(pts, fio, m, { seg: Math.round(voltas * 14), lados, ...o });
}
// corpo contínuo: perfil elíptico varrido ao longo de uma curva, com raio variável (cobra, mangueira, cabo).
// O "pra cima" é transportado ao longo da curva, sem torção: u = comprimento, v = volta
// (v .25 = dorso, v .75 = barriga). raio(u) → número ou {x, y}.
export function varrer(pontos, raio, m, o = {}) {
  const curva = new THREE.CatmullRomCurve3(pontos.map(p => new THREE.Vector3(...p)));
  const segs = o.segs ?? 80, rad = o.rad ?? 7;
  const pos = [], nor = [], uvs = [], idx = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(0, 1, 0), B = new THREE.Vector3(), P = new THREE.Vector3();
  curva.getTangentAt(0, T); N.addScaledVector(T, -T.dot(N)).normalize();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs; curva.getPointAt(u, P); curva.getTangentAt(u, T);
    B.crossVectors(T, N).normalize(); N.crossVectors(B, T).normalize();
    const rr = raio(u), rx = rr.x ?? rr, ry = rr.y ?? rr;
    for (let j = 0; j <= rad; j++) {
      const a = j / rad * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pos.push(P.x + B.x * c * rx + N.x * sn * ry, P.y + B.y * c * rx + N.y * sn * ry, P.z + B.z * c * rx + N.z * sn * ry);
      nor.push(B.x * c + N.x * sn, B.y * c + N.y * sn, B.z * c + N.z * sn);
      uvs.push(u, j / rad);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return malha(g, m, o);
}
// plano que sempre encara a câmera (fumaça, brilho, faísca) — sprites do jeito PS1
export const encarar = (obj, camera) => obj.quaternion.copy(camera.quaternion);

// legenda do formato: 1–3 palavras por vez, nítida por cima do PS1 (em 16:9 desce pro terço de baixo)
export function legenda(blocos, o = {}) {
  const st = document.getElementById('stage'), deitado = window.VIDEO.w > window.VIDEO.h;
  const el = document.createElement('div'); el.className = 'layer';
  el.style.cssText = `pointer-events:none;display:flex;align-items:flex-start;justify-content:center;padding-top:${o.y ?? (deitado ? 800 : 1240)}px`;
  const tx = document.createElement('div');
  tx.style.cssText = `font-family:${o.fonte ?? "'Arial Black','Helvetica Neue',Arial,sans-serif"};font-weight:900;font-size:${o.tam ?? 96}px;line-height:1.02;color:#fff;letter-spacing:-.01em;text-align:center;max-width:${deitado ? 1500 : 920}px;-webkit-text-stroke:${o.contorno ?? 16}px #0a0a0a;paint-order:stroke fill;text-shadow:0 9px 0 rgba(0,0,0,.32);transform-origin:50% 60%`;
  el.appendChild(tx); st.appendChild(el);
  const B = blocos.map((b, i) => ({ ...b, fim: b.fim ?? blocos[i + 1]?.t ?? Infinity }));
  onTick(t => {
    const b = B.find(b => t >= b.t && t < b.fim);
    tx.textContent = b ? b.txt : '';
    const k = b ? clamp((t - b.t) / .11) : 1;
    tx.style.transform = `scale(${lerp(.8, 1, 1 - (1 - k) ** 3)})`;
  });
}
