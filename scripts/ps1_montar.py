"""Monta um Short no estilo PS1 (motor em ps1/): planos, legenda palavra a palavra e o áudio completo.

Uso: python scripts/ps1_montar.py p01 [--estimar]
  (antes: python scripts/voz.py p01, que grava public/build/p01/voz/001.mp3 + .json)

Roteiro (roteiros/pNN.json):
  { "id", "motor": "ps1", "titulo", "trilha": "suspense1", "voz", "taxa",
    "gancho": {"txt": "CUIDADO", "sub": "com quem ..."},
    "elenco": {"voce": {"camisa": "#4f7cff"}, "ela": {...}},
    "destaque": ["melatonina"],
    "cenas": [ { "id": 1, "texto": "frase falada",
                 "sons": [{"som": "riser", "t": 0.2}],          (t = segundos desde o começo da frase)
                 "planos": [ { "palavras": 4, "cena": "quarto", "clima": "noite",
                               "cam": {"tipo": "medio", "alvo": "cama", "ang": 40, "mov": "entra"},
                               "atores": {"voce": {"onde": "deitado", "expr": "dormindo"}},
                               "estado": {"porta": true, "coberta": 0.7},
                               "etiqueta": {"txt": "MELATONINA", "cor": "vermelho", "icone": "✗"},
                               "onoma": "TUM!", "revela": true, "marco": "30 dias", "objeto": "cerebro" } ] } ] }
  Cada plano dura as "palavras" seguintes da frase (o último fica com o resto). Um plano por frase curta.
Saída: ps1/videos/<id>/index.html + filme.json e ps1/audio/<id>.wav (narração + efeitos + trilha).
"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
SR = 44100
PAUSA = 0.14  # respiro entre frases (o ritmo dos virais é corrido)


def ler_audio(caminho: Path) -> np.ndarray:
    bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", str(caminho), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                           check=True, capture_output=True).stdout
    return np.frombuffer(bruto, "<i2").astype(np.float32) / 32768


def amostras():
    pasta = RAIZ / "public" / "sons"
    mapa = json.loads((pasta / "mapa.json").read_text())
    out = {}
    for nome, info in mapa.items():
        with wave.open(str(pasta / info["arquivo"])) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32) / 32768
        out[nome] = (x / max(1e-6, np.abs(x).max()), info["sync"])
    return out


APROXIMA = {"geral": "medio", "medio": "americano", "americano": "close", "close": "americano", "cima": "medio", "detalhe": "americano"}
MOVS = ["entra", "gira", "sai", "sobe", "lado"]


def picotar(planos, alvo=1.35, maximo=1.75):
    """Os virais cortam a cada ~1,3 s: plano comprido vira 2-3 ângulos do mesmo momento (como a Bizzarologia)."""
    out = []
    for p in planos:
        d = p["t1"] - p["t0"]
        if d <= maximo:
            out.append(p); continue
        n = max(2, round(d / alvo))
        passo = d / n
        for k in range(n):
            q = json.loads(json.dumps(p))
            q["t0"] = round(p["t0"] + k * passo, 3); q["t1"] = round(p["t0"] + (k + 1) * passo, 3)
            if k > 0:
                cam = q.setdefault("cam", {})
                if q.get("cena") == "vazio":
                    cam["ang"] = cam.get("ang", 0) + (35 if k % 2 else -35)
                    cam["zoom"] = round(cam.get("zoom", 1) * (0.78 if k % 2 else 1.15), 2)
                else:
                    cam["ang"] = max(5, min(80, cam.get("ang", 35) + (30 if k % 2 else -25)))
                    if k % 2:
                        cam["tipo"] = APROXIMA.get(cam.get("tipo", "medio"), "americano")
                cam["mov"] = MOVS[(k + len(out)) % len(MOVS)]
                for chave in ("onoma", "revela", "marco"):
                    q.pop(chave, None)
                q.pop("etiqueta", None)
            elif q.get("etiqueta"):
                e = q["etiqueta"] if isinstance(q["etiqueta"], dict) else {"txt": q["etiqueta"]}
                e["fim"] = p["t1"]; q["etiqueta"] = e
            q["sub"] = k
            out.append(q)
    return out


def main(vid, estimar=False):
    rot = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    voz = RAIZ / "public" / "build" / vid / "voz"
    narr, palavras, planos, t = [], [], [], 0.0
    sons = [("boom", 0.02, 0.5), ("riser_suave", 0.0, 0.25)] if rot.get("gancho") else []
    for ci, cena in enumerate(rot["cenas"]):
        mp3 = voz / f"{cena['id']:03d}.mp3"   # mesmo nome que o voz.py grava
        js = mp3.with_suffix(".json")
        if not estimar and not mp3.exists():
            sys.exit(f"faltou a narração da frase {cena['id']} ({mp3}): rode scripts/voz.py antes")
        if estimar:
            ws = cena["texto"].split()
            pal = [{"w": w, "t0": i * 0.34, "t1": i * 0.34 + 0.3} for i, w in enumerate(ws)]
            audio = np.zeros(int((len(ws) * 0.34 + 0.1) * SR), np.float32)
        else:
            pal = json.loads(js.read_text())
            audio = ler_audio(mp3)
        dur = len(audio) / SR
        narr.append(audio); narr.append(np.zeros(int(PAUSA * SR), np.float32))
        for p in pal:
            palavras.append({"w": p["w"], "t0": round(t + p["t0"], 3), "t1": round(t + p["t1"], 3)})
        # divide a frase em planos pelas palavras
        ps = cena.get("planos") or [{}]
        idx = 0
        for k, pl in enumerate(ps):
            ini = t if k == 0 else t + pal[min(idx, len(pal) - 1)]["t0"] - 0.04
            n = pl.get("palavras", 0) if k < len(ps) - 1 else len(pal)
            idx = min(len(pal), idx + (n or max(1, len(pal) // len(ps))))
            pl = {kk: vv for kk, vv in pl.items() if kk != "palavras"}
            pl["t0"] = round(max(t, ini), 3)
            planos.append(pl)
        # efeitos da frase
        for s in cena.get("sons", []):
            sons.append((s["som"], t + s.get("t", 0), s.get("vol", 0.8)))
        t += dur + PAUSA
    for a, b in zip(planos, planos[1:]):
        a["t1"] = b["t0"]
    planos[-1]["t1"] = round(t + 0.6, 3)
    total = round(t + 0.6, 2)
    planos = picotar(planos)
    # efeitos automáticos: um por corte (alternando), pop na etiqueta, impacto na onomatopeia, riser antes da revelação
    cortes = ["whoosh", "swish", "whoosh_leve", "swipe", "whoosh", "zip"]
    for i, p in enumerate(planos):
        if i > 0:
            troca = planos[i - 1]["cena"] != p["cena"]
            if p.get("sub"):
                sons.append(("click" if i % 2 else "tap", p["t0"], 0.32))   # troca de ângulo: um clique seco
            else:
                sons.append(("whoosh_forte" if troca else cortes[i % len(cortes)], p["t0"], 0.55 if troca else 0.38))
        if p.get("etiqueta"):
            sons.append(("pop", p["t0"] + 0.12, 0.7))
        if p.get("onoma"):
            sons.append(("impacto", p["t0"] + 0.05, 0.85))
        if p.get("revela"):
            sons.append(("riser", p["t0"] - 0.05, 0.6)); sons.append(("slam", p["t0"], 0.8))
        if p.get("marco"):
            sons.append(("relogio_rapido", p["t0"], 0.5))
        if p.get("cena") == "vazio" and (i == 0 or planos[i - 1].get("cena") != "vazio"):
            sons.append(("brilho", p["t0"] + 0.1, 0.5))
    sons.append(("ding", planos[-1]["t0"] + 0.1, 0.6))

    # ── página do motor ──
    pasta = RAIZ / "ps1" / "videos" / vid
    pasta.mkdir(parents=True, exist_ok=True)
    modelo = (RAIZ / "ps1" / "videos" / "_modelo" / "index.html").read_text()
    (pasta / "index.html").write_text(modelo.replace("__DUR__", str(total)))
    filme = {"gancho": rot.get("gancho"), "elenco": rot.get("elenco", {"voce": {}}), "destaque": rot.get("destaque", []),
             "palavras": palavras, "planos": planos}
    (pasta / "filme.json").write_text(json.dumps(filme, ensure_ascii=False, indent=1))

    # ── áudio: narração + efeitos + trilha (abafada sob a voz) ──
    n = int(total * SR) + SR
    voz_tr = np.zeros(n, np.float32); x = np.concatenate(narr); voz_tr[:len(x)] = x[:n]
    sfx = np.zeros(n, np.float32)
    lib = amostras()
    for nome, seg, vol in sons:
        if nome not in lib:
            continue
        a, sync = lib[nome]
        i = int(max(0, seg - sync) * SR); f = min(n, i + len(a))
        sfx[i:f] += a[: f - i] * vol * 0.5
    musica = np.zeros(n, np.float32)
    cat = json.loads((RAIZ / "public" / "musica" / "catalogo.json").read_text())
    trilha = rot.get("trilha", "suspense1")
    mp3 = RAIZ / "public" / "musica" / f"{trilha}.mp3"
    if mp3.exists():
        m = ler_audio(mp3)
        ini = int(rot.get("trilha_inicio", 0) * SR)
        m = np.tile(m[ini:], 1 + n // max(1, len(m) - ini))[:n]
        musica = m * (0.16 if cat.get(trilha, {}).get("credito") else 0.24)
        # abaixa a trilha onde tem voz (envelope suave)
        env = np.convolve((np.abs(voz_tr) > 0.02).astype(np.float32), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
        musica *= 1 - 0.55 * np.clip(env * 3, 0, 1)
    fala = float(np.sqrt((voz_tr ** 2).mean()))
    print(f"narração: volume médio {fala:.3f}" + ("  <<< SEM VOZ" if fala < 0.005 else " (ok)"))
    if fala < 0.005 and not estimar:
        sys.exit("a narração saiu muda: não vou montar um vídeo sem voz")
    mix = voz_tr * 1.0 + sfx + musica
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = (mix / max(1e-6, np.abs(mix).max()) * 0.92 * 32767).astype("<i2")
    (RAIZ / "ps1" / "audio").mkdir(parents=True, exist_ok=True)
    with wave.open(str(RAIZ / "ps1" / "audio" / f"{vid}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(mix.tobytes())
    # crédito da trilha (publicar.py lê o manifesto)
    man = RAIZ / "public" / "build" / vid / "manifest.json"
    man.parent.mkdir(parents=True, exist_ok=True)
    man.write_text(json.dumps({"formato": "short", "musica": f"musica/{trilha}.mp3", "totalFrames": int(total * 30)}, ensure_ascii=False))
    print(f"{vid}: {len(planos)} planos em {total:.1f}s ({total / len(planos):.2f}s por plano), {len(sons)} efeitos")


if __name__ == "__main__":
    main(sys.argv[1], "--estimar" in sys.argv)
