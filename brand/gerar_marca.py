"""Gera a identidade visual do Descifre em SVG e PNG.

Mascote: Cifrinho, um cérebro vermelho com terceiro olho e anel cósmico.
Paleta: azul profundo + vermelho + ciano místico.
"""
import random
import subprocess
from pathlib import Path

OUT = Path(__file__).parent / "saida"
OUT.mkdir(exist_ok=True)

AZUL_ESCURO = "#070F33"
AZUL = "#14318F"
AZUL_CLARO = "#2F6BFF"
VERMELHO = "#FF3B4E"
VERMELHO_ESC = "#C81E3A"
CIANO = "#5BE0FF"
BRANCO = "#F4F7FF"


def estrela4(cx, cy, r, cor=BRANCO, op=1.0):
    """Brilho de 4 pontas."""
    k = r * 0.22
    d = (f"M{cx},{cy-r} Q{cx+k},{cy-k} {cx+r},{cy} Q{cx+k},{cy+k} {cx},{cy+r} "
         f"Q{cx-k},{cy+k} {cx-r},{cy} Q{cx-k},{cy-k} {cx},{cy-r} Z")
    return f'<path d="{d}" fill="{cor}" opacity="{op}"/>'


def campo_estrelas(w, h, n, seed=7):
    rnd = random.Random(seed)
    s = []
    for _ in range(n):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        r = rnd.choice([1, 1, 1.5, 2, 2.5])
        s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{BRANCO}" opacity="{rnd.uniform(.25,.9):.2f}"/>')
    return "\n".join(s)


DEFS = f"""
<defs>
  <radialGradient id="gCerebro" cx="40%" cy="30%" r="75%">
    <stop offset="0" stop-color="#FF7A86"/>
    <stop offset=".55" stop-color="{VERMELHO}"/>
    <stop offset="1" stop-color="{VERMELHO_ESC}"/>
  </radialGradient>
  <radialGradient id="gFundo" cx="50%" cy="40%" r="75%">
    <stop offset="0" stop-color="{AZUL}"/>
    <stop offset="1" stop-color="{AZUL_ESCURO}"/>
  </radialGradient>
  <radialGradient id="gAura" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="{AZUL_CLARO}" stop-opacity=".55"/>
    <stop offset="1" stop-color="{AZUL_CLARO}" stop-opacity="0"/>
  </radialGradient>
  <filter id="brilho" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".35"/>
  </filter>
  <clipPath id="frenteAnel"><rect x="0" y="410" width="800" height="200"/></clipPath>
</defs>
"""

CEREBRO_PATH = ("M230 470 C170 470 160 390 210 370 C190 310 250 270 290 290 "
                "C300 230 380 220 410 260 C440 215 520 225 530 285 "
                "C580 270 630 320 605 370 C655 395 640 475 580 478 "
                "C570 520 510 535 480 510 C450 540 380 540 360 510 "
                "C330 535 260 525 250 490 C240 488 232 480 230 470 Z")


def mascote():
    """Cifrinho no espaço 800x800 (centro ~410,400)."""
    anel = (f'<ellipse cx="410" cy="410" rx="300" ry="68" fill="none" '
            f'stroke="{CIANO}" stroke-width="7" opacity=".95"/>')
    dobras = f"""
    <g fill="none" stroke="#FFB3BB" stroke-width="7" stroke-linecap="round" opacity=".55">
      <path d="M410 262 C396 296 424 318 408 346"/>
      <path d="M285 330 C310 320 330 336 345 325"/>
      <path d="M520 312 C500 300 482 318 468 306"/>
      <path d="M240 420 C262 410 270 430 290 424"/>
      <path d="M590 410 C570 402 560 422 540 414"/>
      <path d="M330 505 C345 490 365 498 372 488"/>
      <path d="M495 498 C478 488 462 498 452 486"/>
    </g>"""
    olho = lambda x: f"""
      <circle cx="{x}" cy="405" r="44" fill="{BRANCO}"/>
      <circle cx="{x+6}" cy="412" r="26" fill="{AZUL_ESCURO}"/>
      <circle cx="{x+6}" cy="412" r="12" fill="{AZUL_CLARO}" opacity=".6"/>
      <circle cx="{x-4}" cy="400" r="10" fill="#fff"/>
      <circle cx="{x+16}" cy="424" r="4" fill="#fff"/>"""
    terceiro = f"""
    <g filter="url(#brilho)">
      <path d="M384 316 Q412 294 440 316 Q412 338 384 316 Z" fill="{CIANO}"/>
      <circle cx="412" cy="316" r="8" fill="{AZUL_ESCURO}"/>
      <circle cx="409" cy="313" r="2.5" fill="#fff"/>
    </g>"""
    return f"""
  <g filter="url(#sombra)">
    <g transform="rotate(-14 410 410)">{anel}</g>
    <path d="{CEREBRO_PATH}" fill="url(#gCerebro)"/>
    {dobras}
    {olho(355)}{olho(470)}
    <ellipse cx="312" cy="452" rx="24" ry="13" fill="#FF9AAA" opacity=".75"/>
    <ellipse cx="513" cy="452" rx="24" ry="13" fill="#FF9AAA" opacity=".75"/>
    <path d="M386 462 Q412 486 440 462" fill="none" stroke="{AZUL_ESCURO}" stroke-width="8" stroke-linecap="round"/>
    {terceiro}
    <g transform="rotate(-14 410 410)" clip-path="url(#frenteAnel)">{anel}
      <circle cx="660" cy="440" r="14" fill="{CIANO}" filter="url(#brilho)"/></g>
  </g>
  {estrela4(170, 230, 26, CIANO)}{estrela4(650, 200, 18)}{estrela4(640, 590, 22, CIANO, .9)}
  {estrela4(190, 600, 14, BRANCO, .8)}"""


def svg(w, h, corpo):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}">{DEFS}{corpo}</svg>')


def salvar(nome, conteudo, w, h):
    p = OUT / f"{nome}.svg"
    p.write_text(conteudo, encoding="utf-8")
    subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), "-o",
                    str(OUT / f"{nome}.png"), str(p)], check=True)
    print("ok", nome)


# 1) Mascote com fundo transparente (para o Remotion)
salvar("mascote", svg(800, 800, mascote()), 800, 800)

# 2) Foto de perfil 800x800 (circular no YouTube)
perfil = f"""
<rect width="800" height="800" fill="url(#gFundo)"/>
{campo_estrelas(800, 800, 90)}
<circle cx="410" cy="400" r="330" fill="url(#gAura)"/>
<g transform="translate(400 400) scale(1.05) translate(-410 -400)">{mascote()}</g>
"""
salvar("perfil", svg(800, 800, perfil), 800, 800)


def wordmark(x, y, tam, anchor="start"):
    return (f'<text x="{x}" y="{y}" font-family="Unbounded" font-weight="800" '
            f'font-size="{tam}" fill="{BRANCO}" text-anchor="{anchor}" letter-spacing="{tam*0.02}">'
            f'DES<tspan fill="{VERMELHO}">C</tspan>IFRE</text>')


# 3) Logo horizontal (fundo transparente)
logo = f"""
<g transform="translate(0 10) scale(.5)">{mascote()}</g>
{wordmark(400, 250, 120)}
<text x="406" y="310" font-family="Poppins" font-weight="600" font-size="34"
 fill="{CIANO}" letter-spacing="14">DESCIFRE E DOMINE</text>
"""
salvar("logo", svg(1400, 420, logo), 1400, 420)

# 4) Banner do canal 2560x1440 (área segura central 1546x423)
banner = f"""
<rect width="2560" height="1440" fill="url(#gFundo)"/>
{campo_estrelas(2560, 1440, 420, seed=11)}
<circle cx="1280" cy="720" r="900" fill="url(#gAura)" opacity=".6"/>
<g opacity=".18" fill="none" stroke="{CIANO}" stroke-width="3">
  <circle cx="1280" cy="720" r="420"/><circle cx="1280" cy="720" r="560"/>
  <circle cx="1280" cy="720" r="700" stroke-dasharray="6 18"/>
</g>
{estrela4(560, 560, 30, CIANO)}{estrela4(2000, 880, 26, CIANO)}{estrela4(1980, 560, 16)}
<g transform="translate(520 440) scale(.7)">{mascote()}</g>
{wordmark(1090, 735, 138)}
<text x="1096" y="810" font-family="Poppins" font-weight="600" font-size="33"
 fill="{CIANO}" letter-spacing="6">PSICOLOGIA • COMPORTAMENTO • MENTE</text>
<text x="1096" y="605" font-family="Poppins" font-weight="600" font-size="36"
 fill="{VERMELHO}" letter-spacing="16">DESCIFRE E DOMINE</text>
"""
salvar("banner", svg(2560, 1440, banner), 2560, 1440)
