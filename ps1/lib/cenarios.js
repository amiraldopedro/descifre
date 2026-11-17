// Cenários exclusivos do Descifre (um por tema) e objetos do assunto, no mesmo estilo PS1.
import * as P from './ps1.js';
import { TEX2, personagem, quadro, despertador, celular, texTexto } from './descifre.js';
const { THREE } = P;
const M = (cor, o = {}) => P.mat({ cor, ...o });
const brilho = (cor, op = .25) => P.mat({ mapa: P.TEX.disco(), cor, opac: op, aditivo: true, semLuz: true, lados: THREE.DoubleSide });
const Q = 3.4;

function canto(g, { piso, parede, sx = Q, sz = Q, h = 2.6 }) {
  const tij = P.mat({ mapa: P.TEX.tijolo(), rep: [.5, 6] }), tijB = P.mat({ mapa: P.TEX.tijolo(), rep: [4, .4] });
  g.add(P.caixa(sx, .14, sz, [tijB, tijB, piso, M('#444'), tijB, tijB], { pos: [0, -.07, 0], sx: 4, sz: 4 }));
  g.add(P.caixa(sx, h, .14, [tij, tij, tij, tij, parede, tij], { pos: [0, h / 2, -sz / 2 + .07], sx: 4, sy: 4 }));
  g.add(P.caixa(.14, h, sz, [parede, tij, tij, tij, tij, tij], { pos: [-sx / 2 + .07, h / 2, 0], sy: 4, sz: 4 }));
}
// textura com linhas desenhadas por função (cartazes, telas)
const tx = (w, h, f, o = {}) => P.textura(w, h, f, { niveis: 0, ...o });

// boneco simples de plateia/passageiro (sem rosto, de longe)
function figurante(cor, sentado = true, R = Math.random) {
  const g = new THREE.Group(), pele = M(['#e2b48c', '#c98d63', '#8d5a3b', '#f0c9a0'][Math.floor(R() * 4)]);
  g.add(P.caixa(.36, .45, .22, M(cor), { pos: [0, sentado ? .7 : 1.0, 0] }));
  g.add(P.caixa(.28, .3, .26, pele, { pos: [0, sentado ? 1.08 : 1.38, 0] }));
  g.add(P.caixa(.3, .1, .28, M(['#2b1a10', '#111', '#6b4a2a', '#9a9a9a'][Math.floor(R() * 4)]), { pos: [0, sentado ? 1.25 : 1.55, -.01] }));
  if (!sentado) for (const s of [-1, 1]) g.add(P.caixa(.13, .75, .15, M('#2d3550'), { pos: [s * .1, .38, 0] }));
  return g;
}

// ───────── laboratório do sono ─────────
export function laboratorio() {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: P.TEX.piso({ cor: '#c9d3d6', rejunte: '#9aa6aa' }), rep: [4, 4] }), parede: P.mat({ mapa: P.TEX.azulejo({ cor: '#dfe9ec', rejunte: '#a8b8bd' }), rep: [8, 6] }) });
  // cama hospitalar de metal
  const cama = new THREE.Group(); cama.position.set(-.45, 0, -.3); g.add(cama);
  const metal = M('#b8c0c6');
  for (const [x, z] of [[-.55, -1], [.55, -1], [-.55, 1], [.55, 1]]) cama.add(P.cilindro(.03, .03, .5, metal, { pos: [x, .25, z], seg: 5 }));
  cama.add(P.caixa(1.2, .08, 2.1, metal, { pos: [0, .5, 0] }));
  cama.add(P.caixa(1.12, .16, 2, M('#f4f6f8'), { pos: [0, .62, 0] }));
  cama.add(P.caixa(1.2, .7, .05, metal, { pos: [0, .85, -1.05] }));
  cama.add(P.caixa(.7, .12, .32, M('#ffffff'), { pos: [0, .76, -.78], rot: [.2, 0, 0] }));
  const lencol = P.caixa(1.16, .2, 1, P.mat({ mapa: TEX2.tecido({ cor: '#9ec9e6' }), rep: [3, 3] }), { pos: [0, .74, .45] }); cama.add(lencol);
  g.cobrir = (k, pe) => { const len = Math.max(.05, 1.5 * k); lencol.scale.z = len; lencol.position.z = 1 - len / 2 - (pe ? .3 : 0); lencol.visible = k > 0; };
  g.cobrir(.65);
  // monitor de ondas cerebrais num carrinho
  const tela = tx(64, 40, (x, w, h) => { x.fillStyle = '#04140a'; x.fillRect(0, 0, w, h); for (let k = 0; k < 3; k++) { x.strokeStyle = ['#3dff8a', '#ffd23f', '#5ad1ff'][k]; x.beginPath(); for (let i = 0; i < w; i++) { const y = 8 + k * 12 + Math.sin(i * (.4 + k * .3)) * (2 + k) + (i % 17 === 0 ? -4 : 0); i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); } });
  const carro = new THREE.Group(); carro.position.set(.75, 0, -1.0); carro.rotation.y = -.5; g.add(carro);
  carro.add(P.caixa(.6, .9, .45, M('#d7dde0'), { pos: [0, .45, 0] }));
  carro.add(P.caixa(.62, .42, .06, M('#2b2f33'), { pos: [0, 1.15, 0] }));
  carro.add(P.caixa(.56, .36, .01, P.mat({ mapa: tela, semLuz: true }), { pos: [0, 1.15, .035] }));
  // fios do capacete até o monitor
  const fio = M('#3a3a40');
  for (let i = 0; i < 4; i++) g.add(P.tubo([[-.45 + (i - 1.5) * .05, .86, -1.05], [-.1, 1.1 + i * .03, -1.2], [.4, 1.0, -1.15], [.62, .95, -.95]], .008, i % 2 ? fio : M('#c0392b'), { lados: 3 }));
  // janela de observação escura e relógio
  g.add(P.caixa(1.1, .6, .03, M('#1b2a35', { semLuz: true }), { pos: [.6, 1.65, -Q / 2 + .15] }));
  g.add(P.caixa(1.2, .7, .02, M('#9aa6aa'), { pos: [.6, 1.65, -Q / 2 + .14] }));
  const rel = despertador('02:00'); rel.scale.setScalar(.7); rel.position.set(-.6, 2.05, -Q / 2 + .2); g.add(rel); g.despertador = rel;
  // capacete de eletrodos (vai na cabeça de quem deita)
  g.pts = { deitado: [-.45, .76, .45], cabeca: [-.45, .9, -.95], cama: [-.45, .7, -.3], monitor: [.75, 1.15, -1.0], pe: [.7, 0, .7], janela: [.6, 1.65, -1.5], centro: [.2, 0, .2] };
  g.deitar = (p) => { p.position.set(...g.pts.deitado); p.rotation.set(-Math.PI / 2, 0, 0); if (!p._eletrodos) { p._eletrodos = new THREE.Group(); for (let i = 0; i < 6; i++) p._eletrodos.add(P.esfera(.03, M(i % 2 ? '#c0392b' : '#3a3a40'), { pos: [Math.cos(i) * .15, .42 + Math.sin(i * 2) * .03, Math.sin(i) * .14], seg: 4, segV: 3 })); p.cabeca.add(p._eletrodos); } p._eletrodos.visible = true; };
  return g;
}

// ───────── escritório de madrugada (copos de café, papelada) ─────────
export function madrugada() {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: P.TEX.piso({ cor: '#5b6470', rejunte: '#454c55' }), rep: [3, 3] }), parede: P.mat({ mapa: TEX2.parede({ cor: '#2f4b5a' }), rep: [4, 3] }) });
  const mesa = new THREE.Group(); mesa.position.set(.1, 0, -.2); g.add(mesa);
  mesa.add(P.caixa(1.7, .06, .75, P.mat({ mapa: TEX2.madeira({ tons: ['#5e3920', '#6b4126', '#553219', '#704428'] }), rep: [2, 1] }), { pos: [0, .76, 0] }));
  for (const s of [-1, 1]) mesa.add(P.caixa(.06, .76, .7, M('#2a2a30'), { pos: [s * .8, .38, 0] }));
  // notebook aberto virado pra pessoa (tela acesa ilumina)
  mesa.add(P.caixa(.5, .02, .34, M('#9aa0a6'), { pos: [-.15, .8, -.05] }));
  const nb = P.caixa(.5, .32, .02, M('#9aa0a6'), { pos: [-.15, .96, .12], rot: [-.25, 0, 0] }); mesa.add(nb);
  mesa.add(P.caixa(.46, .28, .005, P.mat({ mapa: TEX2.tela({ cor: '#dff1ff' }), semLuz: true }), { pos: [-.15, .96, .108], rot: [-.25, Math.PI, 0] }));
  // copos de café, papelada e luminária
  const R = P.rng(11);
  for (let i = 0; i < 7; i++) { const c = P.cilindro(.045, .035, .11, M('#f2efe8'), { pos: [.25 + R() * .5, .84, -.25 + R() * .45], seg: 7 }); mesa.add(c); mesa.add(P.cilindro(.047, .047, .02, M('#5a3a24'), { pos: [c.position.x, .9, c.position.z], seg: 7 })); }
  for (let i = 0; i < 4; i++) mesa.add(P.caixa(.3, .04 + i * .02, .22, M('#f4f4ee'), { pos: [-.62, .8 + i * .03, -.15 + i * .02], rot: [0, R() * .5, 0] }));
  const lum = new THREE.Group(); lum.position.set(-.78, .79, .25); mesa.add(lum);
  lum.add(P.cilindro(.012, .012, .45, M('#222'), { pos: [0, .22, 0], rot: [0, 0, .3], seg: 4 }));
  lum.add(P.cilindro(.06, .12, .12, M('#ffd27a', { semLuz: true }), { pos: [-.12, .45, 0], seg: 7, aberto: true, lados: THREE.DoubleSide }));
  const cad = new THREE.Group(); cad.position.set(.1, 0, -.85); g.add(cad);
  cad.add(P.caixa(.5, .08, .5, M('#24242a'), { pos: [0, .45, 0] })); cad.add(P.caixa(.5, .75, .08, M('#24242a'), { pos: [0, .88, -.24] }));
  // janela da cidade à noite
  g.add(P.caixa(1.3, 1, .02, P.mat({ mapa: TEX2.predio({ cor: '#0d1430' }), rep: [2, 1.5], semLuz: true }), { pos: [.5, 1.6, -Q / 2 + .15] }));
  g.add(P.caixa(1.4, 1.1, .015, M('#1b1b20'), { pos: [.5, 1.6, -Q / 2 + .14] }));
  const rel = despertador('03:47'); rel.scale.setScalar(.6); rel.position.set(-.9, 2.1, -Q / 2 + .2); g.add(rel); g.despertador = rel;
  g.pts = { cadeira: [.1, -.02, -.82], rosto: [.1, 1.36, -.82], mesa: [.3, .9, -.2], cafe: [.5, .88, -.1], janela: [.5, 1.6, -1.5], pe: [.8, 0, .6], centro: [0, 0, 0] };
  return g;
}

// ───────── banca de revista ─────────
export function banca() {
  const g = new THREE.Group();
  g.add(P.caixa(5, .1, 5, [M('#777'), M('#777'), P.mat({ mapa: P.TEX.concreto({ cor: '#a7a39a' }), rep: [5, 5] }), M('#555'), M('#777'), M('#777')], { pos: [0, -.05, 0], sx: 6, sz: 6 }));
  const verde = P.mat({ mapa: TEX2.parede({ cor: '#1f7a4a' }), rep: [3, 2] });
  g.add(P.caixa(2.6, 2.1, 1.3, verde, { pos: [-.3, 1.05, -1.3], sx: 3, sy: 3 }));
  g.add(P.caixa(3, .12, 1.8, M('#155c37'), { pos: [-.3, 2.2, -1.05] }));
  g.add(P.caixa(2.6, .3, .04, P.mat({ mapa: texTexto('BANCA', { w: 128, h: 32, fundo: '#ffd23f', cor: '#1b1b1b', tam: 24 }), semLuz: true }), { pos: [-.3, 2.42, -.14] }));
  // vitrine de revistas coloridas na frente
  const R = P.rng(5), capas = ['#e63946', '#ffd23f', '#3a86ff', '#2fbf5b', '#ff7f11', '#8338ec', '#ffffff'];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const cor = capas[Math.floor(R() * capas.length)];
    const capa = tx(16, 22, (x, w, h) => { x.fillStyle = cor; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.fillRect(2, 2, w - 4, 4); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(3, 9, w - 6, 8); });
    g.add(P.caixa(.3, .4, .02, P.mat({ mapa: capa }), { pos: [-1.35 + c * .38, .45 + r * .42, -.62], rot: [-.12, 0, 0] }));
  }
  // balcão e o quadro de preços ao lado
  g.add(P.caixa(.9, .9, .45, M('#155c37'), { pos: [1.45, .45, -.25] }));
  const qd = quadro(['WEB .. $59', 'PAPEL+WEB .. $125']); qd.scale.setScalar(.75); qd.position.set(2.2, 1.45, -.9); qd.rotation.y = -.6; g.add(qd); g.quadro = qd;
  g.pts = { balcao: [1.45, 0, -.75], dono: [1.45, 1.35, -.75], cliente: [.9, 0, .7], vitrine: [-.6, 1.1, -.62], quadro: [2.2, 1.45, -.9], pe: [.3, 0, .4], centro: [.4, 0, -.2] };
  return g;
}

// ───────── palco com plateia ─────────
export function palco() {
  const g = new THREE.Group();
  g.add(P.caixa(6, .1, 6, M('#1b1b22'), { pos: [0, -.05, 0] }));
  g.add(P.caixa(3.4, .5, 2, P.mat({ mapa: TEX2.madeira({ tons: ['#3a2416', '#45291a', '#331f12', '#4a2d1c'] }), rep: [4, 2] }), { pos: [0, .25, -1.4], sx: 3 }));
  const cortina = P.mat({ mapa: TEX2.tecido({ cor: '#9b1d20' }), rep: [6, 1] });
  for (let i = 0; i < 7; i++) g.add(P.caixa(.5, 2.6, .12, cortina, { pos: [-1.5 + i * .5, 1.8, -2.35 + (i % 2) * .08] }));
  for (const s of [-1, 1]) g.add(P.caixa(.6, 2.6, .5, cortina, { pos: [s * 1.6, 1.8, -1.9] }));
  // microfone
  const mic = new THREE.Group(); mic.position.set(0, .5, -.75); g.add(mic);
  mic.add(P.cilindro(.012, .012, 1.3, M('#222'), { pos: [0, .65, 0], seg: 4 }));
  mic.add(P.cilindro(.12, .12, .02, M('#222'), { seg: 8 }));
  mic.add(P.esfera(.05, M('#555'), { pos: [0, 1.32, .02], seg: 6, segV: 4 }));
  // feixe do holofote
  g.add(P.disco(.8, M('#fff2c4', { opac: .22, aditivo: true, semLuz: true }), { pos: [0, .51, -1.0], rot: [-Math.PI / 2, 0, 0], seg: 14 }));
  const feixe = P.cilindro(.15, .9, 3.2, M('#fff2c4', { opac: .07, aditivo: true, semLuz: true, lados: THREE.DoubleSide }), { pos: [0, 2.1, -1.0], seg: 10, aberto: true }); g.add(feixe);
  // plateia de costas (em fileiras)
  const R = P.rng(3), roupas = ['#3a86ff', '#e63946', '#2fbf5b', '#ffd23f', '#6c757d', '#8338ec', '#ff7f11'];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const f = figurante(roupas[Math.floor(R() * roupas.length)], true, R); f.position.set(-1.6 + c * .62 + (r % 2) * .3, 0, .6 + r * .75); f.rotation.y = Math.PI + (R() - .5) * .3; g.add(f); }
  g.pts = { mic: [0, .5, -.95], rosto: [0, 1.75, -.95], plateia: [0, 1, 1.2], pe: [0, .5, -.95], centro: [0, .5, -.6] };
  return g;
}

// ───────── ônibus lotado ─────────
export function onibus() {
  const g = new THREE.Group();
  g.add(P.caixa(2.2, .1, 6, P.mat({ mapa: P.TEX.xadrez({ cores: ['#4a4f58', '#3d424a'] }), rep: [3, 8] }), { pos: [0, -.05, 0] }));
  const lata = M('#d9dde0');
  g.add(P.caixa(.08, 2.2, 6, lata, { pos: [-1.1, 1.1, 0] }));
  g.add(P.caixa(2.2, .08, 6, M('#eef0f2'), { pos: [0, 2.2, 0] }));
  // janelas com a cidade passando
  const cidade = TEX2.predio({ cor: '#7aa6c9' });
  const jan = P.caixa(.02, .8, 5.6, P.mat({ mapa: cidade, rep: [6, 1], semLuz: true }), { pos: [-1.05, 1.45, 0] }); g.add(jan);
  // bancos azuis e barras amarelas
  const banco = M('#2457a6'), barra = M('#f2c12e');
  for (let i = 0; i < 5; i++) { const z = -2.4 + i * 1.1; g.add(P.caixa(.8, .1, .5, banco, { pos: [-.6, .5, z] })); g.add(P.caixa(.8, .6, .1, banco, { pos: [-.6, .8, z - .25] })); g.add(P.cilindro(.025, .025, 2.2, barra, { pos: [-.15, 1.1, z + .35], seg: 6 })); }
  g.add(P.cilindro(.02, .02, 6, barra, { pos: [.35, 1.95, 0], rot: [Math.PI / 2, 0, 0], seg: 6 }));
  // passageiros
  const R = P.rng(8), roupas = ['#e63946', '#2fbf5b', '#ffd23f', '#6c757d', '#ff7f11', '#3a86ff'];
  for (let i = 0; i < 4; i++) { const f = figurante(roupas[i], true, R); f.position.set(-.6, -.12, -2.4 + i * 1.1 + 1.1); f.rotation.y = Math.PI / 2; g.add(f); }
  for (let i = 0; i < 3; i++) { const f = figurante(roupas[(i + 3) % 6], false, R); f.position.set(.6, 0, [-2.4, .4, 1.8][i]); f.rotation.y = -Math.PI / 2 + (R() - .5); g.add(f); }
  g.anda = t => { jan.material.uniforms.uRep.value.set(6, 1); cidade.offset.x = (t * .25) % 1; g.position.y = Math.sin(t * 9) * .005; };
  g.pts = { banco: [-.6, -.07, -1.3], rosto: [-.6, 1.3, -1.3], pe: [.35, 0, .5], barra: [.35, 1.6, .5], centro: [0, 1, 0] };
  return g;
}

// ───────── loja de cobras (terrários) ─────────
function cobra(cor = '#7a5c2e', R = Math.random) {
  const pts = []; for (let i = 0; i < 16; i++) { const a = i * .9, r = .05 + i * .012; pts.push([Math.cos(a) * r, .03 + (i > 12 ? (i - 12) * .05 : 0), Math.sin(a) * r]); }
  return P.varrer(pts, u => .025 * Math.min(1, Math.sqrt(u / .12)) * (u > .9 ? 1.3 : 1), M(cor), { segs: 40, rad: 5 });
}
export function lojaCobras() {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: P.TEX.piso({ cor: '#a39a83', rejunte: '#7d7462' }), rep: [3, 3] }), parede: P.mat({ mapa: TEX2.parede({ cor: '#3e5a3a' }), rep: [4, 3] }) });
  const R = P.rng(4), vidro = M('#cfe8e0', { opac: .25, semLuz: true, lados: THREE.DoubleSide });
  const cores = ['#7a5c2e', '#2f7d32', '#c0392b', '#d4a017', '#333'];
  // estante de terrários na parede do fundo e na lateral
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const t = new THREE.Group(); t.position.set(-1.0 + c * .75, .35 + r * .62, -1.45); g.add(t);
    t.add(P.caixa(.66, .04, .4, M('#5a3a24'))); t.add(P.caixa(.6, .03, .34, M('#c2a36b'), { pos: [0, .03, 0] }));
    t.add(P.caixa(.66, .5, .4, vidro, { pos: [0, .27, 0] }));
    const cb = cobra(cores[(r * 3 + c) % cores.length], R); cb.position.set((R() - .5) * .2, .03, 0); cb.scale.setScalar(1.2); t.add(cb);
    t.add(P.disco(.18, brilho('#ffe9a8', .12), { pos: [0, .45, .21], seg: 8 }));
  }
  // balcão e placa
  g.add(P.caixa(1.2, .9, .5, M('#5a3a24'), { pos: [.9, .45, .3] }));
  const grande = cobra('#2f7d32', R); grande.scale.setScalar(3.2); grande.position.set(.9, .9, .3); g.add(grande); g.cobraGrande = grande;
  g.add(P.caixa(1.4, .35, .03, P.mat({ mapa: texTexto('REPTEIS', { w: 128, h: 32, fundo: '#1b1b1b', cor: '#3dff8a', tam: 22 }), semLuz: true }), { pos: [-.3, 2.3, -Q / 2 + .16] }));
  g.pts = { balcao: [.9, 0, -.3], vitrine: [-.25, 1.0, -1.45], cobra: [.9, 1.0, .3], pe: [.3, 0, .6], centro: [0, .5, -.3] };
  return g;
}

// ───────── casa assombrada ─────────
export function assombrada() {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: TEX2.madeira({ tons: ['#2a1d14', '#33241a', '#251910', '#3a291d'] }), rep: [3, 3] }), parede: P.mat({ mapa: TEX2.parede({ cor: '#3a2448' }), rep: [4, 3] }) });
  // fantasma de lençol
  const fant = new THREE.Group(); fant.position.set(-.5, 0, -.6); g.add(fant);
  fant.add(P.cilindro(.22, .45, 1.3, M('#eceaf2'), { pos: [0, .75, 0], seg: 9 }));
  fant.add(P.esfera(.24, M('#eceaf2'), { pos: [0, 1.45, 0], seg: 8, segV: 6 }));
  for (const s of [-1, 1]) fant.add(P.caixa(.06, .1, .02, M('#111'), { pos: [s * .08, 1.48, .22] }));
  fant.add(P.caixa(.08, .06, .02, M('#111'), { pos: [0, 1.36, .23] }));
  g.fantasma = fant;
  // monstro verde de braços pra frente
  const mon = personagem({ camisa: '#3b5a3a', calca: '#2b2b2b', pele: '#7fbf6a', cabelo: '#1b1b1b', estilo: 'careca' });
  mon.position.set(.8, 0, -1.1); mon.rotation.y = -.5; g.add(mon); g.monstro = mon;
  // velas e teia
  for (const [x, z] of [[1.3, .8], [-1.3, .9], [1.2, -1.3]]) { g.add(P.cilindro(.04, .04, .25, M('#f4ecd8'), { pos: [x, .125, z], seg: 6 })); g.add(P.esfera(.035, M('#ffb347', { semLuz: true }), { pos: [x, .28, z], seg: 5, segV: 4 })); g.add(P.disco(.25, brilho('#ff9a3c', .25), { pos: [x, .3, z + .02], seg: 8 })); }
  g.add(P.tubo([[-1.6, 2.5, -1.6], [-1.2, 2.2, -1.6], [-1.6, 2.0, -1.2]], .006, M('#cfcfd8'), { lados: 3 }));
  g.add(P.tubo([[-1.6, 2.4, -1.4], [-1.35, 2.3, -1.6]], .006, M('#cfcfd8'), { lados: 3 }));
  g.anima = t => { fant.position.y = Math.sin(t * 2) * .06; fant.rotation.y = Math.sin(t * .9) * .3; mon.pose('susto', t * .4); mon.expr('bravo'); };
  g.pts = { fantasma: [-.5, 1.2, -.6], monstro: [.8, 1.2, -1.1], pe: [.4, 0, .7], centro: [0, .8, -.4] };
  return g;
}

// ───────── feira de ciências (anos 60) ─────────
export function feira() {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: TEX2.madeira({ tons: ['#c79a5b', '#b88c4f', '#d1a566', '#a97f45'] }), rep: [4, 4] }), parede: P.mat({ mapa: TEX2.parede({ cor: '#d9c9a3' }), rep: [4, 3] }) });
  g.add(P.caixa(2.4, .4, .03, P.mat({ mapa: texTexto('FEIRA DE CIENCIAS 1964', { w: 256, h: 40, fundo: '#1f3b8a', cor: '#ffffff', tam: 20 }), semLuz: true }), { pos: [0, 2.2, -Q / 2 + .16] }));
  // mesa com vulcão, cartaz e o projeto do sono (relógio grande)
  const mesa = (x, z) => { const m = new THREE.Group(); m.position.set(x, 0, z); g.add(m); m.add(P.caixa(1.1, .06, .6, M('#f4f1ea'), { pos: [0, .75, 0] })); m.add(P.caixa(1.1, .7, .02, M('#f4f1ea'), { pos: [0, .4, .3] })); for (const s of [-1, 1]) m.add(P.caixa(.05, .75, .55, M('#6b6b6b'), { pos: [s * .5, .37, 0] })); return m; };
  const m1 = mesa(-.8, -1.1);
  m1.add(P.cilindro(.03, .22, .3, M('#7a4a2a'), { pos: [-.2, .93, 0], seg: 8 }));
  m1.add(P.esfera(.05, M('#ff6b1a', { semLuz: true }), { pos: [-.2, 1.09, 0], seg: 5, segV: 4 }));
  const cartaz = tx(32, 40, (x, w, h) => { x.fillStyle = '#fffbe8'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f3b8a'; x.fillRect(3, 3, w - 6, 6); x.fillStyle = '#c0392b'; x.fillRect(6, 14, 20, 12); x.fillStyle = '#333'; for (let i = 0; i < 4; i++) x.fillRect(5, 29 + i * 2.5, 22, 1); });
  const m2 = mesa(.75, -1.1);
  m2.add(P.caixa(.7, .8, .03, P.mat({ mapa: cartaz }), { pos: [0, 1.2, -.25], rot: [-.1, 0, 0] }));
  const rel = despertador('264 h'); rel.scale.setScalar(.6); rel.position.set(.15, .86, .05); m2.add(rel); g.despertador = rel;
  // público dos anos 60
  const R = P.rng(9), roupas = ['#7a5c3a', '#2f4a6b', '#8a2f2f', '#4f6b3a', '#6b6b6b'];
  for (let i = 0; i < 4; i++) { const f = figurante(roupas[i], false, R); f.position.set(-1.2 + i * .75, 0, .9 + (i % 2) * .4); f.rotation.y = Math.PI + (R() - .5) * .6; g.add(f); }
  g.pts = { mesa: [.75, .9, -1.1], vulcao: [-1.0, 1.0, -1.1], pe: [.3, 0, -.3], publico: [0, 1.1, 1.0], centro: [0, .6, -.4] };
  return g;
}

// ───────── objetos do assunto (no lugar do cérebro) ─────────
export const OBJ = {
  cafe: () => { const g = new THREE.Group(); g.add(P.cilindro(.35, .27, .8, M('#f2efe8'), { seg: 10 })); g.add(P.cilindro(.36, .36, .12, M('#5a3a24'), { pos: [0, .45, 0], seg: 10 })); g.add(P.caixa(.72, .28, .02, M('#8a5a3a'), { pos: [0, 0, .33] })); for (let i = 0; i < 3; i++) g.add(P.disco(.12, brilho('#ffffff', .12), { pos: [(i - 1) * .15, .7 + i * .12, 0], seg: 8 })); return g; },
  cobra: () => { const g = new THREE.Group(); const c = cobra('#2f7d32'); c.scale.setScalar(5); g.add(c); g.position.y = -.4; return g; },
  microfone: () => { const g = new THREE.Group(); g.add(P.cilindro(.08, .05, .7, M('#2b2b2b'), { seg: 8 })); const cab = P.esfera(.2, P.mat({ mapa: P.TEX.crivo({ cor: '#9aa0a6' }) }), { pos: [0, .5, 0], seg: 8, segV: 6 }); g.add(cab); return g; },
  revista: () => { const g = new THREE.Group(); const capa = tx(32, 44, (x, w, h) => { x.fillStyle = '#e63946'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(2, 2, w - 4, 7); x.fillStyle = '#111'; x.fillRect(4, 4, w - 8, 3); x.fillStyle = '#ffd23f'; x.fillRect(5, 14, 22, 18); x.fillStyle = '#fff'; x.fillRect(4, 36, 24, 2); }); g.add(P.caixa(.9, 1.2, .04, [M('#eee'), M('#eee'), M('#eee'), M('#eee'), P.mat({ mapa: capa }), M('#eee')])); return g; },
  fantasma: () => { const g = new THREE.Group(); g.add(P.cilindro(.25, .5, 1.1, M('#eceaf2'), { seg: 9 })); g.add(P.esfera(.27, M('#eceaf2'), { pos: [0, .6, 0], seg: 8, segV: 6 })); for (const s of [-1, 1]) g.add(P.caixa(.07, .12, .02, M('#111'), { pos: [s * .09, .64, .25] })); g.position.y = -.4; return g; },
  onda: () => { const g = new THREE.Group(); const t = tx(64, 40, (x, w, h) => { x.fillStyle = '#04140a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3dff8a'; x.beginPath(); for (let i = 0; i < w; i++) { const y = 20 + Math.sin(i * .5) * 8 * (i > 30 ? .3 : 1); i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }); g.add(P.caixa(1.3, .85, .1, M('#2b2f33'))); g.add(P.caixa(1.2, .75, .01, P.mat({ mapa: t, semLuz: true }), { pos: [0, 0, .056] })); return g; },
};

// registra no filme(): cenários, clima padrão de cada um e os objetos do assunto
import { FABRICAS, CLIMA_PADRAO, OBJETOS } from './descifre.js';
Object.assign(FABRICAS, { laboratorio, madrugada, banca, palco, onibus, lojaCobras, assombrada, feira });
Object.assign(CLIMA_PADRAO, { laboratorio: 'lab', madrugada: 'madrugada', banca: 'dia', palco: 'palco', onibus: 'dia', lojaCobras: 'loja', assombrada: 'assombrado', feira: 'feira' });
Object.assign(OBJETOS, OBJ);
