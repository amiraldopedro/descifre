"""Coleta diária dos números do canal para o painel → docs/dados/canal.json

Usa a YouTube Data API (vídeos, inscritos) e a YouTube Analytics API (views por dia, tempo assistido,
retenção, de onde vem o público). Também atualiza a fila: vídeos que já estão públicos viram "publicado".
"""
import datetime as dt
import json
import os
import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

sys.path.insert(0, str(Path(__file__).resolve().parent))
import painel  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "docs" / "dados" / "canal.json"


def apis():
    cred = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], client_id=os.environ["YT_CLIENT_ID"],
                       client_secret=os.environ["YT_CLIENT_SECRET"], token_uri="https://oauth2.googleapis.com/token")
    return (build("youtube", "v3", credentials=cred, cache_discovery=False),
            build("youtubeAnalytics", "v2", credentials=cred, cache_discovery=False))


def tabela(r):
    if not r:
        return []
    cols = [c["name"] for c in r.get("columnHeaders", [])]
    return [dict(zip(cols, linha)) for linha in r.get("rows", []) or []]


def relatorio(an, avisos, **q):
    try:
        return tabela(an.reports().query(ids="channel==MINE", **q).execute())
    except Exception as e:  # alguma métrica pode não existir para canais pequenos
        avisos.append(f"{q.get('metrics')} / {q.get('dimensions', '')}: {str(e)[:160]}")
        return []


def limpa(t):
    return t.lower().replace("#shorts", "").strip()


def main():
    yt, an = apis()
    hoje = dt.date.today()
    ini90, ini28 = (hoje - dt.timedelta(days=90)).isoformat(), (hoje - dt.timedelta(days=28)).isoformat()
    avisos = []

    canal = yt.channels().list(part="snippet,statistics,contentDetails", mine=True).execute()["items"][0]
    uploads = canal["contentDetails"]["relatedPlaylists"]["uploads"]
    ids, token = [], None
    while len(ids) < 300:
        r = yt.playlistItems().list(part="contentDetails", playlistId=uploads, maxResults=50, pageToken=token).execute()
        ids += [i["contentDetails"]["videoId"] for i in r.get("items", [])]
        token = r.get("nextPageToken")
        if not token:
            break
    videos = []
    for i in range(0, len(ids), 50):
        r = yt.videos().list(part="snippet,statistics,status,contentDetails", id=",".join(ids[i:i + 50])).execute()
        for v in r.get("items", []):
            s, st = v["snippet"], v.get("statistics", {})
            videos.append({"youtube_id": v["id"], "titulo": s["title"], "publicado": s["publishedAt"],
                           "privacidade": v["status"]["privacyStatus"], "agendado_para": v["status"].get("publishAt"),
                           "views": int(st.get("viewCount", 0)), "curtidas": int(st.get("likeCount", 0) or 0),
                           "comentarios": int(st.get("commentCount", 0) or 0),
                           "duracao": v.get("contentDetails", {}).get("duration")})

    por_dia = relatorio(an, avisos, startDate=ini90, endDate=hoje.isoformat(), dimensions="day", sort="day",
                        metrics="views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments")
    por_video = relatorio(an, avisos, startDate="2020-01-01", endDate=hoje.isoformat(), dimensions="video", sort="-views",
                          maxResults=200, metrics="views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares")
    impressoes = relatorio(an, avisos, startDate="2020-01-01", endDate=hoje.isoformat(), dimensions="video", sort="-videoThumbnailImpressions",
                           maxResults=200, metrics="videoThumbnailImpressions,videoThumbnailImpressionsClickRate")
    fontes = relatorio(an, avisos, startDate=ini28, endDate=hoje.isoformat(), dimensions="insightTrafficSourceType", sort="-views", metrics="views,estimatedMinutesWatched")
    paises = relatorio(an, avisos, startDate=ini28, endDate=hoje.isoformat(), dimensions="country", sort="-views", maxResults=10, metrics="views")
    publico = relatorio(an, avisos, startDate=ini90, endDate=hoje.isoformat(), dimensions="ageGroup,gender", metrics="viewerPercentage")
    tipo_conteudo = relatorio(an, avisos, startDate=ini28, endDate=hoje.isoformat(), dimensions="creatorContentType", metrics="views,estimatedMinutesWatched,subscribersGained")

    extra = {r["video"]: r for r in por_video}
    for r in impressoes:
        extra.setdefault(r["video"], {}).update(r)
    for v in videos:
        v.update({k: val for k, val in extra.get(v["youtube_id"], {}).items() if k != "video"})

    # retenção dos 8 vídeos públicos mais recentes
    retencao = {}
    for v in [v for v in videos if v["privacidade"] == "public"][:8]:
        linhas = relatorio(an, avisos, startDate="2020-01-01", endDate=hoje.isoformat(), dimensions="elapsedVideoTimeRatio",
                           filters=f"video=={v['youtube_id']}", metrics="audienceWatchRatio")
        if linhas:
            retencao[v["youtube_id"]] = [[round(l["elapsedVideoTimeRatio"], 2), round(l["audienceWatchRatio"], 3)] for l in linhas]

    # liga a fila aos vídeos do canal
    f = painel.carregar()
    por_titulo = {limpa(v["titulo"]): v for v in videos}
    por_id = {v["youtube_id"]: v for v in videos}
    for it in f["itens"]:
        v = por_id.get(it.get("youtube_id")) or por_titulo.get(limpa(it.get("titulo", "")))
        if not v:
            continue
        it["youtube_id"] = v["youtube_id"]
        it["views"] = v["views"]
        if v["privacidade"] == "public" and it.get("status") != "publicado":
            it["status"] = "publicado"
            it["publicado_em"] = v["publicado"]
            it.setdefault("historico", []).append({"quando": painel.agora(), "status": "publicado"})
        elif v.get("agendado_para") and it.get("status") not in ("agendado",):
            it["status"] = "agendado"
            it["agendado_para"] = v["agendado_para"]
    painel.salvar(f)

    st = canal["statistics"]
    SAIDA.write_text(json.dumps({
        "atualizado": painel.agora(),
        "canal": {"nome": canal["snippet"]["title"], "inscritos": int(st.get("subscriberCount", 0)),
                  "views": int(st.get("viewCount", 0)), "videos": int(st.get("videoCount", 0)),
                  "foto": canal["snippet"]["thumbnails"].get("default", {}).get("url")},
        "por_dia": por_dia, "videos": videos, "fontes": fontes, "paises": paises, "publico": publico,
        "tipo_conteudo": tipo_conteudo, "retencao": retencao, "avisos": avisos,
    }, ensure_ascii=False, indent=1))
    print(f"canal: {st.get('subscriberCount')} inscritos, {len(videos)} vídeos; avisos: {len(avisos)}")
    for a in avisos:
        print("  aviso:", a)


if __name__ == "__main__":
    main()
