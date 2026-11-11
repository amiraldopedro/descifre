"""Imagens de arquivo reais (domínio público) para as cenas com o campo "arquivo".

Uso: python scripts/arquivo.py 009   (roda depois do broll.py e substitui o clipe da cena)

No roteiro, por cena:
  "arquivo": {"busca": "universal newsreel 1938 radio panic", "fonte": "commons", "inicio": 12, "dur": 8}
  "arquivo": {"busca": "family listening radio", "fonte": "archive", "inicio": 545}
  "arquivo": {"commons": "File:Nome exato.jpg"}
  "arquivo": {"archive": "identificador_do_item", "inicio": 550}

  fonte "commons": Wikimedia Commons, só arquivos em domínio público ou CC0 (gravura, pintura, foto ou filme)
  fonte "archive": Internet Archive, coleções Prelinger e cinejornais (domínio público)
  imagem parada vira um clipe com movimento lento de câmera (Ken Burns); filme é cortado no trecho pedido.
Se nada for encontrado, a cena fica com o b-roll normal do Pixabay.
Os créditos vão para public/build/ID/creditos.json (para a descrição do vídeo).
"""
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "DescifreBot/1.0 (canal educativo; github.com/amiraldopedro/descifre)"}
LIVRE = ("public domain", "pd", "cc0", "cc-zero", "pdm")


def pegar(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return json.load(r)
        except Exception as e:
            print(f"  falhou {url[:90]}… ({e})")
            time.sleep(2 + 3 * i)
    return {}


def commons(busca=None, arquivo=None):
    """Devolve (url, tipo, crédito) de um arquivo livre do Commons."""
    base = "https://commons.wikimedia.org/w/api.php?"
    q = {"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|mime|extmetadata", "iiurlwidth": 2400}
    if arquivo:
        q["titles"] = arquivo
    else:
        q.update({"generator": "search", "gsrnamespace": 6, "gsrsearch": busca, "gsrlimit": 15})
    paginas = sorted(pegar(base + urllib.parse.urlencode(q)).get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    for p in paginas:
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = (meta.get("LicenseShortName", {}).get("value", "") + " " + meta.get("License", {}).get("value", "")).lower()
        if not any(l in lic for l in LIVRE):
            continue
        mime = info.get("mime", "")
        if mime.startswith("video"):
            return info["url"], "video", f"{p['title']} (Wikimedia Commons, domínio público)"
        if mime in ("image/jpeg", "image/png", "image/tiff"):
            return info.get("thumburl") or info["url"], "imagem", f"{p['title']} (Wikimedia Commons, domínio público)"
    return None


def archive(busca=None, ident=None):
    """Devolve (url, tipo, crédito) de um filme do Internet Archive."""
    if not ident:
        q = f"({busca}) AND mediatype:movies AND collection:(prelinger OR universal_newsreels OR newsandpublicaffairs)"
        r = pegar("https://archive.org/advancedsearch.php?" + urllib.parse.urlencode({"q": q, "fl[]": "identifier", "rows": 5, "output": "json"}))
        docs = r.get("response", {}).get("docs", [])
        if not docs:
            return None
        ident = docs[0]["identifier"]
    meta = pegar(f"https://archive.org/metadata/{ident}")
    arquivos = meta.get("files", [])
    preferidos = [f for f in arquivos if f.get("name", "").endswith(".mp4")] or [f for f in arquivos if f.get("format") in ("MPEG4", "h.264", "512Kb MPEG4")]
    if not preferidos:
        return None
    nome = sorted(preferidos, key=lambda f: int(f.get("size", 0) or 0))[-1]["name"]  # a melhor qualidade
    titulo = meta.get("metadata", {}).get("title", ident)
    return f"https://archive.org/download/{ident}/{urllib.parse.quote(nome)}", "video", f"{titulo} (Archival footage supplied by archive.org)"


def recortar(url, tipo, destino: Path, inicio=0, dur=8):
    escala = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"
    if tipo == "video":
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(inicio), "-i", url, "-t", str(dur), "-an",
               "-vf", f"{escala},fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", str(destino)]
    else:
        # imagem parada: aproxima devagar (Ken Burns), sem tremer
        n = int(dur * 30)
        bruto = destino.with_suffix(".img")
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            bruto.write_bytes(r.read())
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(bruto), "-t", str(dur),
               "-vf", f"scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,"
                      f"zoompan=z='1+0.12*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps=30,format=yuv420p",
               "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", str(destino)]
    try:
        subprocess.run(cmd, check=True, timeout=600)
        return destino.exists() and destino.stat().st_size > 20_000
    except Exception as e:
        print(f"  ffmpeg falhou: {e}")
        return False


def main(vid):
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    pasta = RAIZ / "public" / "build" / vid / "broll"
    pasta.mkdir(parents=True, exist_ok=True)
    mapa_p = pasta / "mapa.json"
    mapa = json.loads(mapa_p.read_text()) if mapa_p.exists() else {}
    creditos = []
    for c in roteiro["cenas"]:
        a = c.get("arquivo")
        if not a:
            continue
        achado = None
        if a.get("commons"):
            achado = commons(arquivo=a["commons"])
        elif a.get("archive"):
            achado = archive(ident=a["archive"])
        elif a.get("busca"):
            achado = archive(busca=a["busca"]) if a.get("fonte") == "archive" else commons(busca=a["busca"])
        if not achado:
            print(f"  cena {c['id']}: nada de arquivo para {a}, fica o b-roll normal")
            continue
        url, tipo, credito = achado
        destino = pasta / f"arq_{c['id']:03d}.mp4"
        if recortar(url, tipo, destino, a.get("inicio", 0), a.get("dur", 12)):
            mapa[str(c["id"])] = f"build/{vid}/broll/{destino.name}"
            creditos.append(credito)
            print(f"  cena {c['id']}: {credito}")
        time.sleep(1)
    mapa_p.write_text(json.dumps(mapa))
    (RAIZ / "public" / "build" / vid / "creditos.json").write_text(json.dumps(sorted(set(creditos)), ensure_ascii=False, indent=1))
    print(f"arquivo pronto: {len(creditos)} cenas com imagens reais")


if __name__ == "__main__":
    main(sys.argv[1])
