"""Compõe a trilha de fundo do Descifre (original, sem direitos autorais).

Clima: misterioso e calmo, Ré menor (Dm - Bb - F - C), pad suave,
arpejo leve tipo "caixinha" e grave discreto. Loop de 64 s.

Uso: python scripts/trilha.py  ->  public/musica/descifre_tema.mp3
"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 80
BATIDA = 60 / BPM
ACORDE_S = 8 * BATIDA  # 2 compassos por acorde (6 s)
RAIZ = Path(__file__).resolve().parent.parent

def nota(n):  # número MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)

# Dm, Bb, F, C (voicings próximos)
ACORDES = [
    [50, 57, 62, 65, 69],   # Dm
    [46, 53, 58, 62, 65],   # Bb
    [41, 53, 57, 60, 65],   # F
    [48, 55, 60, 64, 67],   # C
]
ARPEJO = [0, 1, 2, 3, 2, 1, 0, 2]  # índices dentro do acorde (oitava acima)


def envelope(n, ataque, soltura):
    e = np.ones(n)
    a, r = int(ataque * SR), int(soltura * SR)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def pad(freqs, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):  # leve desafinação = coro
            ff = f * 2 ** (det / 12)
            # dente de serra suavizado (poucos harmônicos)
            s += sum(np.sin(2 * np.pi * ff * k * t) / k for k in range(1, 6))
    s *= envelope(len(t), 1.8, 2.2)
    sos = butter(2, 1400, "low", fs=SR, output="sos")
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


def compor():
    voltas = 2  # 2 ciclos de 4 acordes = 48 s; somamos variação no 2º
    total = int(voltas * 4 * ACORDE_S * SR)
    mix = np.zeros((total, 2))
    pos = 0
    for v in range(voltas):
        for i, ac in enumerate(ACORDES):
            n0 = int(pos * SR)
            p = pad([nota(x) for x in ac[1:]], ACORDE_S + 2.2)
            g = grave(nota(ac[0] - 12), ACORDE_S + 1.0)
            for arr, ganho in ((p, 0.55), (g, 0.5)):
                fim = min(total, n0 + len(arr))
                mix[n0:fim, 0] += arr[: fim - n0] * ganho
                mix[n0:fim, 1] += arr[: fim - n0] * ganho
            # arpejo de sino (entra só na 2ª volta e de leve na 1ª)
            passos = 16
            for k in range(passos):
                if v == 0 and k % 4 != 0:
                    continue
                idx = ARPEJO[k % len(ARPEJO)]
                f = nota(ac[1:][idx] + 12)
                s = sino(f) * (0.16 if v else 0.11)
                ini = n0 + int(k * (ACORDE_S / passos) * SR)
                fim = min(total, ini + len(s))
                pan = 0.5 + 0.35 * np.sin(k)  # espalha no estéreo
                mix[ini:fim, 0] += s[: fim - ini] * (1 - pan)
                mix[ini:fim, 1] += s[: fim - ini] * pan
            pos += ACORDE_S
    # cauda do fim volta suave para o começo (loop sem emenda)
    cauda = int(2.5 * SR)
    mix[:cauda] += mix[-cauda:] * np.linspace(1, 0, cauda)[:, None]
    mix = mix[:-cauda] if len(mix) > cauda * 2 else mix
    mix[:, 0] = reverb(mix[:, 0])
    mix[:, 1] = reverb(mix[:, 1])
    mix /= np.max(np.abs(mix)) * 1.12
    return mix


def main():
    destino = RAIZ / "public" / "musica" / "descifre_tema.mp3"
    destino.parent.mkdir(parents=True, exist_ok=True)
    audio = (compor() * 32767).astype("<i2")
    proc = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
         "-af", "loudnorm=I=-20:TP=-2", "-b:a", "192k", str(destino)],
        input=audio.tobytes(), check=True,
    )
    print("trilha:", destino)


if __name__ == "__main__":
    main()
