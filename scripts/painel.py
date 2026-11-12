"""Fila do painel do Descifre: docs/dados/fila.json (lida pela página em docs/index.html).

Cada item é um vídeo ou Short com status:
  renderizado  → pronto no GitHub, ainda não subiu para o YouTube
  rascunho     → no YouTube como PRIVADO, esperando a sua aprovação no painel
  ajuste       → você pediu mudança (a nota fica em "notas")
  agendado     → aprovado, com data e hora de publicação no YouTube
  publicado    → público
  descartado   → não vai ao ar

Uso:
  python scripts/painel.py registrar ID [--run RUN] [--youtube YTID] [--status STATUS]
  python scripts/painel.py semear          (cria a fila com todos os roteiros existentes)
"""
import argparse
import datetime as dt
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FILA = RAIZ / "docs" / "dados" / "fila.json"
REPO = "amiraldopedro/descifre"


def agora():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def carregar():
    if FILA.exists():
        return json.loads(FILA.read_text())
    return {"itens": [], "regras": {"longo": ["ter 18:00", "sex 18:00"], "short": ["12:00", "19:00"], "fuso": "America/Sao_Paulo"}}


def salvar(f):
    FILA.parent.mkdir(parents=True, exist_ok=True)
    f["atualizado"] = agora()
    f["itens"].sort(key=lambda x: (x.get("criado", ""), x["id"]), reverse=True)
    FILA.write_text(json.dumps(f, ensure_ascii=False, indent=1))


def achar(f, vid):
    for it in f["itens"]:
        if it["id"] == vid:
            return it
    return None


def dados_roteiro(vid):
    meta_p = RAIZ / "roteiros" / f"{vid}.meta.json"
    rot_p = RAIZ / "roteiros" / f"{vid}.json"
    meta = json.loads(meta_p.read_text()) if meta_p.exists() else {}
    rot = json.loads(rot_p.read_text()) if rot_p.exists() else {}
    man_p = RAIZ / "public" / "build" / vid / "manifest.json"
    dur = None
    if man_p.exists():
        m = json.loads(man_p.read_text())
        dur = round(sum(c["duracao"] for c in m["cenas"]) / m.get("fps", 30))
    return {
        "tipo": "short" if vid.startswith("s") else "longo",
        "titulo": meta.get("titulo", rot.get("titulo", vid)),
        "descricao": meta.get("descricao", ""),
        "tags": meta.get("tags", []),
        "thumb_texto": meta.get("thumb", {}),
        "tema": rot.get("titulo", ""),
        "duracao_s": dur,
    }


def registrar(vid, run=None, youtube=None, status=None, quando=None):
    f = carregar()
    it = achar(f, vid)
    base = dados_roteiro(vid)
    if not it:
        it = {"id": vid, "criado": agora(), "notas": [], "historico": []}
        f["itens"].append(it)
    for k, v in base.items():
        if v not in (None, "", []) and not (k == "duracao_s" and it.get(k)):
            it.setdefault(k, v)
            if k in ("titulo", "descricao", "tags") and it.get("status") in (None, "renderizado"):
                it[k] = v  # enquanto não subiu, o SEO acompanha o roteiro
            if k == "duracao_s":
                it[k] = v
    if run:
        it["run"] = str(run)
        it["download"] = f"https://github.com/{REPO}/actions/runs/{run}"
    if youtube:
        it["youtube_id"] = youtube
    if status:
        it["status"] = status
        it["historico"].append({"quando": agora(), "status": status})
    it.setdefault("status", "renderizado")
    if quando:
        it["agendado_para"] = quando
    salvar(f)
    return it


RUNS = {  # rodadas já feitas (para o link de download)
    "003": 42874077017, "004": 42874087660, "005": 42874097609, "006": 42874107393, "007": 42874117282,
    "s05": 42874127494, "s06": 42874138401, "s07": 42874149494, "s08": 42874160808, "s09": 42874172019,
    "s10": 42874182237, "s11": 42874192544, "s12": 42874202428, "s13": 42874214556, "s14": 42874224650,
    "s15": 42874235992, "s16": 42874245513, "008": 43018427007, "009": 43040714232,
    "s17": 43089081733, "s18": 43089100016, "s19": 43089118506, "s20": 43089136723, "s21": 43089155684,
}


def semear():
    ids = sorted(p.name.replace(".meta.json", "") for p in (RAIZ / "roteiros").glob("*.meta.json"))
    for vid in ids:
        if vid[0] in "0s" and vid[1:].isdigit():
            registrar(vid, run=RUNS.get(vid))
    print(f"fila com {len(carregar()['itens'])} itens")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("acao", choices=["registrar", "semear"])
    ap.add_argument("id", nargs="?")
    ap.add_argument("--run")
    ap.add_argument("--youtube")
    ap.add_argument("--status")
    a = ap.parse_args()
    if a.acao == "semear":
        semear()
    else:
        print(registrar(a.id, a.run, a.youtube, a.status))
