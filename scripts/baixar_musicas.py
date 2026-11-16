"""Baixa trilhas livres para public/musica (roda no GitHub Actions, que tem internet aberta).

Fonte: Kevin MacLeod / incompetech.com — licença Creative Commons BY 4.0 (uso livre, inclusive comercial,
com crédito). O crédito vai sozinho para a descrição do vídeo (publicar.py lê catalogo.json).
Cada faixa é normalizada (-16 LUFS) e salva como public/musica/<nome>.mp3; o roteiro escolhe com "trilha".
"""
import json
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "public" / "musica"
BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/"
# nome no Descifre: (título no incompetech, clima)
FAIXAS = {
    "suspense1": ("Unseen Horrors", "suspense"),
    "suspense2": ("Ice Flow", "suspense"),
    "suspense3": ("Interloper", "suspense"),
    "suspense4": ("Darkest Child", "terror"),
    "misterio2": ("Investigations", "misterio"),
    "misterio3": ("Mesmerize", "misterio"),
    "drama1": ("Lightless Dawn", "drama"),
    "drama2": ("Heavy Interlude", "drama"),
    "drama3": ("Stormfront", "drama"),
    "acao1": ("Volatile Reaction", "acao"),
    "acao2": ("Hitman", "acao"),
    "acao3": ("Exhilarate", "acao"),
    "scifi1": ("Cipher", "ficcao"),
    "scifi2": ("Space Fighter Loop", "ficcao"),
    "scifi3": ("Crypto", "ficcao"),
    "curioso1": ("Sneaky Snitch", "curioso"),
    "curioso2": ("Investigative Reporter", "curioso"),
}


def main():
    cat_p = PASTA / "catalogo.json"
    cat = json.loads(cat_p.read_text()) if cat_p.exists() else {}
    for nome, (titulo, clima) in FAIXAS.items():
        destino = PASTA / f"{nome}.mp3"
        if destino.exists() and nome in cat:
            continue
        url = BASE + urllib.parse.quote(titulo) + ".mp3"
        bruto = Path(f"/tmp/{nome}.mp3")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            bruto.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(bruto), "-af", "loudnorm=I=-16:TP=-1.5",
                            "-ar", "44100", "-ac", "2", "-b:a", "128k", str(destino)], check=True)
        except Exception as e:  # título errado / fora do ar: segue com as outras
            print(f"  FALHOU {nome} ({titulo}): {e}")
            continue
        cat[nome] = {"titulo": titulo, "clima": clima, "autor": "Kevin MacLeod", "fonte": url,
                     "licenca": "CC BY 4.0",
                     "credito": f"\"{titulo}\" — Kevin MacLeod (incompetech.com), licença CC BY 4.0 "
                                "(creativecommons.org/licenses/by/4.0)"}
        print(f"  ok {nome}: {titulo}")
    for velho, clima in (("leve", "leve"), ("misterio", "misterio"), ("tenso", "suspense")):
        cat.setdefault(velho, {"titulo": velho, "clima": clima, "autor": "Descifre (composição própria)", "licenca": "própria"})
    cat_p.write_text(json.dumps(cat, ensure_ascii=False, indent=1))
    print(f"{sum(1 for v in cat.values() if v.get('credito'))} trilhas CC BY no catálogo")


if __name__ == "__main__":
    main()
