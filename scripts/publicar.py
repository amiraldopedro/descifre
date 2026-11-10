"""Posta o vídeo no YouTube (com capítulos automáticos e thumbnail).

Uso: python scripts/publicar.py 001 out/final.mp4 out/thumb.png [privado|nao_listado|publico] [AAAA-MM-DDTHH:MM:SSZ]

Variáveis (Secrets do GitHub): YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
"""
import json
import os
import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

RAIZ = Path(__file__).resolve().parent.parent
PRIVACIDADE = {"privado": "private", "nao_listado": "unlisted", "publico": "public"}


def capitulos(manifesto):
    """Capítulos a partir das cenas-chave (o YouTube exige começar em 0:00)."""
    fps = manifesto["fps"]
    linhas = ["0:00 Introdução"]
    for c in manifesto["cenas"]:
        a = c["animacao"]
        nome = None
        if a["tipo"] == "pergunta":
            nome = f"Situação {a['numero']}"
        elif a["tipo"] == "mascote" and "pontos" in a.get("texto", "").lower():
            nome = "Resultado"
        elif a["tipo"] == "mascote" and "escudo" in a.get("texto", "").lower():
            nome = "Como se proteger"
        if nome:
            s = int(c["inicio"] / fps)
            linhas.append(f"{s // 60}:{s % 60:02d} {nome}")
    return "\n".join(linhas)


def main(vid, video, thumb, privacidade="privado", agendar=None):
    meta = json.loads((RAIZ / "roteiros" / f"{vid}.meta.json").read_text())
    man = json.loads((RAIZ / "public" / "build" / vid / "manifest.json").read_text())
    cred = Credentials(
        None,
        refresh_token=os.environ["YT_REFRESH_TOKEN"],
        client_id=os.environ["YT_CLIENT_ID"],
        client_secret=os.environ["YT_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
    )
    yt = build("youtube", "v3", credentials=cred)
    status = {"privacyStatus": PRIVACIDADE[privacidade], "selfDeclaredMadeForKids": False,
              "containsSyntheticMedia": True}
    if agendar:  # agenda: precisa subir como privado com publishAt
        status.update(privacyStatus="private", publishAt=agendar)
    corpo = {
        "snippet": {
            "title": meta["titulo"][:100],
            "description": meta["descricao"].replace("{capitulos}", capitulos(man))[:5000],
            "tags": meta["tags"],
            "categoryId": meta.get("categoria", "27"),
            "defaultLanguage": "pt-BR",
            "defaultAudioLanguage": "pt-BR",
        },
        "status": status,
    }
    req = yt.videos().insert(part="snippet,status", body=corpo,
                             media_body=MediaFileUpload(video, chunksize=8 * 1024 * 1024, resumable=True))
    resp = None
    while resp is None:
        prog, resp = req.next_chunk()
        if prog:
            print(f"  enviando... {int(prog.progress() * 100)}%")
    vid_id = resp["id"]
    print(f"vídeo enviado: https://youtu.be/{vid_id} ({status['privacyStatus']})")
    try:
        yt.thumbnails().set(videoId=vid_id, media_body=MediaFileUpload(thumb)).execute()
        print("thumbnail definida")
    except Exception as e:  # canal sem verificação por telefone não aceita thumbnail personalizada
        print(f"aviso: thumbnail não aplicada ({e})")


if __name__ == "__main__":
    main(*sys.argv[1:])
