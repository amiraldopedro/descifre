"""Buscador de canais em alta: vídeos recentes que estouraram, comparados com o tamanho do canal.

Uso (no GitHub Actions, com as credenciais do YouTube):
  python scripts/buscador.py --termos "psicologia,curiosidades" --dias 21 --tipo shorts --regiao BR --idioma pt

Para cada termo, busca os vídeos mais vistos publicados nos últimos N dias, pega views, inscritos e idade
do canal, e calcula:
  - views por dia
  - "estouro" = views do vídeo ÷ inscritos do canal (10x = fez 10 vezes o tamanho do canal)
  - canal novo = criado há menos de 180 dias ou com menos de 60 vídeos
Saída: relatorios/buscador/<data>.json e .html (página com filtro e ordenação) + top 40 no log.
"""
import argparse
import datetime as dt
import html
import json
import os
import re
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

RAIZ = Path(__file__).resolve().parent.parent
PADRAO = "psicologia,curiosidades,teste psicológico,ilusão de ótica,mente humana,comportamento humano,história sombria,mistério,experimento,documentário"


def yt():
    chave = os.environ.get("YT_API_KEY")
    if chave:  # chave simples da YouTube Data API (só leitura)
        return build("youtube", "v3", developerKey=chave, cache_discovery=False)
    cred = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], client_id=os.environ["YT_CLIENT_ID"],
                       client_secret=os.environ["YT_CLIENT_SECRET"], token_uri="https://oauth2.googleapis.com/token",
                       scopes=["https://www.googleapis.com/auth/youtube"])
    return build("youtube", "v3", credentials=cred, cache_discovery=False)


def segundos(iso):
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def lotes(lista, n=50):
    for i in range(0, len(lista), n):
        yield lista[i:i + n]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--termos", default=PADRAO)
    ap.add_argument("--dias", type=int, default=21)
    ap.add_argument("--tipo", default="todos", choices=["shorts", "longos", "todos"])
    ap.add_argument("--regiao", default="BR")
    ap.add_argument("--idioma", default="pt")
    ap.add_argument("--min-views", type=int, default=50000)
    a = ap.parse_args()

    api = yt()
    agora = dt.datetime.now(dt.timezone.utc)
    desde = (agora - dt.timedelta(days=a.dias)).strftime("%Y-%m-%dT%H:%M:%SZ")
    termos = [t.strip() for t in a.termos.split(",") if t.strip()]

    achados = {}  # videoId -> termo
    for t in termos:
        q = dict(part="id", q=t, type="video", order="viewCount", publishedAfter=desde, maxResults=50,
                 regionCode=a.regiao, relevanceLanguage=a.idioma)
        if a.tipo == "shorts":
            q["videoDuration"] = "short"
        elif a.tipo == "longos":
            q["videoDuration"] = "medium"
        for pagina in range(2):
            r = api.search().list(**q).execute()
            for it in r.get("items", []):
                achados.setdefault(it["id"]["videoId"], t)
            if not r.get("nextPageToken"):
                break
            q["pageToken"] = r["nextPageToken"]
        print(f"  {t}: {len(achados)} vídeos até agora")

    videos = []
    for lote in lotes(list(achados)):
        r = api.videos().list(part="snippet,statistics,contentDetails", id=",".join(lote)).execute()
        videos += r.get("items", [])

    canais = {}
    ids_canais = list({v["snippet"]["channelId"] for v in videos})
    for lote in lotes(ids_canais):
        r = api.channels().list(part="snippet,statistics", id=",".join(lote)).execute()
        for c in r.get("items", []):
            canais[c["id"]] = c

    linhas = []
    for v in videos:
        s, st = v["snippet"], v.get("statistics", {})
        dur = segundos(v.get("contentDetails", {}).get("duration"))
        if a.tipo == "shorts" and dur > 180:
            continue
        if a.tipo == "longos" and dur <= 180:
            continue
        views = int(st.get("viewCount", 0))
        if views < a.min_views:
            continue
        c = canais.get(s["channelId"], {})
        cst = c.get("statistics", {})
        insc = int(cst.get("subscriberCount", 0) or 0) if not cst.get("hiddenSubscriberCount") else 0
        nvid = int(cst.get("videoCount", 0) or 0)
        criado = c.get("snippet", {}).get("publishedAt")
        idade_canal = (agora - dt.datetime.fromisoformat(criado.replace("Z", "+00:00"))).days if criado else None
        idade = max(0.5, (agora - dt.datetime.fromisoformat(s["publishedAt"].replace("Z", "+00:00"))).total_seconds() / 86400)
        linhas.append({
            "video": s["title"], "id": v["id"], "canal": s["channelTitle"], "canal_id": s["channelId"],
            "termo": achados[v["id"]], "views": views, "curtidas": int(st.get("likeCount", 0) or 0),
            "comentarios": int(st.get("commentCount", 0) or 0), "dias": round(idade, 1),
            "views_dia": int(views / idade), "inscritos": insc, "estouro": round(views / insc, 1) if insc else None,
            "videos_canal": nvid, "idade_canal_dias": idade_canal,
            "canal_novo": bool((idade_canal is not None and idade_canal < 180) or nvid < 60),
            "segundos": dur, "short": dur <= 180, "publicado": s["publishedAt"][:10],
        })

    linhas.sort(key=lambda x: ((x["estouro"] or 0) * 0.6 + x["views_dia"] / 20000), reverse=True)
    pasta = RAIZ / "relatorios" / "buscador"
    pasta.mkdir(parents=True, exist_ok=True)
    nome = agora.strftime("%Y-%m-%d_%H%M")
    filtro = {"termos": termos, "dias": a.dias, "tipo": a.tipo, "regiao": a.regiao, "idioma": a.idioma, "min_views": a.min_views, "gerado": agora.isoformat()}
    (pasta / f"{nome}.json").write_text(json.dumps({"filtro": filtro, "linhas": linhas}, ensure_ascii=False, indent=1))
    (pasta / f"{nome}.html").write_text(pagina(filtro, linhas))
    (pasta / "ultimo.html").write_text(pagina(filtro, linhas))
    painel_p = RAIZ / "docs" / "dados" / "ideias.json"  # aba "Ideias" do painel
    painel_p.parent.mkdir(parents=True, exist_ok=True)
    painel_p.write_text(json.dumps({"filtro": filtro, "linhas": linhas[:150]}, ensure_ascii=False, indent=1))

    print(f"\n{len(linhas)} vídeos estourados. Top 40:")
    for x in linhas[:40]:
        e = f"{x['estouro']}x" if x["estouro"] else "?"
        print(f"  {e:>7} | {x['views']:>10,} views | {x['views_dia']:>8,}/dia | {x['inscritos']:>9,} insc | {'NOVO ' if x['canal_novo'] else ''}{x['canal']} | {x['video'][:70]}")


def pagina(filtro, linhas):
    dados = json.dumps(linhas, ensure_ascii=False).replace("</", "<\\/")
    titulo = f"Canais em alta: últimos {filtro['dias']} dias ({filtro['tipo']})"
    return f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(titulo)}</title>
<style>
body{{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0B1030;color:#EEF1FF}}
header{{padding:24px 28px 8px}} h1{{margin:0 0 6px;font-size:24px}} .sub{{color:#9AA3D6;font-size:14px}}
.barra{{display:flex;flex-wrap:wrap;gap:10px;padding:12px 28px;align-items:center;position:sticky;top:0;background:#0B1030;z-index:2;border-bottom:1px solid #1E2660}}
input,select{{background:#151C4E;color:#EEF1FF;border:1px solid #2A3480;border-radius:8px;padding:8px 10px;font-size:14px}}
label{{font-size:13px;color:#9AA3D6;display:flex;gap:6px;align-items:center}}
table{{width:100%;border-collapse:collapse;font-size:14px}} th,td{{padding:10px 12px;border-bottom:1px solid #1A2258;text-align:left;vertical-align:top}}
th{{cursor:pointer;color:#9AA3D6;font-weight:600;white-space:nowrap;position:sticky;top:57px;background:#0B1030}} th:hover{{color:#FFD84D}}
td.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
.est{{font-weight:800;color:#FFD84D}} .tag{{display:inline-block;font-size:11px;padding:2px 7px;border-radius:99px;background:#FF3B4E;color:#fff;margin-left:6px}}
.t{{font-size:11px;padding:2px 7px;border-radius:99px;background:#1E2A70;color:#9AD8FF}}
a{{color:#EEF1FF;text-decoration:none}} a:hover{{color:#5BE0FF;text-decoration:underline}} .canal{{color:#9AA3D6;font-size:13px}}
.wrap{{padding:0 16px 40px;overflow-x:auto}}
</style></head><body>
<header><h1>{html.escape(titulo)}</h1>
<div class="sub">Termos: {html.escape(", ".join(filtro["termos"]))} · região {filtro["regiao"]} · idioma {filtro["idioma"]} · mínimo {filtro["min_views"]:,} views · gerado em {filtro["gerado"][:16].replace("T", " ")} UTC</div>
<div class="sub">Estouro = views do vídeo ÷ inscritos do canal. Canal novo = criado há menos de 180 dias ou com menos de 60 vídeos.</div></header>
<div class="barra">
<input id="q" placeholder="Filtrar por título, canal ou termo" size="34">
<label>Tipo <select id="tipo"><option value="">todos</option><option value="s">Shorts</option><option value="l">longos</option></select></label>
<label>Estouro mínimo <select id="est"><option value="0">qualquer</option><option value="2">2x</option><option value="5">5x</option><option value="10">10x</option><option value="30">30x</option></select></label>
<label><input type="checkbox" id="novo"> só canais novos</label>
<span class="sub" id="cont"></span></div>
<div class="wrap"><table><thead><tr>
<th data-k="estouro">Estouro</th><th data-k="video">Vídeo</th><th data-k="views">Views</th><th data-k="views_dia">Views/dia</th>
<th data-k="inscritos">Inscritos</th><th data-k="dias">Idade</th><th data-k="comentarios">Comentários</th><th data-k="termo">Termo</th></tr></thead><tbody id="tb"></tbody></table></div>
<script>
const D={dados};
let chave="estouro",desc=true;
const fmt=n=>n==null?"?":n.toLocaleString("pt-BR");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}}[c]));
function desenha(){{
 const q=document.getElementById("q").value.toLowerCase(),tp=document.getElementById("tipo").value,
  me=+document.getElementById("est").value,nv=document.getElementById("novo").checked;
 let L=D.filter(x=>(!q||(x.video+" "+x.canal+" "+x.termo).toLowerCase().includes(q))&&(!tp||(tp=="s")==x.short)&&((x.estouro||0)>=me)&&(!nv||x.canal_novo));
 L.sort((a,b)=>{{let A=a[chave],B=b[chave];if(typeof A=="string")return desc?B.localeCompare(A):A.localeCompare(B);A=A??-1;B=B??-1;return desc?B-A:A-B}});
 document.getElementById("cont").textContent=L.length+" vídeos";
 document.getElementById("tb").innerHTML=L.map(x=>`<tr><td class="n est">${{x.estouro==null?"?":x.estouro+"x"}}</td>
 <td><a href="https://www.youtube.com/${{x.short?"shorts/":"watch?v="}}${{x.id}}" target="_blank" rel="noopener">${{esc(x.video)}}</a><br>
 <a class="canal" href="https://www.youtube.com/channel/${{x.canal_id}}" target="_blank" rel="noopener">${{esc(x.canal)}}</a>${{x.canal_novo?'<span class="tag">canal novo</span>':""}}</td>
 <td class="n">${{fmt(x.views)}}</td><td class="n">${{fmt(x.views_dia)}}</td><td class="n">${{fmt(x.inscritos)}}</td>
 <td class="n">${{x.dias}} d</td><td class="n">${{fmt(x.comentarios)}}</td><td><span class="t">${{esc(x.termo)}}</span></td></tr>`).join("");
}}
document.querySelectorAll("th").forEach(th=>th.onclick=()=>{{const k=th.dataset.k;desc=chave==k?!desc:true;chave=k;desenha()}});
["q","tipo","est","novo"].forEach(i=>document.getElementById(i).oninput=desenha);
desenha();
</script></body></html>"""


if __name__ == "__main__":
    main()
