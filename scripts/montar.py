"""Monta o manifesto do vídeo (tempos de cada cena) e a faixa única de narração.

Uso:
  python scripts/montar.py 001            # usa a voz gerada em public/build/001/voz
  python scripts/montar.py 001 --estimar  # sem voz (prévia): estima os tempos
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FPS = 30
PAUSA = 0.35  # respiro entre cenas (s)
PAUSA_CONTAGEM = 3.0  # tempo do "PENSE..." (s)
PALAVRAS_POR_SEG = 2.7


def duracao(p: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def estimar(texto):
    ws = texto.split()
    dur = max(1.2, len(ws) / PALAVRAS_POR_SEG)
    pesos = [len(w) + 2 for w in ws]
    tot, t, out = sum(pesos), 0.05, []
    for w, p in zip(ws, pesos):
        d = dur * p / tot
        out.append({"w": w, "t0": round(t, 3), "t1": round(t + d * 0.9, 3)})
        t += d
    return dur + 0.1, out


def sfx_short(cenas, destino: Path):
    """Efeitos sonoros sintetizados: whoosh nos cortes, tique na contagem, 'ding' na revelação."""
    import numpy as np
    sr = 44100
    total = int((cenas[-1]["inicio"] + cenas[-1]["duracao"]) / FPS * sr) + sr
    trilha = np.zeros(total)
    rng = np.random.default_rng(3)

    def whoosh(d=0.35):
        n = int(d * sr); t = np.linspace(0, 1, n)
        ruido = rng.standard_normal(n)
        # filtro passa-baixa variável simples (média móvel cada vez menor = sobe o brilho)
        out = np.convolve(ruido, np.ones(8) / 8, "same") * np.sin(np.pi * t) ** 2
        return out * 0.35

    def tique(f=1800, d=0.06):
        t = np.arange(int(d * sr)) / sr
        return np.sin(2 * np.pi * f * t) * np.exp(-t * 60) * 0.5

    def ding(d=0.9):
        t = np.arange(int(d * sr)) / sr
        return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1976 * t)) * np.exp(-t * 5) * 0.35

    def boom(d=0.5):
        t = np.arange(int(d * sr)) / sr
        return np.sin(2 * np.pi * (90 - 50 * t) * t) * np.exp(-t * 7) * 0.7

    def por(som, seg):
        i = int(seg * sr); f = min(total, i + len(som)); trilha[i:f] += som[: f - i]

    for c in cenas:
        t0 = c["inicio"] / FPS
        tipo = c["animacao"]["tipo"]
        por(whoosh(), max(0, t0 - 0.12))
        if tipo in ("gancho", "cta"):
            por(boom(), t0)
        if tipo == "conceito":
            por(ding(), t0 + 0.05)
        if tipo == "contagem":
            fim = (c["inicio"] + c["duracao"]) / FPS
            for k in range(1, 4):
                por(tique(2000 if k < 3 else 2600), fim - k * 0.66)
    trilha = (trilha / max(1e-6, np.abs(trilha).max()) * 0.8 * 32767).astype("<i2")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "-",
                    "-b:a", "160k", str(destino)], input=trilha.tobytes(), check=True)


def main(vid, estimar_tempos=False):
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    short = roteiro.get("formato") == "short"
    build = RAIZ / "public" / "build" / vid
    voz_dir = build / "voz"
    mapa_path = build / "broll" / "mapa.json"
    mapa = json.loads(mapa_path.read_text()) if mapa_path.exists() else {}

    cenas, inicio, ultima_pergunta, trechos = [], 0, None, []
    apresentados = set()
    em_cena = {}  # personagem -> último gesto (para entradas e transição de pose)
    for c in roteiro["cenas"]:
        anim = dict(c["animacao"])
        if anim["tipo"] == "pergunta":
            ultima_pergunta = {k: anim.get(k, 0) for k in ("numero", "texto", "a", "b")}
        if anim["tipo"] == "contagem":
            anim["pergunta"] = ultima_pergunta

        mp3 = voz_dir / f"{c['id']:03d}.mp3"
        if not estimar_tempos and mp3.exists():
            fala_s = duracao(mp3)
            palavras = json.loads(mp3.with_suffix(".json").read_text())
            trechos.append((mp3, inicio / FPS))
        else:
            fala_s, palavras = estimar(c["texto"])

        if short:
            pausa = 2.0 if anim["tipo"] == "contagem" else (1.2 if anim["tipo"] == "cta" else 0.08)
        else:
            pausa = PAUSA_CONTAGEM if anim["tipo"] == "contagem" else PAUSA
        if anim["tipo"] == "encerramento":
            pausa = 2.5
        atores, agora = [], {}
        for a in c.get("personagens", []):
            a = dict(a)
            a["novo"] = a["id"] not in em_cena
            a["apresentar"] = a["id"] not in apresentados
            apresentados.add(a["id"])
            if not a["novo"]:
                a["gestoAnterior"] = em_cena[a["id"]]
            agora[a["id"]] = a.get("gesto", "explicar" if a["id"] == c.get("quem", "cifrinho") else "parado")
            a.setdefault("gesto", agora[a["id"]])
            atores.append(a)
        em_cena = agora
        fala = round(fala_s * FPS)
        dur = fala + round(pausa * FPS)
        cenas.append({
            "id": c["id"], "texto": c["texto"], "inicio": inicio, "duracao": dur, "fala": fala,
            "palavras": palavras, "broll": mapa.get(str(c["id"])), "animacao": anim,
            "quem": c.get("quem", "cifrinho"), "personagens": atores,
            "brollFrames": int(duracao(RAIZ / "public" / mapa[str(c["id"])]) * FPS) if str(c["id"]) in mapa else 0,
        })
        inicio += dur

    narracao = None
    if trechos:
        # junta todas as falas numa faixa só, cada uma no seu tempo exato
        saida = build / "narracao.mp3"
        entradas, filtros = [], []
        for i, (p, t) in enumerate(trechos):
            entradas += ["-i", str(p)]
            ms = int(t * 1000)
            filtros.append(f"[{i}:a]adelay={ms}|{ms}[a{i}]")
        mix = "".join(f"[a{i}]" for i in range(len(trechos)))
        filtros.append(f"{mix}amix=inputs={len(trechos)}:normalize=0,loudnorm=I=-16:TP=-1.5[out]")
        script = build / "filtro.txt"
        script.write_text(";".join(filtros))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex_script", str(script),
                        "-map", "[out]", "-ar", "48000", "-b:a", "192k", str(saida)], check=True)
        narracao = f"build/{vid}/narracao.mp3"

    sfx = None
    if short:
        build.mkdir(parents=True, exist_ok=True)
        sfx_short(cenas, build / "sfx.mp3")
        sfx = f"build/{vid}/sfx.mp3"

    trilha = roteiro.get("trilha", "misterio")
    musica = f"musica/{trilha}.mp3" if (RAIZ / "public" / "musica" / f"{trilha}.mp3").exists() else None
    manifesto = {"id": vid, "titulo": roteiro["titulo"], "fps": FPS, "totalFrames": inicio,
                 "narracao": narracao, "musica": musica, "sfx": sfx,
                 "formato": roteiro.get("formato", "longo"), "cenas": cenas}
    build.mkdir(parents=True, exist_ok=True)
    (build / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False))
    print(f"manifesto: {len(cenas)} cenas, {inicio} frames ({inicio / FPS / 60:.1f} min)")


if __name__ == "__main__":
    main(sys.argv[1], "--estimar" in sys.argv)
