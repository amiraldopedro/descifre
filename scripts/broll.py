"""Baixa um b-roll do Pixabay para cada cena (sem repetir clipes).

Uso: PIXABAY_API_KEY=... python scripts/broll.py 001
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CHAVE = os.environ.get("PIXABAY_API_KEY", "")
SEM_BROLL = {"mascote", "encerramento"}  # usam o fundo cósmico da marca


def buscar(termo, pagina=1):
    q = urllib.parse.urlencode({
        "key": CHAVE, "q": termo, "per_page": 20, "page": pagina,
        "safesearch": "true", "order": "popular", "video_type": "film",
    })
    with urllib.request.urlopen(f"https://pixabay.com/api/videos/?{q}", timeout=30) as r:
        return json.load(r).get("hits", [])


def escolher(hits, usados):
    for h in hits:
        if h["id"] in usados or h.get("duration", 0) < 5:
            continue
        v = h["videos"]
        # 1280x720 basta (o vídeo leva tinta e zoom) e deixa tudo mais rápido
        arq = v.get("medium") if v.get("medium", {}).get("url") else v.get("large")
        if arq and arq.get("url"):
            return h["id"], arq["url"]
    return None, None


def baixar(url, destino: Path):
    if destino.exists() and destino.stat().st_size > 10_000:
        return
    for i in range(4):
        try:
            urllib.request.urlretrieve(url, destino)
            return
        except Exception:
            time.sleep(2 ** i)
    raise RuntimeError(f"falha ao baixar {url}")


def main(vid):
    if not CHAVE:
        sys.exit("Defina PIXABAY_API_KEY")
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    pasta = RAIZ / "public" / "build" / vid / "broll"
    pasta.mkdir(parents=True, exist_ok=True)
    usados, tarefas, mapa = set(), [], {}
    for c in roteiro["cenas"]:
        if c["animacao"]["tipo"] in SEM_BROLL or not c.get("broll"):
            continue
        termos = [c["broll"], " ".join(c["broll"].split()[:1])]
        vid_id = url = None
        for t in termos:
            vid_id, url = escolher(buscar(t), usados)
            if url:
                break
            time.sleep(0.7)
        if not url:
            print(f"  cena {c['id']}: nada para '{c['broll']}', usa fundo da marca")
            continue
        usados.add(vid_id)
        destino = pasta / f"{c['id']:03d}.mp4"
        mapa[c["id"]] = f"build/{vid}/broll/{destino.name}"
        tarefas.append((url, destino))
        time.sleep(0.7)  # limite: 100 buscas/min
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(lambda a: baixar(*a), tarefas))
    (pasta / "mapa.json").write_text(json.dumps(mapa))
    print(f"b-roll pronto: {len(mapa)} clipes")


if __name__ == "__main__":
    main(sys.argv[1])
