// Analog Real Horror: o que o canal soma ao motor PS1 (lib/ps1.js).
//   luz pontual assada por vértice (os postes de sódio, a lâmpada pendurada), como os jogos de terror do PS1 faziam
//   bonecos sem rosto (a regra do canal: ninguém real é imitado) · HUD de fita (REC, timecode, carimbo digitado)
//   fita de evidência: foto ou vídeo REAL em 4:3 numa moldura de CRT/VHS, com a origem escrita na tela
import * as P from './ps1.js';
const { THREE } = P;

export const SODIO = '#ff9a3c';
const RAIZ = new URL('../', import.meta.url).href;     // caminhos de material são relativos à raiz do projeto

// timecode de fita: HH:MM:SS:QQ (30 quadros)
const timecode = s => { const f = Math.floor((s % 1) * 30); s = Math.floor(s); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f].map(n => String(n).padStart(2, '0')).join(':'); };

// material que só usa a luz assada (cor por vértice); a névoa continua valendo
export const matA = (o = {}) => P.mat({ ...o, corVertice: true, semLuz: true });

// luz pontual calculada no vértice: ambiente + Σ lâmpada · queda · lambert. Rode de novo quando a peça se mexer.
// luzes: [{ pos: [x,y,z], cor: '#hex', raio, int }]
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _L = new THREE.Vector3(), _c = new THREE.Color(), _nm = new THREE.Matrix3();
export function assar(obj, luzes, amb = '#16181d') {
  const A = new THREE.Color(amb), LS = luzes.map(l => ({ ...l, c: new THREE.Color(l.cor ?? SODIO) }));
  obj.updateMatrixWorld(true);
  obj.traverse(m => {
    if (!m.isMesh || !m.material.vertexColors) return;
    const g = m.geometry, pos = g.attributes.position, nor = g.attributes.normal;
    let col = g.attributes.color;
    if (!col) { col = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3); g.setAttribute('color', col); }
    _nm.getNormalMatrix(m.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      _p.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      _n.fromBufferAttribute(nor, i).applyMatrix3(_nm).normalize();
      _c.copy(A);
      for (const l of LS) {
        _L.set(l.pos[0] - _p.x, l.pos[1] - _p.y, l.pos[2] - _p.z);
        const d = _L.length(); _L.divideScalar(d || 1);
        const f = Math.max(0, 1 - d / l.raio) ** 2 * (l.int ?? 1) * (Math.max(0, _n.dot(_L)) * .75 + .25);
        _c.r += l.c.r * f; _c.g += l.c.g * f; _c.b += l.c.b * f;
      }
      col.setXYZ(i, _c.r, _c.g, _c.b);
    }
    col.needsUpdate = true;
  });
}

// chão subdividido que recebe a luz assada (a poça de luz sob cada poste)
export function chaoA(o = {}) {
  const tam = o.tam ?? 40, seg = o.seg ?? 80;
  const m = matA({ mapa: o.mapa ?? P.TEX.concreto({ cor: o.cor ?? '#8a8780', junta: '#6c6963' }), rep: o.rep ?? [tam / 1.6, tam / 1.6] });
  return P.malha(new THREE.PlaneGeometry(o.w ?? tam, o.d ?? tam, seg, seg), m, { pos: [o.x ?? 0, o.y ?? 0, o.z ?? 0], rot: [-Math.PI / 2, 0, 0] });
}

// poste de luz com a lâmpada acesa (a luz em si vem do assar)
export function poste(x, z, o = {}) {
  const g = new THREE.Group(), h = o.h ?? 3.2, ferro = matA({ cor: '#3a3d42' });
  g.add(P.cilindro(.05, .07, h, ferro, { pos: [0, h / 2, 0], seg: 6 }));
  g.add(P.caixa(.5, .05, .08, ferro, { pos: [.22, h, 0] }));
  g.add(P.cilindro(.07, .14, .12, ferro, { pos: [.42, h - .06, 0], seg: 6 }));
  g.add(P.disco(.1, P.mat({ cor: '#ffd9a0', semLuz: true }), { pos: [.42, h - .125, 0], rot: [Math.PI / 2, 0, 0], seg: 6 }));
  g.position.set(x, 0, z); if (o.rot) g.rotation.y = o.rot;
  g.luz = () => { g.updateMatrixWorld(true); const p = new THREE.Vector3(.42, h - .3, 0); g.localToWorld(p); return { pos: p.toArray(), cor: o.cor ?? SODIO, raio: o.raio ?? 5, int: o.int ?? 1.25 }; };
  return g;
}

// halo da lâmpada: sprite aditivo pequeno (sem bloom: não existia)
export const halo = (r, cor = SODIO, op = .22) => P.disco(r, P.mat({ mapa: P.TEX.disco(), cor, opac: op, aditivo: true, semLuz: true, lados: THREE.DoubleSide }), { seg: 10 });

// boneco sem rosto: tronco, cabeça lisa e pernas que balançam. andar(t) anima o passo.
export function boneco(o = {}) {
  const g = new THREE.Group(), pele = matA({ cor: o.cor ?? '#c9c6bf' }), roupa = matA({ cor: o.roupa ?? '#55595f' });
  const esc = o.esc ?? 1;
  g.add(P.cilindro(.13, .17, .62, roupa, { pos: [0, 1.12, 0], seg: 6 }));
  g.add(P.esfera(.12, pele, { pos: [0, 1.58, 0], seg: 6, segV: 5 }));
  g.add(P.cilindro(.045, .05, .12, pele, { pos: [0, 1.45, 0], seg: 5 }));
  const pernas = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .07, .82, 0); p.add(P.caixa(.1, .8, .11, roupa, { pos: [0, -.4, 0] })); g.add(p); return p; });
  const bracos = [-1, 1].map(s => { const b = new THREE.Group(); b.position.set(s * .2, 1.4, 0); b.add(P.caixa(.07, .58, .08, roupa, { pos: [0, -.29, 0] })); g.add(b); return b; });
  g.scale.setScalar(esc);
  g.andar = (fase) => { const a = Math.sin(fase) * .5; pernas[0].rotation.x = a; pernas[1].rotation.x = -a; bracos[0].rotation.x = -a * .7; bracos[1].rotation.x = a * .7; };
  return g;
}

// HUD de fita: nítido por cima do PS1 (é DOM, como a legenda da skill)
// o: { rec, cam, tc0 (s), carimbo: [{ t, txt }], dir: texto no canto superior direito, tarja: proporção (ex. 2.35), fita: true (scanline + vinheta) }
export function hud(o = {}) {
  const st = document.getElementById('stage'), V = window.VIDEO;
  const el = document.createElement('div'); el.className = 'layer';
  el.style.cssText = 'pointer-events:none;font-family:"JetBrains Mono",ui-monospace,monospace;color:#e9e4d6;letter-spacing:.06em';
  const barra = o.tarja ? Math.round((V.h - V.w / o.tarja) / 2) : 0;
  el.innerHTML = `
    ${o.fita ? `<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 2px,transparent 2px 4px)"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(120% 95% at 50% 50%,transparent 58%,rgba(0,0,0,.55))"></div>` : ''}
    ${barra ? `<div style="position:absolute;left:0;right:0;top:0;height:${barra}px;background:#000"></div><div style="position:absolute;left:0;right:0;bottom:0;height:${barra}px;background:#000"></div>` : ''}
    <div data-k="tl" style="position:absolute;left:72px;top:${barra + 54}px;font-size:30px;font-weight:500;display:flex;gap:16px;align-items:center"></div>
    <div data-k="tr" style="position:absolute;right:72px;top:${barra + 54}px;font-size:30px;font-weight:500;text-align:right"></div>
    <div data-k="bl" style="position:absolute;left:72px;bottom:${barra + 58}px;font-size:34px;font-weight:500"></div>
    <div data-k="br" style="position:absolute;right:72px;bottom:${barra + 58}px;font-size:30px;font-weight:500;opacity:.85"></div>`;
  st.appendChild(el);
  const q = k => el.querySelector(`[data-k="${k}"]`), tc = timecode;
  onTick(t => {
    if (o.rec !== false) q('tl').innerHTML = `<span style="color:#d8432f;opacity:${Math.floor(t * 1.6) % 2 ? .25 : 1}">● REC</span>${o.cam ? `<span>${o.cam}</span>` : ''}`;
    q('tr').textContent = o.dir ?? '';
    q('br').textContent = o.tc0 != null ? tc(o.tc0 + t) : '';
    // carimbo digitado letra a letra numa etiqueta, com cursor (o carimbo do fern, em fonte de HUD)
    const c = (o.carimbo ?? []).filter(b => t >= b.t).pop();
    if (!c) { q('bl').innerHTML = ''; return; }
    const n = Math.min(c.txt.length, Math.floor((t - c.t) * (c.vel ?? 22)));
    const cursor = Math.floor(t * 3) % 2 || n < c.txt.length ? '<span style="display:inline-block;width:.6em;height:1em;background:#d8432f;vertical-align:-.12em;margin-left:4px"></span>' : '';
    q('bl').innerHTML = `<span style="background:rgba(10,10,12,.72);padding:8px 14px">${c.txt.slice(0, n).replace(/ /g, '&nbsp;')}${cursor}</span>`;
  });
  return el;
}

// ───────── fita de evidência: o material REAL (foto ou vídeo) em 4:3 numa moldura de CRT/VHS ─────────
// O real não passa pelo PS1 (seria redesenhar o que é verdadeiro): entra como arquivo, com cara de fita —
// quadro de 640×480, cor que sangra pro lado, contorno claro do VHS, chiado, faixa de tracking, ruído de troca
// de cabeça no pé da imagem — e a ORIGEM escrita na tela. Sem `fonte` a função recusa: o canal sempre diz de onde veio.
// o: { foto: 'material/x.jpg' | quadros: 'material/clipe' (pasta do tools/quadros.sh), fonte: 'SOURCE: …',
//      moldura: 'crt' (TV numa sala escura, padrão) | 'tela' (4:3 na altura toda, faixas pretas dos lados),
//      rec (true: ● REC; false: ▶ PLAY), tc0 (s do timecode em t=0), data (canto inferior esquerdo da imagem), dir (canto superior direito),
//      t0 (quando o vídeo começa na cena), ini (s dentro do clipe), zoom: [z0, z1] e foco: [x, y] (0–1, aproximação lenta),
//      cor (saturação, .6), ruido (0–1, .5), curva (barril do CRT, .07; 0 na 'tela'), entrada (s de chiado até a imagem firmar, .4),
//      falhas: [t, …] (instantes de tracking forte, .25 s cada) }
export function evidencia(o = {}) {
  if (!o.fonte) throw new Error('evidencia: escreva a origem do material em `fonte` ("SOURCE: …")');
  if (!o.foto && !o.quadros) throw new Error('evidencia: passe `foto` ou `quadros`');
  const st = document.getElementById('stage'), V = window.VIDEO, crt = (o.moldura ?? 'crt') === 'crt', deitado = V.w > V.h;
  const rw = 640, rh = 480, n = rw * rh;                     // o quadro da fita
  const ruido = o.ruido ?? .5, cor = o.cor ?? .6, curva = o.curva ?? (crt ? .07 : 0), entrada = o.entrada ?? .4;
  const [z0, z1] = o.zoom ?? [1, 1], [fx, fy] = o.foco ?? [.5, .5];
  // tamanho da tela: 4:3 que cabe na moldura (a TV deixa espaço embaixo pra origem)
  const kk = crt ? Math.min(V.w * (deitado ? .62 : .86) / 4, V.h * (deitado ? .74 : .5) / 3) : Math.min(V.w / 4, V.h / 3);
  const sw = Math.round(kk * 4), sh = Math.round(kk * 3), bx = Math.round(sh * .065), btop = bx, bbase = Math.round(sh * .12);
  // em 16:9 a TV centra acima da origem; em 9:16 ela termina antes da legenda (y 1240), que fica livre embaixo
  const tvW = sw + 2 * bx, tvH = sh + btop + bbase, tvX = Math.round((V.w - tvW) / 2), tvY = Math.round(deitado ? (V.h - 70 - tvH) / 2 : V.h * .615 - tvH);
  const scX = crt ? tvX + bx : Math.round((V.w - sw) / 2), scY = crt ? tvY + btop : Math.round(deitado ? (V.h - sh) / 2 : V.h * .615 - sh);
  const fs = Math.round(sh * .042), mg = Math.round(sh * .065), mgB = mg + (!crt && deitado ? 64 : 0), lin = Math.max(3, Math.floor(sh / 240));   // na 'tela' 16:9 o OSD de baixo sobe pra não encostar na origem

  const el = document.createElement('div'); el.className = 'layer';
  el.style.cssText = `pointer-events:none;font-family:"JetBrains Mono",ui-monospace,monospace;letter-spacing:.06em;background:${crt ? 'radial-gradient(70% 80% at 50% 45%,#16181c,#060708 75%)' : '#000'}`;
  el.innerHTML = `
    ${crt ? `<div style="position:absolute;left:${tvX}px;top:${tvY}px;width:${tvW}px;height:${tvH}px;border-radius:${Math.round(bx * .7)}px;
        background:linear-gradient(180deg,#2b2c30,#191a1d 55%,#111214);box-shadow:0 0 ${Math.round(sh * .2)}px rgba(140,155,175,.10),0 ${Math.round(sh * .04)}px ${Math.round(sh * .1)}px rgba(0,0,0,.7),inset 0 2px 0 rgba(255,255,255,.07),inset 0 -3px 0 rgba(0,0,0,.5)">
      <div style="position:absolute;left:${bx * .55}px;top:${btop * .55}px;right:${bx * .55}px;bottom:${bbase - btop * .45}px;border-radius:${Math.round(bx * .5)}px;background:#060607;box-shadow:inset 0 3px 10px rgba(0,0,0,.9)"></div>
      <div style="position:absolute;left:${bx}px;bottom:${bbase * .28}px;width:${sw * .22}px;height:${bbase * .42}px;background:repeating-linear-gradient(90deg,#0b0c0d 0 3px,transparent 3px 7px);opacity:.8"></div>
      <div style="position:absolute;right:${bx}px;bottom:${bbase * .36}px;display:flex;gap:${Math.round(bx * .35)}px;align-items:center">
        ${`<div style="width:${Math.round(bx * .7)}px;height:${Math.round(bbase * .16)}px;background:#0d0e10;border-radius:2px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)"></div>`.repeat(4)}
        <div style="width:${Math.round(bx * .18)}px;height:${Math.round(bx * .18)}px;border-radius:50%;background:${SODIO};box-shadow:0 0 8px ${SODIO};opacity:.8"></div></div>
    </div>` : ''}
    <div data-k="tela" style="position:absolute;left:${scX}px;top:${scY}px;width:${sw}px;height:${sh}px;overflow:hidden;background:#000;border-radius:${crt ? '3.2% / 4.3%' : '0'}">
      <canvas data-k="cv" width="${rw}" height="${rh}" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.3) 0 ${Math.floor(lin / 2)}px,transparent ${Math.floor(lin / 2)}px ${lin}px)"></div>
      <div data-k="osd" style="position:absolute;inset:0;font-size:${fs}px;font-weight:500;color:#f1f0ea;text-shadow:0 0 5px rgba(255,255,255,.35),2px 2px 0 rgba(0,0,0,.6)">
        <div data-k="tl" style="position:absolute;left:${mg}px;top:${mg}px"></div>
        <div data-k="tr" style="position:absolute;right:${mg}px;top:${mg}px">${o.dir ?? ''}</div>
        <div data-k="bl" style="position:absolute;left:${mg}px;bottom:${mgB}px">${o.data ?? ''}</div>
        <div data-k="br" style="position:absolute;right:${mg}px;bottom:${mgB}px"></div></div>
      ${crt ? `<div style="position:absolute;inset:0;border-radius:inherit;background:radial-gradient(120% 90% at 28% 18%,rgba(255,255,255,.07),transparent 42%),radial-gradient(100% 100% at 50% 50%,transparent 62%,rgba(0,0,0,.6));box-shadow:inset 0 0 ${Math.round(sh * .05)}px rgba(0,0,0,.85)"></div>` : ''}
    </div>
    <div style="position:absolute;left:72px;bottom:${deitado ? 34 : 58}px;font-size:${deitado ? 28 : 32}px;font-weight:500;color:#e9e4d6;background:rgba(10,10,12,.78);border-left:4px solid ${SODIO};padding:8px 14px;white-space:nowrap">${o.fonte}</div>`;
  st.appendChild(el);
  const q = k => el.querySelector(`[data-k="${k}"]`), cv = q('cv'), osd = q('osd');

  // o material: uma imagem na memória por vez (foto fixa ou o quadro do clipe naquele instante)
  const img = new Image(); let atual = null;
  const meta = o.quadros ? fetch(new URL(o.quadros + '/quadros.json', RAIZ)).then(r => r.json()) : null;
  async function material(t) {
    let url = o.foto;
    if (!url) { const m = await meta; const i = P.clamp(Math.floor((t - (o.t0 ?? 0) + (o.ini ?? 0)) * m.fps), 0, m.n - 1); url = `${o.quadros}/${String(i + 1).padStart(5, '0')}.jpg`; }
    if (url !== atual) { img.src = new URL(url, RAIZ).href; await img.decode(); atual = url; }
    return img;
  }

  const src = document.createElement('canvas'); src.width = rw; src.height = rh;
  const sx = src.getContext('2d', { willReadFrequently: true }), ox = cv.getContext('2d'), od = ox.createImageData(rw, rh), D = od.data;
  const Y = new Float32Array(n), U = new Float32Array(n), W = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n), off = new Float32Array(rh);
  // média móvel horizontal (o VHS só borra na horizontal: a banda é por linha)
  const borrar = (a, b, r) => { for (let y = 0; y < rh; y++) { const L = y * rw; let s = 0; for (let x = -r; x <= r; x++) s += a[L + P.clamp(x, 0, rw - 1)];
    for (let x = 0; x < rw; x++) { b[L + x] = s / (2 * r + 1); s += a[L + Math.min(rw - 1, x + r + 1)] - a[L + Math.max(0, x - r)]; } } };

  onTick(async t => {
    const im = await material(t), f = Math.round(t * V.fps), r = P.rng(9173 + f), R = () => r() - .5;
    // enquadra (cobre o 4:3) com aproximação lenta e o tremido de quadro da fita
    const z = P.lerp(z0, z1, P.clamp(t / V.dur)), s = Math.max(rw / im.naturalWidth, rh / im.naturalHeight) * z;
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    sx.fillStyle = '#000'; sx.fillRect(0, 0, rw, rh);
    sx.drawImage(im, P.clamp(rw / 2 - fx * dw, rw - dw, 0), P.clamp(rh / 2 - fy * dh, rh - dh, 0) + R() * .8 * ruido, dw, dh);
    const d = sx.getImageData(0, 0, rw, rh).data;
    for (let i = 0, j = 0; i < n; i++, j += 4) { const y = (.299 * d[j] + .587 * d[j + 1] + .114 * d[j + 2]) / 255; Y[i] = y; U[i] = (d[j + 2] / 255 - y) * cor + R() * .05 * ruido; W[i] = (d[j] / 255 - y) * cor + R() * .05 * ruido; }
    // luma: pouca resolução horizontal + o contorno claro do realce de borda
    borrar(Y, A, 1); borrar(Y, B, 4);
    const ganho = 1 + R() * .03 * ruido;
    for (let i = 0; i < n; i++) Y[i] = (.05 + .9 * (A[i] + .4 * (A[i] - B[i])) + R() * .07 * ruido) * ganho;
    // croma: borrado largo, atrasado 3 px pra direita e com meia resolução vertical
    borrar(U, A, 5); borrar(W, B, 5);
    for (let y = rh - 1; y >= 0; y--) for (let x = rw - 1; x >= 0; x--) { const i = y * rw + x, k = y * rw + Math.max(0, x - 3), k2 = Math.max(0, y - 1) * rw + Math.max(0, x - 3); U[i] = (A[k] + A[k2]) / 2; W[i] = (B[k] + B[k2]) / 2; }
    // falhas do sinal: drop-outs (riscos brancos), linhas tremidas, faixa de tracking, troca de cabeça no pé
    for (let k = 0, nk = Math.floor(r() * 4 * ruido); k < nk; k++) { const y = Math.floor(r() * rh), x0 = Math.floor(r() * rw), L = 8 + Math.floor(r() * 50); for (let x = x0; x < Math.min(rw, x0 + L); x++) Y[y * rw + x] = .85 + r() * .15; }
    const falha = (o.falhas ?? []).some(a => t >= a && t < a + .25);
    const yb = falha ? r() * rh : rh * (.8 + .06 * Math.sin(t * .7)), hb = falha ? 60 : 16, ab = falha ? 40 : 6 * ruido;
    for (let y = 0; y < rh; y++) {
      let v = R() * .9 * ruido + (y < 10 ? (10 - y) * .7 * ruido : 0);
      const db = Math.abs(y - yb) / hb; if (db < 1) v += R() * ab * (1 - db);
      if (y > rh - 8) v += 10 + r() * 10;
      off[y] = v;
    }
    // entrada: chiado e a imagem rolando até travar
    const m = entrada > 0 ? P.clamp(t / entrada) : 1, rola = (1 - m) ** 2 * rh * 1.7, neve0 = (1 - m) ** .7;
    for (let y = 0; y < rh; y++) {
      const ny = y / rh * 2 - 1, neveL = Math.max(neve0, y > rh - 8 ? .35 : 0, Math.abs(y - yb) < hb ? (falha ? .5 : .12 * ruido) * (1 - Math.abs(y - yb) / hb) : 0);
      for (let x = 0; x < rw; x++) {
        const nx = x / rw * 2 - 1, c = 1 + curva * (nx * nx + ny * ny);
        let ys = (ny * c + 1) / 2 * rh + rola, xs = (nx * c + 1) / 2 * rw, j = (y * rw + x) * 4;
        if (xs < 0 || xs >= rw || ys - rola < 0 || ys - rola >= rh) { D[j] = D[j + 1] = D[j + 2] = 0; D[j + 3] = 255; continue; }
        const yi = Math.floor(ys) % rh, i = yi * rw + P.clamp(Math.round(xs + off[yi]), 0, rw - 1);
        let yy = Y[i], u = U[i], w = W[i];
        if (neveL > 0) { const sn = r(); yy = yy * (1 - neveL) + sn * neveL; u *= 1 - neveL; w *= 1 - neveL; }
        const R8 = yy + w, B8 = yy + u, G8 = (yy - .299 * R8 - .114 * B8) / .587;
        D[j] = R8 * 255; D[j + 1] = G8 * 255; D[j + 2] = B8 * 255; D[j + 3] = 255;
      }
    }
    ox.putImageData(od, 0, 0);
    // OSD da câmera: entra quando a imagem firma
    osd.style.opacity = m < .6 ? 0 : 1;
    q('tl').innerHTML = o.rec === false ? '▶ PLAY' : `<span style="color:#d8432f;opacity:${Math.floor(t * 1.6) % 2 ? .2 : 1}">●</span> REC`;
    q('br').textContent = timecode((o.tc0 ?? 0) + t);
  });
  el.tela = q('tela');
  return el;
}
