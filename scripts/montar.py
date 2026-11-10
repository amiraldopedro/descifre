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


def main(vid, estimar_tempos=False):
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    build = RAIZ / "public" / "build" / vid
    voz_dir = build / "voz"
    mapa_path = build / "broll" / "mapa.json"
    mapa = json.loads(mapa_path.read_text()) if mapa_path.exists() else {}

    cenas, inicio, ultima_pergunta, trechos = [], 0, None, []
    for c in roteiro["cenas"]:
        anim = dict(c["animacao"])
        if anim["tipo"] == "pergunta":
            ultima_pergunta = {k: anim[k] for k in ("numero", "texto", "a", "b")}
        if anim["tipo"] == "contagem":
            anim["pergunta"] = ultima_pergunta

        mp3 = voz_dir / f"{c['id']:03d}.mp3"
        if not estimar_tempos and mp3.exists():
            fala_s = duracao(mp3)
            palavras = json.loads(mp3.with_suffix(".json").read_text())
            trechos.append((mp3, inicio / FPS))
        else:
            fala_s, palavras = estimar(c["texto"])

        pausa = PAUSA_CONTAGEM if anim["tipo"] == "contagem" else PAUSA
        if anim["tipo"] == "encerramento":
            pausa = 2.5
        fala = round(fala_s * FPS)
        dur = fala + round(pausa * FPS)
        cenas.append({
            "id": c["id"], "texto": c["texto"], "inicio": inicio, "duracao": dur, "fala": fala,
            "palavras": palavras, "broll": mapa.get(str(c["id"])), "animacao": anim,
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

    musica = next((f"musica/{p.name}" for p in sorted((RAIZ / "public" / "musica").glob("*.mp3"))), None)
    manifesto = {"id": vid, "titulo": roteiro["titulo"], "fps": FPS, "totalFrames": inicio,
                 "narracao": narracao, "musica": musica, "cenas": cenas}
    build.mkdir(parents=True, exist_ok=True)
    (build / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False))
    print(f"manifesto: {len(cenas)} cenas, {inicio} frames ({inicio / FPS / 60:.1f} min)")


if __name__ == "__main__":
    main(sys.argv[1], "--estimar" in sys.argv)
