"""Compõe a trilha de fundo do Descifre (original, sem direitos autorais).

Três climas (misterio, tenso, leve), todos em loop sem emenda.
O roteiro escolhe com o campo "trilha".

Uso: python scripts/trilha.py  ->  public/musica/<clima>.mp3
"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
RAIZ = Path(__file__).resolve().parent.parent

def nota(n):  # número MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)

# Climas: cada um com acordes, andamento, brilho e densidade do arpejo
CLIMAS = {
    # misterioso e calmo (padrão do canal)
    "misterio": {"bpm": 80, "corte": 1400, "sino": (0.11, 0.16), "pulso": 0.0,
                 "acordes": [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]]},
    # tenso: golpes, manipulação, alerta (grave pulsando, pouco brilho)
    "tenso": {"bpm": 96, "corte": 1000, "sino": (0.05, 0.09), "pulso": 0.5,
              "acordes": [[38, 57, 62, 65, 69], [43, 55, 58, 62, 67], [46, 53, 58, 62, 65], [45, 52, 57, 61, 64]]},
    # leve: curiosidades, entrevistas, humor (maior, mais rápido, sino presente)
    "leve": {"bpm": 104, "corte": 2200, "sino": (0.15, 0.19), "pulso": 0.18,
             "acordes": [[41, 53, 57, 60, 65], [48, 55, 60, 64, 67], [50, 57, 62, 65, 69], [46, 53, 58, 62, 65]]},
}
ARPEJO = [0, 1, 2, 3, 2, 1, 0, 2]


def envelope(n, ataque, soltura):
    e = np.ones(n)
    a, r = int(ataque * SR), int(soltura * SR)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def pad(freqs, dur, corte=1400):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):  # leve desafinação = coro
            ff = f * 2 ** (det / 12)
            # dente de serra suavizado (poucos harmônicos)
            s += sum(np.sin(2 * np.pi * ff * k * t) / k for k in range(1, 6))
    s *= envelope(len(t), 1.8, 2.2)
    sos = butter(2, corte, "low", fs=SR, output="sos")
    return sosfilt(sos, s) / (len(freqs) * 9)


def sino(f, dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.01 * t) + 0.12 * np.sin(2 * np.pi * f * 3.98 * t)
    return s * np.exp(-t * 3.2) * envelope(len(t), 0.004, 0.2)


def grave(f, dur):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * f * t) * envelope(len(t), 0.4, 1.0) * 0.5


def reverb(x, wet=0.35):
    """Reverb simples com ecos espaçados (pentes) + filtro."""
    y = x.copy()
    for atraso, ganho in [(0.031, 0.5), (0.047, 0.42), (0.071, 0.36), (0.113, 0.3), (0.173, 0.24), (0.29, 0.18)]:
        d = int(atraso * SR)
        eco = np.zeros_like(x)
        eco[d:] = x[:-d] * ganho
        y += eco
    sos = butter(2, 3500, "low", fs=SR, output="sos")
    return (1 - wet) * x + wet * sosfilt(sos, y)


def compor(clima):
    c = CLIMAS[clima]
    acorde_s = 8 * 60 / c["bpm"]  # 2 compassos por acorde
    voltas = 2
    total = int(voltas * 4 * acorde_s * SR)
    mix = np.zeros((total, 2))
    pos = 0
    for v in range(voltas):
        for ac in c["acordes"]:
            n0 = int(pos * SR)
            p = pad([nota(x) for x in ac[1:]], acorde_s + 2.2, c["corte"])
            g = grave(nota(ac[0] - 12 if ac[0] > 45 else ac[0]), acorde_s + 1.0)
            for arr, ganho in ((p, 0.55), (g, 0.5)):
                fim = min(total, n0 + len(arr))
                mix[n0:fim, 0] += arr[: fim - n0] * ganho
                mix[n0:fim, 1] += arr[: fim - n0] * ganho
            passos = 16
            for k in range(passos):
                ini = n0 + int(k * (acorde_s / passos) * SR)
                if c["pulso"] and k % 2 == 0:  # grave pulsando
                    t = np.arange(int(0.3 * SR)) / SR
                    pl = np.sin(2 * np.pi * nota(ac[0] if ac[0] < 45 else ac[0] - 12) * t) * np.exp(-t * 11) * c["pulso"]
                    fim = min(total, ini + len(pl))
                    mix[ini:fim, 0] += pl[: fim - ini]
                    mix[ini:fim, 1] += pl[: fim - ini]
                if v == 0 and k % 4 != 0:
                    continue
                f = nota(ac[1:][ARPEJO[k % len(ARPEJO)]] + 12)
                s = sino(f) * c["sino"][v]
                fim = min(total, ini + len(s))
                pan = 0.5 + 0.35 * np.sin(k)
                mix[ini:fim, 0] += s[: fim - ini] * (1 - pan)
                mix[ini:fim, 1] += s[: fim - ini] * pan
            pos += acorde_s
    cauda = int(2.5 * SR)  # a cauda do fim volta para o começo: loop sem emenda
    mix[:cauda] += mix[-cauda:] * np.linspace(1, 0, cauda)[:, None]
    mix = mix[:-cauda]
    mix[:, 0] = reverb(mix[:, 0])
    mix[:, 1] = reverb(mix[:, 1])
    mix /= np.max(np.abs(mix)) * 1.12
    return mix


def main():
    pasta = RAIZ / "public" / "musica"
    pasta.mkdir(parents=True, exist_ok=True)
    for clima in CLIMAS:
        audio = (compor(clima) * 32767).astype("<i2")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
             "-af", "loudnorm=I=-20:TP=-2", "-b:a", "192k", str(pasta / f"{clima}.mp3")],
            input=audio.tobytes(), check=True,
        )
        print("trilha:", clima)


if __name__ == "__main__":
    main()
