"""Junta o vídeo mudo com narração, efeitos e música (ducking sob a voz).

Uso: python scripts/mixar.py ID out/video_mudo.mp4 out/final.mp4
Volumes por formato: o Short é mais "barulhento" (dopamina), o longo é mais discreto.
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
VOL = {"short": {"musica": 0.45, "sfx": 0.7}, "longo": {"musica": 0.35, "sfx": 0.32}}


def main(vid, mudo, saida):
    m = json.loads((RAIZ / "public" / "build" / vid / "manifest.json").read_text())
    v = VOL["short" if m.get("formato") == "short" else "longo"]
    ent = ["-i", mudo, "-i", str(RAIZ / "public" / m["narracao"])]
    filtros = ["[1:a]aformat=channel_layouts=stereo,asplit=2[v1][v2]"]
    mix = ["[v1]"]
    n = 2
    if m.get("sfx") and (RAIZ / "public" / m["sfx"]).exists():
        ent += ["-i", str(RAIZ / "public" / m["sfx"])]
        filtros.append(f"[{n}:a]volume={v['sfx']},aformat=channel_layouts=stereo[fx]")
        mix.append("[fx]")
        n += 1
    if m.get("musica") and (RAIZ / "public" / m["musica"]).exists():
        ent += ["-stream_loop", "-1", "-ss", str(m.get("musica_inicio", 0)), "-i", str(RAIZ / "public" / m["musica"])]
        cat_p = RAIZ / "public" / "musica" / "catalogo.json"
        ganho = 1.0
        if cat_p.exists():  # trilhas baixadas são normalizadas mais altas (-16 LUFS) que as próprias (~-20)
            ganho = json.loads(cat_p.read_text()).get(Path(m["musica"]).stem, {}).get("ganho", 0.65 if "credito" in json.loads(cat_p.read_text()).get(Path(m["musica"]).stem, {}) else 1.0)
        filtros.append(f"[{n}:a]volume={v['musica'] * ganho:.3f},aformat=channel_layouts=stereo[m]")
        filtros.append("[m][v2]sidechaincompress=threshold=0.02:ratio=9:attack=70:release=600[md]")
        mix.append("[md]")
    else:
        filtros.append("[v2]anullsink")
    filtros.append(f"{''.join(mix)}amix=inputs={len(mix)}:duration=first:normalize=0[a]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ent, "-filter_complex", ";".join(filtros),
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", saida], check=True)
    print(f"mix: {len(mix)} faixas ({'short' if m.get('formato') == 'short' else 'longo'})")


if __name__ == "__main__":
    main(*sys.argv[1:4])
