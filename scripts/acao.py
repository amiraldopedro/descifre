"""Ações do painel (chamadas pelo workflow painel-acao.yml, disparado pelos botões da página).

  aprovar   → agenda no YouTube (data escolhida ou próximo horário livre da agenda)
  salvar    → só salva título, descrição e tags (no painel e no YouTube)
  ajustar   → guarda o seu pedido de mudança (status "ajuste") para o Claude refazer
  descartar → não vai ao ar (no YouTube continua privado)
  voltar    → tira da agenda e volta para "rascunho"

Horários de "quando" no fuso de Brasília, ex.: 2026-11-14T18:00
"""
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import painel  # noqa: E402

BRT = dt.timezone(dt.timedelta(hours=-3))
DIAS = {"seg": 0, "ter": 1, "qua": 2, "qui": 3, "sex": 4, "sab": 5, "dom": 6}


def yt():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    cred = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], client_id=os.environ["YT_CLIENT_ID"],
                       client_secret=os.environ["YT_CLIENT_SECRET"], token_uri="https://oauth2.googleapis.com/token",
                       scopes=["https://www.googleapis.com/auth/youtube"])
    return build("youtube", "v3", credentials=cred, cache_discovery=False)


def proximo_horario(fila, tipo):
    """Próximo horário livre pelas regras da agenda (no mínimo 2 h a partir de agora)."""
    regras = fila.get("regras", {}).get(tipo) or (["ter 18:00", "sex 18:00"] if tipo == "longo" else ["12:00", "19:00"])
    ocupados = {it.get("agendado_para", "")[:16] for it in fila["itens"] if it.get("status") == "agendado" and it.get("tipo") == tipo}
    t = dt.datetime.now(BRT) + dt.timedelta(hours=2)
    for dia in range(60):
        d = (t + dt.timedelta(days=dia)).date()
        for r in sorted(regras, key=lambda x: x.split()[-1]):
            partes = r.split()
            if len(partes) == 2 and DIAS[partes[0]] != d.weekday():
                continue
            h, m = map(int, partes[-1].split(":"))
            cand = dt.datetime(d.year, d.month, d.day, h, m, tzinfo=BRT)
            if cand > t and cand.isoformat()[:16] not in ocupados:
                return cand
    return t


def main():
    vid = os.environ["ID"]
    acao = os.environ["ACAO"]
    f = painel.carregar()
    it = painel.achar(f, vid)
    if not it:
        sys.exit(f"{vid} não está na fila")
    hist = it.setdefault("historico", [])
    agora = painel.agora()

    # SEO editado no painel
    for campo, env in (("titulo", "TITULO"), ("descricao", "DESCRICAO")):
        if os.environ.get(env, "").strip():
            it[campo] = os.environ[env].strip()
    if os.environ.get("TAGS", "").strip():
        it["tags"] = [t.strip() for t in os.environ["TAGS"].split(",") if t.strip()]

    tem_yt = bool(it.get("youtube_id")) and bool(os.environ.get("YT_REFRESH_TOKEN"))
    api = yt() if tem_yt else None

    def atualizar_snippet():
        if api:
            api.videos().update(part="snippet", body={"id": it["youtube_id"], "snippet": {
                "title": it["titulo"][:100], "description": it["descricao"][:5000], "tags": it.get("tags", []),
                "categoryId": "27", "defaultLanguage": "pt-BR", "defaultAudioLanguage": "pt-BR"}}).execute()

    if acao == "salvar":
        atualizar_snippet()
        hist.append({"quando": agora, "status": "seo salvo"})

    elif acao == "aprovar":
        q = os.environ.get("QUANDO", "").strip()
        quando = dt.datetime.fromisoformat(q).replace(tzinfo=BRT) if q else proximo_horario(f, it.get("tipo", "longo"))
        utc = quando.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        if api:
            atualizar_snippet()
            api.videos().update(part="status", body={"id": it["youtube_id"], "status": {
                "privacyStatus": "private", "publishAt": utc, "selfDeclaredMadeForKids": False}}).execute()
            it["status"] = "agendado"
        else:
            # ainda não está no YouTube: gera de novo e sobe já agendado
            it["status"] = "aprovado"
            subprocess.run(["gh", "workflow", "run", "video.yml", "-f", f"id={vid}", "-f", "publicar=privado",
                            "-f", f"agendar={utc}"], check=False)
        it["agendado_para"] = quando.isoformat()
        hist.append({"quando": agora, "status": it["status"], "para": quando.isoformat()})

    elif acao == "ajustar":
        it["status"] = "ajuste"
        it.setdefault("notas", []).append({"quando": agora, "texto": os.environ.get("NOTA", "")})
        hist.append({"quando": agora, "status": "ajuste"})

    elif acao == "descartar":
        if api:  # some de vez: fica privado no YouTube
            api.videos().update(part="status", body={"id": it["youtube_id"], "status": {
                "privacyStatus": "private", "selfDeclaredMadeForKids": False}}).execute()
        it["status"] = "descartado"
        hist.append({"quando": agora, "status": "descartado"})

    elif acao == "voltar":
        if api:  # volta a ser rascunho não listado (dá para assistir no painel)
            api.videos().update(part="status", body={"id": it["youtube_id"], "status": {
                "privacyStatus": "unlisted", "selfDeclaredMadeForKids": False}}).execute()
        it["status"] = "rascunho" if it.get("youtube_id") else "renderizado"
        it.pop("agendado_para", None)
        hist.append({"quando": agora, "status": it["status"]})

    painel.salvar(f)
    print(f"{vid}: {acao} → {it['status']} {it.get('agendado_para', '')}")


if __name__ == "__main__":
    main()
