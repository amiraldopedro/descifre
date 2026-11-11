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
SEM_BROLL = {"mascote", "encerramento", "documento", "capitulo", "fim", "vinheta"}  # usam o fundo da marca
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 descifre-bot"}


def buscar(termo, pagina=1):
    q = urllib.parse.urlencode({
        "key": CHAVE, "q": termo, "per_page": 20, "page": pagina,
        "safesearch": "true", "order": "popular", "video_type": "film",
    })
    req = urllib.request.Request(f"https://pixabay.com/api/videos/?{q}", headers=UA)
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r).get("hits", [])
        except Exception as e:
            print(f"  busca '{termo}' falhou ({e})")
            time.sleep(2 + 3 * i)
    return []


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
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r, open(destino, "wb") as f:
                while bloco := r.read(1 << 20):
                    f.write(bloco)
            return
        except Exception:
            time.sleep(2 ** i)
    print(f"  falha ao baixar {url}")
    destino.unlink(missing_ok=True)


def main(vid):
    if not CHAVE:
        sys.exit("Defina PIXABAY_API_KEY")
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    pasta = RAIZ / "public" / "build" / vid / "broll"
    pasta.mkdir(parents=True, exist_ok=True)
    usados, tarefas, mapa = set(), [], {}
    for c in roteiro["cenas"]:
        if c.get("animacao", {}).get("tipo") in SEM_BROLL or not c.get("broll"):
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
    # remove do mapa o que não baixou (a cena usa o Cifrinho no lugar)
    mapa = {k: v for k, v in mapa.items() if (RAIZ / "public" / v).exists()}
    (pasta / "mapa.json").write_text(json.dumps(mapa))
    print(f"b-roll pronto: {len(mapa)} clipes")


if __name__ == "__main__":
    main(sys.argv[1])
