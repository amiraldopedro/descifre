// Kit do Descifre no estilo PS1: personagem com rosto em textura, cômodos em corte, objetos,
// sobreposições nítidas (título, etiquetas, legenda palavra a palavra) e o "diretor" que troca de plano
// a cada frase com a câmera sempre andando.
import * as P from './ps1.js';
const { THREE } = P;

// ───────────────────────── texturas extras ─────────────────────────
const pts = (x, w, h, r, n, cores) => { for (let i = 0; i < n; i++) { x.fillStyle = cores[i % cores.length]; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); } };
export const TEX2 = {
  madeira: (o = {}) => P.textura(32, 32, (x, w, h, r) => {
    const tons = o.tons ?? ['#9a6a42', '#8d5f3a', '#a5744a', '#875a36'];
    for (let i = 0; i < 4; i++) { x.fillStyle = tons[i]; x.fillRect(0, i * 8, w, 8); x.fillStyle = 'rgba(40,20,5,.35)'; x.fillRect(0, i * 8 + 7, w, 1); x.fillRect(((i * 13) % 28) + 2, i * 8, 1, 7); }
    pts(x, w, h, r, 70, ['rgba(60,30,10,.18)', 'rgba(255,220,170,.10)']);
  }, { seed: 9, ...o }),
  parede: (o = {}) => P.textura(16, 16, (x, w, h, r) => { x.fillStyle = o.cor ?? '#8e86b8'; x.fillRect(0, 0, w, h); pts(x, w, h, r, 30, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.07)']); }, o),
  tecido: (o = {}) => P.textura(16, 16, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#e07a5f'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,.10)'; for (let i = 0; i < 16; i += 4) x.fillRect(0, i, w, 1);
    pts(x, w, h, r, 26, ['rgba(255,255,255,.12)', 'rgba(0,0,0,.08)']);
  }, o),
  tapete: (o = {}) => P.textura(16, 16, (x, w, h) => { x.fillStyle = o.cor ?? '#d9a441'; x.fillRect(0, 0, w, h); x.fillStyle = o.borda ?? '#b5832c'; x.fillRect(0, 0, w, 1); x.fillRect(0, h - 1, w, 1); x.fillRect(0, 0, 1, h); x.fillRect(w - 1, 0, 1, h); }, o),
  janela: (o = {}) => P.textura(32, 32, (x, w, h, r) => {
    const g = x.createLinearGradient(0, 0, 0, h); (o.dia ? [['#7fc4ff', 0], ['#cfe9ff', 1]] : [['#0b1446', 0], ['#26357a', 1]]).forEach(([c, k]) => g.addColorStop(k, c));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (!o.dia) { x.fillStyle = '#fff3c4'; x.fillRect(21, 6, 4, 4); pts(x, w, h, r, 8, ['#ffffff']); }
    x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, 2); x.fillRect(0, h - 2, w, 2); x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h); x.fillRect(15, 0, 2, h); x.fillRect(0, 15, w, 2);
  }, { niveis: 0, ...o }),
  predio: (o = {}) => P.textura(32, 32, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#2b3253'; x.fillRect(0, 0, w, h);
    for (let j = 2; j < h; j += 8) for (let i = 2; i < w; i += 8) { x.fillStyle = r() > .55 ? '#ffd27a' : '#1a1f38'; x.fillRect(i, j, 4, 5); }
  }, o),
  tela: (o = {}) => P.textura(32, 64, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#58b8ff'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.75)'; for (let j = 8; j < h - 6; j += 9) x.fillRect(4, j, 10 + Math.floor(r() * 14), 4);
    x.fillStyle = '#ff4d6d'; x.fillRect(w - 9, 3, 6, 6);
  }, { niveis: 0, ...o }),
  cerebro: (o = {}) => P.textura(32, 32, (x, w, h, r) => {
    x.fillStyle = o.cor ?? '#f2a3b5'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(150,50,80,.55)'; x.lineWidth = 1;
    for (let i = 0; i < 14; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (r() - .5) * 12; py += (r() - .5) * 12; x.lineTo(px, py); } x.stroke(); }
  }, { seed: 3, ...o }),
};

// rótulo de texto em textura (despertador, placas): nítido o bastante na resolução do PS1
export function texTexto(txt, o = {}) {
  return P.textura(o.w ?? 64, o.h ?? 32, (x, w, h) => {
    x.fillStyle = o.fundo ?? '#111'; x.fillRect(0, 0, w, h);
    x.fillStyle = o.cor ?? '#ff3b3b'; x.font = `bold ${o.tam ?? 20}px monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 1);
  }, { niveis: 0 });
}

// ───────────────────────── personagem ─────────────────────────
// rosto desenhado numa textura 32×32 (como os jogos da época), trocada por expressão
function rosto(expr, o) {
  return P.textura(32, 32, (x, w, h) => {
    x.fillStyle = o.pele; x.fillRect(0, 0, w, h);
    x.fillStyle = o.cabelo; if (o.estilo !== 'careca') x.fillRect(0, 0, w, o.estilo === 'franja' ? 9 : 5);
    const E = (cx) => {   // olho
      if (expr === 'fechado' || expr === 'dormindo') { x.fillStyle = '#2a1a12'; x.fillRect(cx - 3, 15, 6, 1); x.fillRect(cx - 3, 14, 1, 1); x.fillRect(cx + 2, 14, 1, 1); return; }
      if (expr === 'feliz') { x.fillStyle = '#2a1a12'; x.fillRect(cx - 3, 14, 6, 1); x.fillRect(cx - 3, 15, 1, 1); x.fillRect(cx + 2, 15, 1, 1); return; }
      const big = expr === 'susto';
      x.fillStyle = '#ffffff'; x.fillRect(cx - (big ? 3 : 2), big ? 12 : 13, big ? 6 : 5, big ? 6 : 4);
      x.fillStyle = '#20140e'; x.fillRect(cx - 1, big ? 14 : 14, 2, 2);
    };
    E(10); E(22);
    x.fillStyle = o.cabelo;   // sobrancelhas
    const sb = { bravo: [[6, 10, 1], [26, 10, -1]], triste: [[6, 11, -1], [26, 11, 1]], susto: [[7, 9, 0], [25, 9, 0]] }[expr];
    if (sb) for (const [sx, sy, inc] of sb) for (let i = 0; i < 6; i++) x.fillRect(sx + (sx < 16 ? i : -i), sy + Math.round(inc * i / 3), 1, 1);
    else { x.fillRect(7, 10, 6, 1); x.fillRect(19, 10, 6, 1); }
    x.fillStyle = 'rgba(160,80,60,.55)'; x.fillRect(15, 17, 2, 4);   // nariz
    x.fillStyle = '#7a2a22';   // boca
    if (expr === 'feliz') { x.fillRect(12, 24, 8, 1); x.fillRect(11, 23, 1, 1); x.fillRect(20, 23, 1, 1); }
    else if (expr === 'susto') { x.fillRect(14, 23, 4, 4); }
    else if (expr === 'triste' || expr === 'bravo') { x.fillRect(12, 25, 8, 1); x.fillRect(11, 26, 1, 1); x.fillRect(20, 26, 1, 1); }
    else if (expr === 'dormindo') { x.fillRect(14, 24, 3, 2); }
    else x.fillRect(13, 24, 6, 1);
    x.fillStyle = 'rgba(230,110,110,.35)'; x.fillRect(5, 19, 4, 2); x.fillRect(23, 19, 4, 2);   // bochecha
  }, { niveis: 0 });
}

export function personagem(o = {}) {
  const c = { pele: '#e2b48c', cabelo: '#3a2416', camisa: '#4f7cff', calca: '#2d3550', sapato: '#2a2a2a', estilo: 'curto', ...o };
  const g = new THREE.Group(), corpo = new THREE.Group(); g.add(corpo);
  const mPele = P.mat({ cor: c.pele }), mCab = P.mat({ cor: c.cabelo }), mCam = P.mat({ mapa: TEX2.tecido({ cor: c.camisa }), rep: [2, 2] }), mCal = P.mat({ cor: c.calca }), mSap = P.mat({ cor: c.sapato });
  const exprs = {}; for (const e of ['normal', 'fechado', 'dormindo', 'feliz', 'susto', 'triste', 'bravo']) exprs[e] = rosto(e, c);
  const mRosto = P.mat({ mapa: exprs.normal });
  // pernas (pivô no quadril)
  const pernas = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .1, .62, 0); p.add(P.caixa(.15, .56, .17, mCal, { pos: [0, -.28, 0] })); const sap = P.caixa(.16, .08, .24, mSap, { pos: [0, -.58, .04] }); p.add(sap); p.sap = sap; corpo.add(p); return p; });
  // tronco
  const tronco = new THREE.Group(); tronco.position.y = .62; corpo.add(tronco);
  tronco.add(P.caixa(.42, .52, .25, mCam, { pos: [0, .26, 0], sy: 2 }));
  tronco.add(P.caixa(.13, .07, .13, mPele, { pos: [0, .55, 0] }));
  // cabeça grande (proporção de desenho) com o rosto na face da frente
  const cab = new THREE.Group(); cab.position.y = .58; tronco.add(cab);
  cab.add(P.caixa(.36, .38, .34, [mPele, mPele, mCab, mPele, mRosto, mCab], { pos: [0, .2, 0] }));
  if (c.estilo !== 'careca') {
    cab.add(P.caixa(.39, .1, .37, mCab, { pos: [0, .41, -.005] }));
    cab.add(P.caixa(.39, .3, .08, mCab, { pos: [0, .26, -.16] }));
    if (c.estilo === 'longo') { cab.add(P.caixa(.4, .42, .1, mCab, { pos: [0, .08, -.16] })); for (const s of [-1, 1]) cab.add(P.caixa(.06, .34, .3, mCab, { pos: [s * .2, .14, -.04] })); }
  }
  // braços (pivô no ombro) com mão
  const bracos = [-1, 1].map(s => {
    const b = new THREE.Group(); b.position.set(s * .27, .48, 0); tronco.add(b);
    b.add(P.caixa(.12, .3, .13, mCam, { pos: [0, -.13, 0] }));
    b.add(P.caixa(.1, .24, .11, mPele, { pos: [0, -.38, 0] }));
    const mao = new THREE.Group(); mao.position.set(0, -.52, 0); mao.add(P.esfera(.065, mPele, { seg: 6, segV: 4 })); b.add(mao); b.mao = mao;
    return b;
  });
  g.maoDir = bracos[1].mao; g.maoEsq = bracos[0].mao; g.cabeca = cab;
  g.expr = e => { mRosto.uniforms.uMapa.value = exprs[e] ?? exprs.normal; };
  // poses (k = 0..1 entra na pose; t = tempo para respirar/andar)
  g.pose = (nome = 'pe', t = 0) => {
    for (const p of pernas) p.rotation.set(0, 0, 0);
    for (const b of bracos) b.rotation.set(0, 0, 0);
    tronco.rotation.set(0, 0, 0); cab.rotation.set(0, 0, 0); corpo.position.set(0, 0, 0);
    for (const p of pernas) p.sap.visible = nome !== 'deitado';   // na cama, sem sapato (e o pé não fura a coberta)
    const resp = Math.sin(t * 2.2) * .02;
    tronco.scale.y = 1 + resp * .5;
    switch (nome) {
      case 'andar': { const a = Math.sin(t * 7) * .55; pernas[0].rotation.x = a; pernas[1].rotation.x = -a; bracos[0].rotation.x = -a * .8; bracos[1].rotation.x = a * .8; corpo.position.y = Math.abs(Math.sin(t * 7)) * .03; break; }
      case 'susto': bracos[0].rotation.z = -2.5; bracos[1].rotation.z = 2.5; cab.rotation.x = -.15; corpo.position.y = Math.abs(Math.sin(t * 18)) * .04; break;
      case 'pensando': bracos[1].rotation.set(-2.3, 0, .55); cab.rotation.set(.08, -.15, .1); break;
      case 'celular': bracos[0].rotation.set(-1.25, 0, -.35); bracos[1].rotation.set(-1.25, 0, .35); cab.rotation.x = .35; break;
      case 'sentado': pernas[0].rotation.x = pernas[1].rotation.x = -1.57; corpo.position.y = -.08; bracos[0].rotation.x = bracos[1].rotation.x = -.5; break;
      case 'deitado': bracos[0].rotation.z = -.12; bracos[1].rotation.z = .12; break;
      case 'tchau': bracos[1].rotation.z = 2.6 + Math.sin(t * 9) * .35; break;
      case 'bravo': bracos[0].rotation.set(0, 0, -.5); bracos[1].rotation.set(0, 0, .5); tronco.rotation.x = .12; corpo.position.y = Math.abs(Math.sin(t * 14)) * .02; break;
      case 'triste': cab.rotation.x = .35; tronco.rotation.x = .1; break;
      default: cab.rotation.y = Math.sin(t * .8) * .08;
    }
  };
  g.pose('pe');
  return g;
}

// ───────────────────────── objetos ─────────────────────────
export function cerebro() {
  const geo = new THREE.IcosahedronGeometry(.5, 2), p = geo.attributes.position, R = P.rng(5);
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const n = Math.sin(v.x * 17.1) * Math.cos(v.y * 13.7) * Math.sin(v.z * 11.3); v.multiplyScalar(1 + n * .06); v.y *= .82; v.z *= 1.18; p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  g.add(P.malha(geo, P.mat({ mapa: TEX2.cerebro(), rep: [3, 3] })));
  g.add(P.caixa(.012, .5, 1.1, P.mat({ cor: '#a9456a' }), { pos: [0, .05, 0] }));   // fissura entre os lados
  g.add(P.cilindro(.09, .06, .32, P.mat({ cor: '#e88aa0' }), { pos: [0, -.42, -.15], rot: [.4, 0, 0], seg: 6 }));
  return g;
}
export function celular(o = {}) {
  const g = new THREE.Group();
  g.add(P.caixa(.16, .3, .025, P.mat({ cor: '#1d1d22' })));
  g.add(P.caixa(.14, .26, .005, P.mat({ mapa: TEX2.tela(o), semLuz: true }), { pos: [0, 0, .014] }));
  return g;
}
export function despertador(txt = '07:00') {
  const g = new THREE.Group(), m = P.mat({ cor: '#1b1b20' });
  g.add(P.caixa(.5, .26, .2, m));
  const tela = P.caixa(.42, .18, .01, P.mat({ mapa: texTexto(txt), semLuz: true }), { pos: [0, 0, .102] }); g.add(tela);
  let atual = txt; g.trocar = t => { if (t !== atual) { tela.material.uniforms.uMapa.value = texTexto(t); atual = t; } };
  for (const s of [-1, 1]) g.add(P.esfera(.07, P.mat({ cor: '#c9a227' }), { pos: [s * .18, .17, 0], seg: 6, segV: 4 }));
  return g;
}
export function abajur(acesa = true) {
  const g = new THREE.Group();
  g.add(P.cilindro(.08, .1, .05, P.mat({ cor: '#3a3a40' }), { seg: 8 }));
  g.add(P.cilindro(.015, .015, .32, P.mat({ cor: '#3a3a40' }), { pos: [0, .18, 0], seg: 5 }));
  const cup = P.cilindro(.1, .17, .2, P.mat({ cor: '#ffe7b0', semLuz: acesa, lados: THREE.DoubleSide }), { pos: [0, .38, 0], seg: 8, aberto: true }); g.add(cup);
  g.acender = v => { cup.material.uniforms.uSemLuz.value = v ? 1 : 0; cup.material.uniforms.uCor.value.set(v ? '#ffe9b8' : '#9b8f78'); };
  return g;
}

// quadro com linhas de texto (preços, lista, placar): linhas = ['WEB  $59', ...], marca = índice destacado
export function quadro(linhas = ['A', 'B', 'C'], marca = -1) {
  const g = new THREE.Group();
  const tex = l => P.textura(192, 256, (x, w, h) => {
    x.fillStyle = '#1f3b2c'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a3a24'; x.fillRect(0, 0, w, 4); x.fillRect(0, h - 4, w, 4); x.fillRect(0, 0, 4, h); x.fillRect(w - 4, 0, 4, h);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    l.forEach((t, i) => { const [nome, preco] = t.split(/\s*\.{2,}\s*|\s{2,}/); const y = 40 + i * (180 / Math.max(1, l.length - 1));
      if (i === marca) { x.fillStyle = '#ffd23f'; x.fillRect(8, y - 30, w - 16, 62); x.fillStyle = '#1b1b1b'; } else x.fillStyle = '#f2f2e8';
      x.font = 'bold 22px monospace'; x.fillText(nome, w / 2, y - 12); if (preco) { x.font = 'bold 30px monospace'; x.fillText(preco, w / 2, y + 16); } });
  }, { niveis: 0 });
  const face = P.caixa(1.2, 1.6, .06, [P.mat({ cor: '#5a3a24' }), P.mat({ cor: '#5a3a24' }), P.mat({ cor: '#5a3a24' }), P.mat({ cor: '#5a3a24' }), P.mat({ mapa: tex(linhas), semLuz: true }), P.mat({ cor: '#5a3a24' })]);
  g.add(face);
  g.trocar = (l, m) => { marca = m ?? -1; face.material[4].uniforms.uMapa.value = tex(l); };
  return g;
}

// ───────────────────────── cômodos em corte (cada um num canto do mundo) ─────────────────────────
const Q = 3.4;   // tamanho do pedaço de cômodo
function canto(g, { piso, parede, sx = Q, sz = Q }) {
  g.add(P.caixa(sx, .14, sz, [P.mat({ mapa: P.TEX.tijolo(), rep: [4, .4] }), P.mat({ mapa: P.TEX.tijolo(), rep: [4, .4] }), piso, P.mat({ cor: '#555' }), P.mat({ mapa: P.TEX.tijolo(), rep: [4, .4] }), P.mat({ mapa: P.TEX.tijolo(), rep: [4, .4] })], { pos: [0, -.07, 0], sx: 4, sz: 4 }));
  const tij = P.mat({ mapa: P.TEX.tijolo(), rep: [.5, 6] });
  g.add(P.caixa(sx, 2.6, .14, [tij, tij, tij, tij, parede, tij], { pos: [0, 1.3, -sz / 2 + .07], sx: 4, sy: 4 }));
  g.add(P.caixa(.14, 2.6, sz, [parede, tij, tij, tij, tij, tij], { pos: [-sx / 2 + .07, 1.3, 0], sy: 4, sz: 4 }));
}

export function quarto(o = {}) {
  const g = new THREE.Group();
  const parede = P.mat({ mapa: TEX2.parede({ cor: o.parede ?? '#8f86c4' }), rep: [4, 3] });
  canto(g, { piso: P.mat({ mapa: TEX2.madeira(), rep: [3, 3] }), parede });
  // janela na parede do fundo
  const jan = P.caixa(.8, .7, .02, P.mat({ mapa: TEX2.janela(), semLuz: true }), { pos: [.75, 1.6, -Q / 2 + .15] }); g.add(jan);
  g.janela = d => { jan.material.uniforms.uMapa.value = TEX2.janela({ dia: d }); };
  // porta do banheiro (parede da esquerda), entreaberta, com a luz que vaza
  const luzPorta = P.caixa(.02, 1.9, .78, P.mat({ cor: '#fff3cf', semLuz: true }), { pos: [-Q / 2 + .15, .95, .75] }); g.add(luzPorta);
  const porta = new THREE.Group(); porta.position.set(-Q / 2 + .16, 0, .36); porta.add(P.caixa(.05, 1.9, .8, P.mat({ cor: '#e9e3d6' }), { pos: [0, .95, .4] })); porta.rotation.y = -.9; g.add(porta);
  const feixe = P.malha(new THREE.PlaneGeometry(1.1, 1.6), P.mat({ cor: '#ffe7a8', opac: .18, aditivo: true, semLuz: true, lados: THREE.DoubleSide }), { pos: [-1.1, .02, .9], rot: [-Math.PI / 2, 0, -.5] }); g.add(feixe);
  g.portaLuz = v => { luzPorta.material.uniforms.uCor.value.set(v ? '#fff3cf' : '#2a2f45'); feixe.visible = v; };
  // cama
  const cama = new THREE.Group(); cama.position.set(-.35, 0, -.35); g.add(cama);
  cama.add(P.caixa(1.25, .34, 2.1, P.mat({ mapa: TEX2.madeira({ tons: ['#6b4126', '#5e3920', '#734a2c', '#5a361e'] }), rep: [1, 2] }), { pos: [0, .17, 0] }));
  cama.add(P.caixa(1.17, .2, 2, P.mat({ cor: '#eef0f6' }), { pos: [0, .44, .02] }));
  cama.add(P.caixa(1.3, .95, .1, P.mat({ mapa: TEX2.madeira({ tons: ['#6b4126', '#5e3920', '#734a2c', '#5a361e'] }), rep: [1, 1] }), { pos: [0, .6, -1.05] }));
  cama.add(P.caixa(.7, .14, .34, P.mat({ cor: '#ffffff' }), { pos: [0, .6, -.78], rot: [.2, 0, 0] }));
  const coberta = P.caixa(1.22, .24, 1, P.mat({ mapa: TEX2.tecido({ cor: o.coberta ?? '#e8735a' }), rep: [3, 3] }), { pos: [0, .68, .5] }); cama.add(coberta);
  g.cobrir = (k, pe = false) => { const len = Math.max(.05, 1.55 * k); coberta.scale.z = len; coberta.position.z = 1 - len / 2 - (pe ? .32 : 0); coberta.visible = k > 0; };
  g.cobrir(.7);
  // criado-mudo, abajur, despertador e tapete
  g.add(P.caixa(.45, .5, .4, P.mat({ mapa: TEX2.madeira(), rep: [1, 1] }), { pos: [.62, .25, -1.15] }));
  const ab = abajur(o.abajur ?? false); ab.position.set(.55, .5, -1.18); g.add(ab); g.abajur = ab;
  const des = despertador(o.hora ?? '03:00'); des.scale.setScalar(.5); des.position.set(.75, .57, -1.08); des.rotation.y = -.4; g.add(des); g.despertador = des;
  g.add(P.caixa(1.4, .01, .9, P.mat({ mapa: TEX2.tapete(), rep: [1, 1] }), { pos: [.55, .005, .85] }));
  // pontos úteis (coordenadas locais do cômodo)
  g.pts = { deitado: [-.35, .7, .45], cabeca: [-.35, .8, -.95], cama: [-.35, .6, -.3], pe: [.6, 0, .9], porta: [-1.2, 0, .8], centro: [.3, 0, .4], criado: [.6, .6, -1.15] };
  // deita o personagem na cama, de barriga pra cima, cabeça no travesseiro
  g.deitar = (pers) => { pers.position.set(...g.pts.deitado); pers.rotation.set(-Math.PI / 2, 0, 0); };
  return g;
}

export function sala(o = {}) {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: TEX2.madeira({ tons: ['#a77b52', '#9c7049', '#b0845b', '#946a45'] }), rep: [3, 3] }), parede: P.mat({ mapa: TEX2.parede({ cor: o.parede ?? '#7fa6a0' }), rep: [4, 3] }) });
  const sofa = new THREE.Group(); sofa.position.set(-.2, 0, -.95); g.add(sofa);
  const tec = P.mat({ mapa: TEX2.tecido({ cor: o.sofa ?? '#c4553f' }), rep: [3, 1] });
  sofa.add(P.caixa(1.8, .42, .8, tec, { pos: [0, .21, 0] }));
  sofa.add(P.caixa(1.8, .55, .22, tec, { pos: [0, .7, -.3] }));
  for (const s of [-1, 1]) sofa.add(P.caixa(.2, .35, .8, tec, { pos: [s * .95, .55, 0] }));
  // TV no canto do fundo, à direita (não fica na frente da câmera)
  const tv = new THREE.Group(); tv.position.set(1.15, 0, -.7); tv.rotation.y = -1.2; g.add(tv);
  tv.add(P.caixa(.8, .45, .35, P.mat({ mapa: TEX2.madeira(), rep: [2, 1] }), { pos: [0, .22, 0] }));
  tv.add(P.caixa(.8, .48, .06, P.mat({ cor: '#18181c' }), { pos: [0, .72, 0] }));
  tv.add(P.caixa(.74, .42, .01, P.mat({ cor: '#7cc6ff', semLuz: true }), { pos: [0, .72, .035] }));
  g.add(P.caixa(.7, .28, .45, P.mat({ mapa: TEX2.madeira(), rep: [1, 1] }), { pos: [.2, .14, .1] }));
  g.add(P.cilindro(.16, .12, .35, P.mat({ cor: '#b8693f' }), { pos: [1.3, .18, -1.3], seg: 8 }));
  for (let i = 0; i < 6; i++) g.add(P.cilindro(0, .09, .6, P.mat({ cor: '#3f8f4e' }), { pos: [1.3 + Math.sin(i) * .12, .6, -1.3 + Math.cos(i) * .12], rot: [Math.cos(i) * .4, 0, Math.sin(i) * .4], seg: 4 }));
  g.add(P.caixa(1.6, .01, 1, P.mat({ mapa: TEX2.tapete({ cor: '#d8c9a8', borda: '#a8977a' }), rep: [1, 1] }), { pos: [0, .005, .1] }));
  const jan = P.caixa(.8, .7, .02, P.mat({ mapa: TEX2.janela({ dia: true }), semLuz: true }), { pos: [.8, 1.6, -Q / 2 + .15] }); g.add(jan);
  g.janela = d => { jan.material.uniforms.uMapa.value = TEX2.janela({ dia: d }); };
  g.pts = { sofa: [-.45, -.02, -.85], sofa2: [.35, -.02, -.85], rosto: [-.45, 1.2, -.85], pe: [.7, 0, .5], centro: [0, 0, .3] };
  return g;
}

export function escritorio(o = {}) {
  const g = new THREE.Group();
  canto(g, { piso: P.mat({ mapa: P.TEX.piso({ cor: '#9ea3a8', rejunte: '#7c8186' }), rep: [3, 3] }), parede: P.mat({ mapa: TEX2.parede({ cor: o.parede ?? '#c9c3b5' }), rep: [4, 3] }) });
  // mesa no meio do cômodo: a pessoa senta atrás dela, de frente pra câmera (a tela fica virada pra ela)
  const mesa = new THREE.Group(); mesa.position.set(.1, 0, -.2); g.add(mesa);
  mesa.add(P.caixa(1.6, .06, .7, P.mat({ mapa: TEX2.madeira(), rep: [2, 1] }), { pos: [0, .76, 0] }));
  for (const s of [-1, 1]) mesa.add(P.caixa(.06, .76, .65, P.mat({ cor: '#3a3a40' }), { pos: [s * .75, .38, 0] }));
  const mon = new THREE.Group(); mon.position.set(-.55, 0, .05); mon.rotation.y = .55; mesa.add(mon);
  mon.add(P.caixa(.6, .38, .04, P.mat({ cor: '#1b1b20' }), { pos: [0, 1.06, 0] }));
  mon.add(P.caixa(.54, .32, .01, P.mat({ mapa: TEX2.tela({ cor: '#3f8cff' }), rep: [1, 1], semLuz: true }), { pos: [0, 1.06, -.025] }));
  mon.add(P.caixa(.08, .14, .08, P.mat({ cor: '#1b1b20' }), { pos: [0, .86, 0] }));
  mesa.add(P.caixa(.45, .02, .15, P.mat({ cor: '#2b2b30' }), { pos: [0, .8, -.15] }));
  mesa.add(P.cilindro(.05, .04, .1, P.mat({ cor: '#ffffff' }), { pos: [.55, .84, -.1], seg: 8 }));
  const cad = new THREE.Group(); cad.position.set(.1, 0, -.85); g.add(cad);
  cad.add(P.caixa(.5, .08, .5, P.mat({ cor: '#24242a' }), { pos: [0, .45, 0] }));
  cad.add(P.caixa(.5, .7, .08, P.mat({ cor: '#24242a' }), { pos: [0, .85, -.24] }));
  cad.add(P.cilindro(.04, .04, .42, P.mat({ cor: '#555' }), { pos: [0, .22, 0], seg: 5 }));
  // estante
  for (let i = 0; i < 3; i++) g.add(P.caixa(.9, .04, .3, P.mat({ mapa: TEX2.madeira(), rep: [1, 1] }), { pos: [-1.2, 1.1 + i * .45, -1.5] }));
  const cores = ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad'];
  for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) g.add(P.caixa(.1, .3, .22, P.mat({ cor: cores[(i + k) % 5] }), { pos: [-1.55 + k * .13, 1.27 + i * .45, -1.5] }));
  g.pts = { cadeira: [.1, -.02, -.82], rosto: [.1, 1.25, -.82], mesa: [.1, .9, -.2], pe: [.8, 0, .6], centro: [0, 0, 0] };
  return g;
}

export function rua(o = {}) {
  const g = new THREE.Group();
  g.add(P.caixa(8, .1, 8, [P.mat({ cor: '#555' }), P.mat({ cor: '#555' }), P.mat({ mapa: P.TEX.concreto({ cor: '#4a4e5c', junta: '#3a3e4a' }), rep: [6, 6] }), P.mat({ cor: '#333' }), P.mat({ cor: '#555' }), P.mat({ cor: '#555' })], { pos: [0, -.05, 0], sx: 8, sz: 8 }));
  g.add(P.caixa(1.6, .14, 8, P.mat({ mapa: P.TEX.concreto({ cor: '#8a8d96' }), rep: [2, 8] }), { pos: [-2.6, .07, 0], sz: 6 }));
  for (const [x, z, h] of [[-3.6, -2.5, 4.5], [-3.6, 1, 3.2], [3.5, -2.8, 5.2], [3.5, .8, 3.8]]) g.add(P.caixa(1.8, h, 2.6, P.mat({ mapa: TEX2.predio(), rep: [2, h / 1.6] }), { pos: [x, h / 2, z], sy: 3 }));
  const poste = new THREE.Group(); poste.position.set(-1.9, 0, -.6); g.add(poste);
  poste.add(P.cilindro(.04, .06, 3, P.mat({ cor: '#2b2b2b' }), { pos: [0, 1.5, 0], seg: 6 }));
  poste.add(P.caixa(.6, .05, .05, P.mat({ cor: '#2b2b2b' }), { pos: [.28, 3, 0] }));
  poste.add(P.esfera(.12, P.mat({ cor: '#ffcf7a', semLuz: true }), { pos: [.55, 2.92, 0], seg: 6, segV: 4 }));
  const halo = P.disco(.6, P.mat({ mapa: P.TEX.disco(), cor: '#ffb04a', opac: .25, aditivo: true, semLuz: true, lados: THREE.DoubleSide }), { pos: [.55, 2.92, .05], seg: 10 }); poste.add(halo); g.halo = halo;
  g.add(P.disco(1.2, P.mat({ cor: '#ffcf7a', opac: .12, aditivo: true, semLuz: true }), { pos: [-1.35, .012, -.6], rot: [-Math.PI / 2, 0, 0], seg: 14 }));
  g.pts = { calcada: [-2.4, .14, 1.2], meio: [0, 0, 0], poste: [-1.6, 0, -.3] };
  return g;
}

// "vazio": nada além do degradê escuro, pra objetos (cérebro, relógio, celular) em destaque
export function vazio() { const g = new THREE.Group(); g.pts = { centro: [0, 1, 0] }; return g; }

// ───────────────────────── sobreposições nítidas (DOM) ─────────────────────────
function camada(css = '') { const el = document.createElement('div'); el.className = 'layer'; el.style.cssText = 'pointer-events:none;' + css; document.getElementById('stage').appendChild(el); return el; }
const CONT = "-webkit-text-stroke:12px #0a0a0a;paint-order:stroke fill;text-shadow:0 7px 0 rgba(0,0,0,.35)";
const FONTE = "'Descifre','Arial Black','Helvetica Neue',Arial,sans-serif";

// título do gancho no topo (some depois de ~1,7 s)
export function titulo(txt, sub, ate = 1.8) {
  const el = camada('display:flex;flex-direction:column;align-items:center;padding-top:150px;text-align:center');
  el.innerHTML = `<div style="font-family:${FONTE};font-weight:900;font-size:118px;color:#ff3b3b;${CONT};line-height:1">${txt}</div>` +
    (sub ? `<div style="font-family:${FONTE};font-weight:900;font-size:54px;color:#fff;${CONT.replace('12px', '9px')};max-width:900px;line-height:1.05;margin-top:14px">${sub}</div>` : '');
  onTick(t => { const k = t < ate ? 1 : P.clamp(1 - (t - ate) / .2); el.style.opacity = k; el.style.transform = `scale(${P.lerp(.9, 1, P.clamp(t / .12))})`; });
}

// legenda palavra a palavra (1 palavra; 2 se a segunda for curta)
export function legendaPalavras(pal, o = {}) {
  const el = camada(`display:flex;justify-content:center;align-items:flex-start;padding-top:${o.y ?? 1180}px`);
  const tx = document.createElement('div'); el.appendChild(tx);
  tx.style.cssText = `font-family:${FONTE};font-weight:900;font-size:${o.tam ?? 92}px;color:#fff;${CONT};text-transform:${o.caixa ?? 'none'};text-align:center;max-width:960px;line-height:1`;
  const B = []; for (let i = 0; i < pal.length; i++) { const a = pal[i], b = pal[i + 1]; if (b && b.w.length <= 3 && a.w.length <= 6 && !/[.!?,]$/.test(a.w)) { B.push({ t: a.t0, w: a.w + ' ' + b.w, fim: b.t1 }); i++; } else B.push({ t: a.t0, w: a.w, fim: a.t1 }); }
  for (let i = 0; i < B.length; i++) B[i].fim = Math.max(B[i].fim, Math.min(B[i + 1]?.t ?? B[i].fim + .4, B[i].fim + .35));
  const destaque = new Set((o.destaque ?? []).map(s => s.toLowerCase()));
  onTick(t => {
    const b = B.find(b => t >= b.t && t < b.fim);
    tx.textContent = b ? b.w.replace(/[.,;:]$/, '') : '';
    const lim = b && destaque.has(b.w.toLowerCase().replace(/[^\p{L}\d ]/gu, ''));
    tx.style.color = lim ? '#ffd23f' : '#fff';
    const k = b ? P.clamp((t - b.t) / .07) : 1; tx.style.opacity = k; tx.style.transform = `scale(${P.lerp(.86, 1, 1 - (1 - k) ** 3)})`;
  });
}

// etiqueta (pílula) no alto: { t0, t1, txt, cor: 'verde'|'vermelho'|'amarelo'|'branco', icone: '✓'|'✗'|'!' }
export function etiquetas(lista) {
  const el = camada('display:flex;justify-content:center;align-items:flex-start;padding-top:330px');
  const p = document.createElement('div'); el.appendChild(p);
  const COR = { verde: ['#2fbf5b', '#fff'], vermelho: ['#e63946', '#fff'], amarelo: ['#ffd23f', '#111'], branco: ['#ffffff', '#111'] };
  onTick(t => {
    const e = lista.find(e => t >= e.t0 && t < e.t1);
    if (!e) { p.style.opacity = 0; return; }
    const [bg, fg] = COR[e.cor ?? 'branco'];
    p.innerHTML = (e.icone ? `<span style="display:inline-grid;place-items:center;width:62px;height:62px;border-radius:50%;background:${fg};color:${bg};margin-right:14px;font-size:44px">${e.icone}</span>` : '') + e.txt;
    p.style.cssText = `font-family:${FONTE};font-weight:900;font-size:50px;background:${bg};color:${fg};padding:12px 30px;border-radius:44px;box-shadow:0 8px 0 rgba(0,0,0,.35);display:flex;align-items:center;max-width:900px;text-align:center;line-height:1.05`;
    const k = P.clamp((t - e.t0) / .15); p.style.opacity = 1; p.style.transform = `scale(${P.lerp(.6, 1, 1 - (1 - k) ** 3)}) rotate(${P.lerp(-6, -2, k)}deg)`;
  });
}

// onomatopeia de quadrinho ("TUM!", "ZZZ", "?!") perto do meio da tela
export function onomatopeias(lista) {
  const el = camada(''); const d = document.createElement('div'); el.appendChild(d);
  onTick(t => {
    const e = lista.find(e => t >= e.t0 && t < e.t1);
    if (!e) { d.style.opacity = 0; return; }
    const k = P.clamp((t - e.t0) / .12), tremor = Math.sin(t * 60) * 4 * (1 - P.clamp((t - e.t0) / .4));
    d.textContent = e.txt;
    d.style.cssText = `position:absolute;left:${e.x ?? 540}px;top:${e.y ?? 640}px;transform:translate(-50%,-50%) translate(${tremor}px,0) scale(${P.lerp(1.6, 1, k)}) rotate(${e.rot ?? -8}deg);font-family:${FONTE};font-weight:900;font-size:${e.tam ?? 140}px;color:${e.cor ?? '#ffd23f'};${CONT.replace('12px', '14px')};opacity:${k}`;
  });
}

// barra de tempo do formato "e se você fizesse X por 1 ano?": marcos [{ t, rotulo }]
export function barraTempo(marcos, o = {}) {
  const el = camada(`display:flex;justify-content:center;align-items:flex-start;padding-top:${o.y ?? 1500}px`);
  const box = document.createElement('div'); box.style.cssText = 'width:820px;position:relative;height:110px'; el.appendChild(box);
  box.innerHTML = `<div style="position:absolute;left:0;right:0;top:66px;height:22px;border-radius:12px;background:#fff;box-shadow:0 6px 0 rgba(0,0,0,.35)"></div><div class="enche" style="position:absolute;left:0;top:66px;height:22px;border-radius:12px;background:#2fbf5b;width:0"></div>` +
    marcos.map((m, i) => `<div style="position:absolute;left:${i / (marcos.length - 1) * 100}%;top:0;transform:translateX(-50%);font-family:${FONTE};font-weight:900;font-size:40px;color:#fff;${CONT.replace('12px', '8px')}">${m.rotulo}</div>`).join('');
  const enche = box.querySelector('.enche');
  onTick(t => {
    el.style.opacity = t >= marcos[0].t - .2 && t < (o.ate ?? 1e9) ? 1 : 0;
    let k = 0; for (let i = 0; i < marcos.length - 1; i++) if (t >= marcos[i].t) k = (i + P.clamp((t - marcos[i].t) / Math.max(.3, marcos[i + 1].t - marcos[i].t) * 3)) / (marcos.length - 1);
    enche.style.width = (P.clamp(k) * 100) + '%';
  });
}

// ───────────────────────── luz e céu por clima ─────────────────────────
const CLIMAS = {
  dia: { key: '#f3ece0', fill: '#6d7686', amb: '#6a6c72', ceu: [[0, '#6f8496'], [.5, '#aab5bd'], [1, '#c6cbce']], nevoa: ['#c4c9cc', 6, 18] },
  noite: { key: '#7d8dc8', fill: '#2a2f55', amb: '#30344f', ceu: [[0, '#05081c'], [.6, '#121a40'], [1, '#26305e']], nevoa: ['#141a38', 5, 16] },
  abajur: { key: '#ffcf8a', fill: '#3a3358', amb: '#4a3f48', ceu: [[0, '#0b0c22'], [.6, '#1d1a3a'], [1, '#3a2f4a']], nevoa: ['#1d1a32', 5, 16] },
  vazio: { key: '#e8e2f4', fill: '#4a4f8a', amb: '#4a4c66', ceu: [[0, '#0a0f2e'], [.6, '#1a2560'], [1, '#2c3a80']], nevoa: ['#1a2560', 30, 60] },
};
const ceus = {};
export function clima(S, nome) {
  const c = CLIMAS[nome] ?? CLIMAS.dia;
  P.G.uKeyCor.value.set(c.key); P.G.uFillCor.value.set(c.fill); P.G.uAmb.value.set(c.amb);
  P.G.uFogCor.value.set(c.nevoa[0]); P.G.uFogPerto.value = c.nevoa[1]; P.G.uFogLonge.value = c.nevoa[2];
  S.scene.background = ceus[nome] ??= P.ceu({ cores: c.ceu, faixas: 12, nuvens: nome === 'dia' ? { n: 5, de: .05, ate: .3 } : null });
}

// ───────────────────────── enquadramento ─────────────────────────
// cam(alvo, tipo, o): calcula de/ate/alvo a partir do assunto. ang = graus em volta do assunto
// (0 = de frente, vindo de +z; 90 = pela direita, de +x). Nos cômodos em corte use ang entre 10 e 80.
const TIPOS = { geral: [7.5, 2.2], medio: [4.2, .9], americano: [3.1, .45], close: [1.55, .3], detalhe: [.95, .35], cima: [2.2, 3.6], baixo: [3, -.6] };
export function cam(alvo, tipo = 'medio', o = {}) {
  const [d0, h00] = TIPOS[tipo] ?? TIPOS.medio, h0 = o.alt ?? h00, d = d0 * (o.zoom ?? 1), a = ((o.ang ?? 35) * Math.PI) / 180;
  const mov = o.mov ?? 'entra';   // entra | sai | gira | sobe | lado
  const pos = (dd, aa, hh) => [alvo[0] + Math.sin(aa) * dd, alvo[1] + hh, alvo[2] + Math.cos(aa) * dd];
  let de = pos(d * 1.18, a, h0 * 1.1), ate = pos(d * .96, a, h0);
  if (mov === 'sai') [de, ate] = [ate, pos(d * 1.25, a, h0 * 1.15)];
  if (mov === 'gira') { de = pos(d, a - .22, h0); ate = pos(d, a + .22, h0); }
  if (mov === 'sobe') { de = pos(d, a, h0 - .35); ate = pos(d * .95, a, h0 + .25); }
  if (mov === 'lado') { de = pos(d, a, h0); ate = pos(d, a, h0); de[0] -= .3; ate[0] += .3; }
  const al = [alvo[0], alvo[1] + (o.dy ?? 0), alvo[2]];
  return { de, ate, alvo: al, alvoAte: al, fov: o.fov ?? (tipo === 'detalhe' || tipo === 'close' ? 40 : 48) };
}

// ───────────────────────── diretor ─────────────────────────
// planos: [{ t0, t1, cena, cam: { de:[x,y,z], ate:[x,y,z], alvo:[x,y,z], alvoAte }, clima, fazer(t, k) }]
// a câmera vai de "de" até "ate" com suavização; cada cômodo fica longe dos outros (deslocado em x)
export function diretor(S, planos, cenas) {
  const off = {}; let i = 0;
  for (const [nome, g] of Object.entries(cenas)) { off[nome] = i * 30; g.position.x += i * 30; S.scene.add(g); i++; }
  const v3 = (a, nome) => new THREE.Vector3(a[0] + (off[nome] ?? 0), a[1], a[2]);
  let climaAtual = null;
  S.update = t => {
    const p = planos.find(p => t >= p.t0 && t < p.t1) ?? planos[planos.length - 1];
    for (const [nome, g] of Object.entries(cenas)) g.visible = nome === p.cena;
    const cl = p.clima ?? 'dia'; if (cl !== climaAtual) { clima(S, cl); climaAtual = cl; }
    const k = P.suave(0, 1, (t - p.t0) / Math.max(.01, p.t1 - p.t0));
    const c = p.cam, de = v3(c.de, p.cena), ate = v3(c.ate ?? c.de, p.cena), al = v3(c.alvo, p.cena), alAte = v3(c.alvoAte ?? c.alvo, p.cena);
    S.camera.position.lerpVectors(de, ate, k);
    // tremidinha de câmera na mão (bem leve) pra nunca ficar parado
    S.camera.position.x += Math.sin(t * 1.7) * .012; S.camera.position.y += Math.sin(t * 2.3) * .008;
    S.camera.fov = c.fov ?? 40; S.camera.updateProjectionMatrix();
    S.camera.lookAt(al.lerp(alAte, k));
    if (p.fazer) p.fazer(t - p.t0, k, t);
  };
}

// ───────────────────────── filme: roda um roteiro (JSON) inteiro ─────────────────────────
// F = { gancho:{txt,sub,ate}, elenco:{nome:{camisa,cabelo,pele,estilo}}, destaque:[...], palavras:[{w,t0,t1}],
//       planos:[{ t0, t1, cena, clima, cam:{tipo, alvo:'ponto'|[x,y,z], ang, mov, alt, zoom, dy},
//                 atores:{ nome:{ onde:'ponto'|[x,y,z], pose, expr, rot } }, estado:{...}, objeto, etiqueta, onoma, marco }] }
const FABRICAS = { quarto, sala, escritorio, rua, vazio };
const CLIMA_PADRAO = { quarto: 'noite', sala: 'dia', escritorio: 'dia', rua: 'noite', vazio: 'vazio' };
const OBJETOS = { cerebro, celular: () => { const c = celular(); c.scale.setScalar(3.2); return c; }, despertador: () => { const d = despertador('03:00'); d.scale.setScalar(1.6); return d; }, abajur: () => { const a = abajur(true); a.scale.setScalar(2.2); a.position.y = -.5; return a; }, quadro: () => quadro() };

export function filme(S, F) {
  const cenas = {}, atores = {}, objetos = {};
  const usadas = [...new Set(F.planos.map(p => p.cena))];
  for (const n of usadas) cenas[n] = FABRICAS[n]();
  // um "ator" por cômodo (o mesmo personagem aparece em vários lugares)
  for (const n of usadas) {
    atores[n] = {};
    for (const [nome, c] of Object.entries(F.elenco ?? { voce: {} })) { const a = personagem(c); a.visible = false; cenas[n].add(a); atores[n][nome] = a; }
  }
  if (cenas.vazio) for (const [k, f] of Object.entries(OBJETOS)) if (F.planos.some(p => p.objeto === k || p.objeto?.nome === k)) { const o = f(); o.visible = false; o.position.y += 1.1; cenas.vazio.add(o); objetos[k] = o; }
  const ponto = (n, v) => Array.isArray(v) ? v : (cenas[n].pts[v] ?? cenas[n].pts.centro ?? [0, 0, 0]);
  // a câmera de cada plano é calculada uma vez
  for (const p of F.planos) {
    const c = p.cam ?? {};
    let alvo = c.alvo ?? (p.cena === 'vazio' ? [0, 1.1, 0] : 'centro');
    if (typeof alvo === 'string') { const pt = ponto(p.cena, alvo); alvo = [pt[0], Math.max(pt[1], c.tipo === 'geral' ? .8 : .6) + (c.alturaAlvo ?? 0), pt[2]]; }
    p._cam = cam(alvo, c.tipo ?? 'medio', c);
    p.clima = p.clima ?? CLIMA_PADRAO[p.cena];
  }
  const planos = F.planos.map(p => ({ t0: p.t0, t1: p.t1, cena: p.cena, clima: p.clima, cam: p._cam, fazer: (tl, k, t) => aplicar(p, tl, k, t) }));
  function aplicar(p, tl, k, t) {
    const g = cenas[p.cena], E = p.estado ?? {};
    if (g.portaLuz) g.portaLuz(E.porta ?? false);
    if (g.abajur) g.abajur.acender(E.abajur ?? false);
    if (g.cobrir) g.cobrir(E.coberta ?? .7, !!E.pe);
    if (g.janela) g.janela(E.dia ?? (p.clima === 'dia'));
    if (g.despertador && E.hora) g.despertador.trocar(E.hora);
    for (const [nome, a] of Object.entries(atores[p.cena])) {
      const d = p.atores?.[nome];
      a.visible = !!d;
      if (!d) continue;
      const onde = d.onde ?? 'pe';
      if (onde === 'deitado' && g.deitar) { g.deitar(a); }
      else {
        const pt = ponto(p.cena, onde); a.position.set(...pt);
        // por padrão vira o rosto pra câmera (quem está em pé ou sentado)
        const c0 = p._cam.de, rotCam = Math.atan2(c0[0] - pt[0], c0[2] - pt[2]);
        a.rotation.set(0, typeof d.rot === 'number' ? d.rot : rotCam + (d.giro ?? 0), 0);
        if (d.anda) { a.position.z += (d.anda[1] ?? 0) * tl; a.position.x += (d.anda[0] ?? 0) * tl; }
      }
      a.pose(d.pose ?? (onde === 'deitado' ? 'deitado' : onde.startsWith('sofa') || onde === 'cadeira' ? 'sentado' : d.anda ? 'andar' : 'pe'), t);
      a.expr(d.expr ?? 'normal');
      // celular na mão quando a pose pede
      if (d.pose === 'celular' && !a._cel) { a._cel = celular(); a.maoDir.add(a._cel); a._cel.position.set(-.08, -.06, .12); a._cel.rotation.set(-1.3, 0, 0); }
      if (a._cel) a._cel.visible = d.pose === 'celular';
    }
    for (const [nome, o] of Object.entries(objetos)) {
      const sel = typeof p.objeto === 'string' ? p.objeto : p.objeto?.nome;
      o.visible = p.cena === 'vazio' && sel === nome;
      if (o.visible) { o.rotation.y = .5 + tl * .6; o.rotation.x = Math.sin(tl * 1.3) * .08; if (nome === 'despertador' && p.objeto?.txt) o.trocar(p.objeto.txt);
        if (nome === 'quadro' && p.objeto?.linhas) { const chave = JSON.stringify([p.objeto.linhas, p.objeto.marca]); if (o._k !== chave) { o.trocar(p.objeto.linhas, p.objeto.marca); o._k = chave; } o.rotation.y = Math.sin(tl * .8) * .12; } }
    }
  }
  diretor(S, planos, cenas);
  // sobreposições
  if (F.gancho) titulo(F.gancho.txt, F.gancho.sub, F.gancho.ate ?? 1.8);
  etiquetas(F.planos.filter(p => p.etiqueta).map(p => { const e = typeof p.etiqueta === 'string' ? { txt: p.etiqueta } : p.etiqueta; return { t0: p.t0 + .12, t1: e.fim ?? p.t1, ...e }; }));
  onomatopeias(F.planos.filter(p => p.onoma).map(p => ({ t0: p.t0 + .05, t1: Math.min(p.t1, p.t0 + .9), ...(typeof p.onoma === 'string' ? { txt: p.onoma } : p.onoma) })));
  const marcos = F.planos.filter(p => p.marco).map(p => ({ t: p.t0, rotulo: p.marco }));
  if (marcos.length > 1) barraTempo(marcos, { ate: F.planos.filter(p => p.marco).at(-1).t1 + 2 });
  legendaPalavras(F.palavras ?? [], { destaque: F.destaque ?? [] });
}
