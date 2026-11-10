"""Gera a narração cena por cena com tempos exatos de cada palavra.

Uso: python scripts/voz.py 001

Principal: Edge TTS (vozes neurais grátis da Microsoft), com WordBoundary.
Plano B: Piper (roda na própria máquina), com tempos de palavra estimados.
"""
import asyncio
import json
import random
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TAXA = "+6%"  # fala levemente mais rápida, melhor retenção
CONCORRENCIA = 3
TENTATIVAS = 5


async def edge_cena(texto, voz, mp3: Path, taxa=TAXA, tom="+0Hz"):
    import edge_tts

    com = edge_tts.Communicate(texto, voz, rate=taxa, pitch=tom, boundary="WordBoundary")
    palavras = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                t0 = ch["offset"] / 1e7
                palavras.append({"w": ch["text"], "t0": round(t0, 3), "t1": round(t0 + ch["duration"] / 1e7, 3)})
    if mp3.stat().st_size < 1000 or not palavras:
        raise RuntimeError("áudio vazio")
    return palavras


def duracao(mp3: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def estimar_palavras(texto, dur):
    """Distribui o tempo pelas palavras conforme o tamanho (plano B)."""
    ws = texto.split()
    pesos = [len(w) + 2 for w in ws]
    total = sum(pesos)
    t, out = 0.05, []
    for w, p in zip(ws, pesos):
        d = (dur - 0.1) * p / total
        out.append({"w": w, "t0": round(t, 3), "t1": round(t + d * 0.92, 3)})
        t += d
    return out


def piper_cena(texto, mp3: Path):
    modelo = RAIZ / "modelos" / "pt_BR-faber-medium.onnx"
    if not shutil.which("piper") or not modelo.exists():
        raise RuntimeError("Piper indisponível")
    wav = mp3.with_suffix(".wav")
    subprocess.run(["piper", "--model", str(modelo), "--output_file", str(wav)], input=texto, text=True, check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-b:a", "160k", str(mp3)], check=True)
    wav.unlink()
    return estimar_palavras(texto, duracao(mp3))


ELENCO = json.loads((RAIZ / "elenco.json").read_text())


def candidatos(cena, roteiro):
    """Vozes a tentar para a cena: a do personagem, a reserva dele e a padrão do canal."""
    quem = cena.get("quem", "cifrinho")
    ficha = ELENCO.get(quem, {})
    taxa_rot = roteiro.get("taxa", TAXA)
    lista = []
    if quem == "cifrinho":
        lista.append((roteiro.get("voz", ficha.get("voz", "pt-BR-AntonioNeural")), taxa_rot, ficha.get("tom", "+0Hz")))
    else:
        lista.append((ficha.get("voz", "pt-BR-AntonioNeural"), ficha.get("taxa", taxa_rot), ficha.get("tom", "+0Hz")))
        r = ficha.get("reserva")
        if r:
            lista.append((r["voz"], r.get("taxa", taxa_rot), r.get("tom", "+0Hz")))
        lista.append(("pt-BR-AntonioNeural", taxa_rot, "-10Hz"))
    return lista


async def processar(cena, roteiro, pasta: Path, sem):
    mp3 = pasta / f"{cena['id']:03d}.mp3"
    js = mp3.with_suffix(".json")
    if mp3.exists() and js.exists():
        return "cache"
    async with sem:
        erro = None
        for n, (voz, taxa, tom) in enumerate(candidatos(cena, roteiro)):
            for i in range(TENTATIVAS if n == 0 else 3):
                try:
                    palavras = await edge_cena(cena["texto"], voz, mp3, taxa, tom)
                    js.write_text(json.dumps(palavras, ensure_ascii=False))
                    await asyncio.sleep(0.4)  # não martelar o servidor
                    return "edge" if n == 0 else f"edge-reserva({voz})"
                except Exception as e:  # 403, voz inexistente, rede...
                    erro = e
                    await asyncio.sleep((2 ** i) + random.random())
            print(f"  cena {cena['id']}: voz {voz} falhou ({erro})")
        print(f"  cena {cena['id']}: Edge falhou; usando Piper")
        palavras = piper_cena(cena["texto"], mp3)
        js.write_text(json.dumps(palavras, ensure_ascii=False))
        return "piper"


async def main(vid):
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    pasta = RAIZ / "public" / "build" / vid / "voz"
    pasta.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCORRENCIA)
    res = await asyncio.gather(*[processar(c, roteiro, pasta, sem) for c in roteiro["cenas"]])
    print("voz pronta:", {k: res.count(k) for k in set(res)})


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
