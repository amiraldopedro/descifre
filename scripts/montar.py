"""Monta o manifesto do vídeo (tempos de cada cena) e a faixa única de narração.

Uso:
  python scripts/montar.py 001            # usa a voz gerada em public/build/001/voz
  python scripts/montar.py 001 --estimar  # sem voz (prévia): estima os tempos
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FPS = 30
PAUSA = 0.35  # respiro entre cenas (s)
PAUSA_CONTAGEM = 3.0  # tempo do "PENSE..." (s)
PALAVRAS_POR_SEG = 2.7


def duracao(p: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def estimar(texto):
    ws = texto.split()
    dur = max(1.2, len(ws) / PALAVRAS_POR_SEG)
    pesos = [len(w) + 2 for w in ws]
    tot, t, out = sum(pesos), 0.05, []
    for w, p in zip(ws, pesos):
        d = dur * p / tot
        out.append({"w": w, "t0": round(t, 3), "t1": round(t + d * 0.9, 3)})
        t += d
    return dur + 0.1, out


# ---------------------------------------------------------------------------
# Efeitos sonoros sintetizados (sem direitos autorais, nada baixado)
# ---------------------------------------------------------------------------
SR = 44100


def _sons():
    import numpy as np
    rng = np.random.default_rng(3)

    def t_(d):
        return np.arange(int(d * SR)) / SR

    def env(t, k):
        return np.exp(-t * k)

    def whoosh(d=0.35):
        n = int(d * SR); x = np.linspace(0, 1, n)
        return np.convolve(rng.standard_normal(n), np.ones(8) / 8, "same") * np.sin(np.pi * x) ** 2 * 0.35

    def pop():
        t = t_(0.12); return np.sin(2 * np.pi * (900 - 2500 * t) * t) * env(t, 35) * 0.5

    def ding():
        t = t_(0.9); return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1976 * t)) * env(t, 5) * 0.35

    def click():
        t = t_(0.04); return rng.standard_normal(len(t)) * env(t, 150) * 0.45 + np.sin(2 * np.pi * 3000 * t) * env(t, 120) * 0.3

    def tique(f=1800):
        t = t_(0.06); return np.sin(2 * np.pi * f * t) * env(t, 60) * 0.5

    def boom():
        t = t_(0.6); return np.sin(2 * np.pi * (90 - 50 * t) * t) * env(t, 7) * 0.7

    def zap():
        t = t_(0.35)
        serra = ((t * (1400 - 3000 * t)) % 1.0) * 2 - 1
        return (serra * 0.4 + rng.standard_normal(len(t)) * 0.25) * env(t, 10) * 0.45

    def brilho():
        out = np.zeros(int(1.1 * SR))
        for i, f in enumerate([1568, 1976, 2349, 3136]):
            t = t_(0.7); i0 = int(i * 0.08 * SR)
            out[i0:i0 + len(t)] += np.sin(2 * np.pi * f * t) * env(t, 6) * 0.18
        return out

    def mecanico():
        out = np.zeros(int(1.2 * SR))
        for i in range(8):
            c = click() * (0.6 if i % 2 else 1); i0 = int(i * 0.15 * SR)
            out[i0:i0 + len(c)] += c
        return out

    def batida():
        t = t_(0.25); return np.sin(2 * np.pi * (70 - 30 * t) * t) * env(t, 16) * 0.8

    def glitch():
        n = int(0.45 * SR); out = np.zeros(n)
        for i in range(9):
            i0 = int(rng.uniform(0, n - 2000)); d = min(int(rng.uniform(400, 2500)), n - i0)
            out[i0:i0 + d] += np.sign(rng.standard_normal(d)) * 0.2 * rng.uniform(0.3, 1)
        return out

    def sobe(d=0.8):
        t = t_(d); f = 200 + 1600 * (t / d) ** 2
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.3

    def desce(d=0.7):
        t = t_(d); f = 1400 - 1200 * (t / d)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.3

    def porta():
        t = t_(0.9)
        hum = np.sin(2 * np.pi * 110 * t) * 0.15 + np.convolve(rng.standard_normal(len(t)), np.ones(40) / 40, "same") * 0.5
        return hum * np.sin(np.pi * t / 0.9) * 0.6 + np.pad(ding()[: int(0.5 * SR)] * 0.5, (0, len(t) - int(0.5 * SR)))

    def passos():
        out = np.zeros(int(1.3 * SR))
        for i in range(4):
            b = batida() * 0.5; i0 = int(i * 0.32 * SR)
            out[i0:i0 + len(b)] += b
        return out

    def papel(d=0.5):  # folha deslizando na mesa
        n = int(d * SR); x = np.linspace(0, 1, n); r = rng.standard_normal(n)
        agudo = r - np.convolve(r, np.ones(6) / 6, "same")
        estalos = np.convolve((rng.random(n) < 0.004) * rng.uniform(-1, 1, n) * 3, np.ones(30) / 30, "same")
        return (agudo * 0.5 + estalos) * np.sin(np.pi * x) ** 1.5 * 0.35

    def marcador(d=0.7):  # marca-texto riscando o papel
        n = int(d * SR); t = np.arange(n) / SR
        chiado = np.convolve(rng.standard_normal(n), np.ones(3) / 3, "same") * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t))
        return chiado * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08) * 0.22

    return dict(whoosh=whoosh, pop=pop, ding=ding, click=click, tique=tique, boom=boom, zap=zap, brilho=brilho,
                mecanico=mecanico, batida=batida, glitch=glitch, sobe=sobe, desce=desce, porta=porta, passos=passos,
                papel=papel, marcador=marcador)


# som de cada ilustração: lista de (som, segundo dentro da cena) — bate com o tempo da animação em Ilustracoes.tsx
SONS_ILUSTRACAO = {
    "lampada": [("click", 0.45), ("ding", 0.5)],
    "engrenagens": [("mecanico", 0.1)],
    "neuronios": [("zap", 0.1), ("brilho", 0.5)],
    "dominos": [("batida", (12 + i * 5 + 7) / 30) for i in range(7)],
    "balanca": [("tique", 0.2), ("tique", 1.1)],
    "ampulheta": [("tique", 0.1), ("tique", 0.6), ("tique", 1.1)],
    "marionete": [("sobe", 0.1)],
    "raio": [("zap", 0.0), ("zap", 0.47)],
    "grafico": [("pop", 0.3), ("pop", 0.47), ("pop", 0.63), ("sobe", 0.7)],
    "cadeado": [("click", 0.6), ("ding", 0.75)],
    "coracao": [("batida", 0.1), ("batida", 0.35)],
    "olho": [("brilho", 0.2)],
    "interrogacao": [("pop", 0.05)],
}
SONS_CENA3D = {"tunel": [("sobe", 0.0), ("whoosh", 0.6)], "neuronios": [("zap", 0.2), ("brilho", 1.0)],
               "cerebro": [("brilho", 0.3)], "multidao": [("passos", 0.4)]}
SONS_ENTRADA = {"pop": "pop", "deslizar": "whoosh", "teletransporte": "zap", "cair": "batida"}
# vinheta de abertura (src/Vinheta.tsx): olho abre (sobe), brilho, anel (whoosh), letras decifradas (clicks), slogan
SONS_VINHETA = ([("sobe", 0.25, 1.0), ("brilho", 0.87, 1.0), ("whoosh", 1.0, 0.7)]
                + [("click", (55 + i * 3) / 30, 0.35) for i in range(8)] + [("brilho", 2.6, 0.7)])
DURACAO_FIXA = {"vinheta": 105}  # frames
DURACAO_MINIMA = {"capitulo": 96, "fim": 135}  # frames (3,2 s e 4,5 s)


def sons_local(por, t0):
    """Etiqueta de lugar: desliza e digita."""
    por("whoosh", t0 + 0.12, 0.35)
    for k in range(6):
        por("click", t0 + 0.34 + k * 0.09, 0.3)


def sfx(cenas, roteiro, destino: Path, short: bool):
    """Monta a faixa de efeitos de TODO o vídeo (longo ou short)."""
    import numpy as np
    S = _sons()
    total = int((cenas[-1]["inicio"] + cenas[-1]["duracao"]) / FPS * SR) + SR
    trilha = np.zeros(total)
    sons_sm = {}
    arq = RAIZ / "scripts" / "sons_cenas.json"
    if arq.exists():
        sons_sm = json.loads(arq.read_text())
    por_id = {c["id"]: c for c in roteiro["cenas"]}

    def por(nome, seg, vol=1.0):
        if nome not in S:
            return
        som = S[nome]() * vol
        i = int(max(0, seg) * SR); f = min(total, i + len(som)); trilha[i:f] += som[: f - i]

    anterior, tipo_ant = None, None
    for c in cenas:
        t0 = c["inicio"] / FPS
        a = c["animacao"]; tipo = a["tipo"]
        manual = por_id.get(c["id"], {}).get("sons")
        if tipo in ("vinheta", "capitulo") or tipo_ant == "capitulo":
            pass  # fade para o preto / vinheta: sem whoosh
        elif short:
            por("whoosh", t0 - 0.12)
        elif tipo != "nenhuma" or (c["broll"] is None) != (anterior is None):
            por("whoosh", t0 - 0.1, 0.5)  # longo: só nos cortes que mudam algo na tela
        anterior, tipo_ant = c["broll"], tipo
        if c.get("local") and tipo != "local":
            sons_local(por, t0)
        if manual is not None:  # o roteiro manda: "sons": [{"som": "zap", "t": 1.2}]
            for s_ in manual:
                por(s_["som"], t0 + s_["t"], s_.get("vol", 1))
            continue
        if tipo in ("gancho", "cta", "titulo"):
            por("boom", t0)
        elif tipo == "conceito":
            por("ding", t0 + 0.05)
        elif tipo in ("pergunta", "mascote"):
            por("pop", t0 + 0.05); por("pop", t0 + 0.3, 0.7)
        elif tipo == "citacao":
            por("click", t0 + 0.05)
        elif tipo == "lista":
            por("pop", t0 + 0.12)
        elif tipo == "resultado":
            por("boom", t0); por("brilho", t0 + 0.2)
        elif tipo == "encerramento":
            por("brilho", t0 + 0.1)
        elif tipo == "local":
            sons_local(por, t0)
        elif tipo == "documento":
            por("papel", t0 + 0.02)
            por("marcador", t0 + a.get("p0", 0.25) * c["fala"] / FPS)
        elif tipo == "carimbo":  # mesma conta de batidaCarimbo() em src/Documentario.tsx
            hit = (round(a.get("p", 0.3) * c["fala"]) if a.get("frase") else 6) / FPS
            por("batida", t0 + hit); por("boom", t0 + hit, 0.7)
        elif tipo == "capitulo":
            por("boom", t0 + 0.4, 0.6); por("brilho", t0 + 0.55, 0.5)
        elif tipo == "fim":
            por("whoosh", t0 + 0.15); por("pop", t0 + 0.3); por("ding", t0 + 0.6, 0.7)
        elif tipo == "vinheta":
            for nome, s_, v in SONS_VINHETA:
                por(nome, t0 + s_, v)
        elif tipo == "ilustracao":
            for nome, s_ in SONS_ILUSTRACAO.get(a.get("nome"), [("pop", 0.05)]):
                por(nome, t0 + s_)
        elif tipo == "cena3d":
            for nome, s_ in SONS_CENA3D.get(a.get("nome"), [("brilho", 0.3)]):
                por(nome, t0 + s_)
        elif tipo == "sobmedida":
            fala_s = c["fala"] / FPS
            fase = (a.get("props") or {}).get("fase")
            for s_ in sons_sm.get(a.get("nome"), []):
                if "fase" in s_ and s_["fase"] != fase:
                    continue
                if "fim" in s_:  # segundos antes do fim da cena (pausas, contagens)
                    quando = c["duracao"] / FPS - s_["fim"]
                else:
                    quando = s_["t"] if "t" in s_ else s_.get("p", 0) * fala_s  # p = proporção da fala
                por(s_["som"], t0 + quando, s_.get("vol", 1))
        if tipo == "contagem":
            fim = (c["inicio"] + c["duracao"]) / FPS
            for k in range(1, 4):
                por("tique", fim - k * (0.66 if short else 1.0))
        for at in c.get("personagens", []):
            if at.get("novo"):
                por(SONS_ENTRADA.get(at.get("entrada", "pop"), "pop"), t0 + 0.02, 0.8)
    pico = max(1e-6, np.abs(trilha).max())
    trilha = (trilha / pico * 0.8 * 32767).astype("<i2")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-b:a", "160k", str(destino)], input=trilha.tobytes(), check=True)


def main(vid, estimar_tempos=False):
    roteiro = json.loads((RAIZ / "roteiros" / f"{vid}.json").read_text())
    short = roteiro.get("formato") == "short"
    build = RAIZ / "public" / "build" / vid
    voz_dir = build / "voz"
    mapa_path = build / "broll" / "mapa.json"
    mapa = json.loads(mapa_path.read_text()) if mapa_path.exists() else {}

    cenas_rot = list(roteiro["cenas"])
    if roteiro.get("vinheta") and (not cenas_rot or cenas_rot[0].get("animacao", {}).get("tipo") != "vinheta"):
        cenas_rot.insert(0, {"id": 0, "texto": "", "animacao": {"tipo": "vinheta"}})  # abertura sempre igual
    por_id = {c["id"]: c for c in cenas_rot}

    cenas, inicio, ultima_pergunta, trechos = [], 0, None, []
    apresentados = set()
    em_cena = {}  # personagem -> último gesto (para entradas e transição de pose)
    for idx, c in enumerate(cenas_rot):
        # "previa": N -> gancho que mostra o visual da cena N (animação, b-roll, personagens, local)
        alvo = por_id.get(c["previa"]) if c.get("previa") is not None else None
        if c.get("previa") is not None and alvo is None:
            raise SystemExit(f"cena {c['id']}: previa {c['previa']} não existe")
        visual = alvo or c
        anim = dict(visual.get("animacao", {"tipo": "nenhuma"}))
        if anim["tipo"] == "fim" and anim.get("video") and not anim.get("thumb"):
            meta = RAIZ / "roteiros" / f"{anim['video']}.meta.json"  # thumb do vídeo longo
            if meta.exists():
                anim["thumb"] = json.loads(meta.read_text()).get("thumb")
        if anim["tipo"] == "pergunta":
            ultima_pergunta = {k: anim[k] for k in ("numero", "texto", "a", "b", "rotulo", "total") if k in anim}
        if anim["tipo"] == "contagem":
            anim["pergunta"] = ultima_pergunta

        mp3 = voz_dir / f"{c['id']:03d}.mp3"
        if not c.get("texto", "").strip():
            fala_s, palavras = 0.0, []  # cena sem narração (vinheta, capítulo)
        elif not estimar_tempos and mp3.exists():
            fala_s = duracao(mp3)
            palavras = json.loads(mp3.with_suffix(".json").read_text())
            trechos.append((mp3, inicio / FPS))
        else:
            fala_s, palavras = estimar(c["texto"])

        if short:
            pausa = 2.0 if anim["tipo"] == "contagem" else (1.2 if anim["tipo"] == "cta" else 0.08)
        else:
            pausa = PAUSA_CONTAGEM if anim["tipo"] == "contagem" else PAUSA
        if anim["tipo"] == "encerramento":
            pausa = 2.5
        pausa = c.get("pausa", pausa)  # o roteiro pode pedir um tempo para o espectador pensar
        prox = cenas_rot[idx + 1] if idx + 1 < len(cenas_rot) else None
        if prox and prox.get("animacao", {}).get("tipo") == "capitulo":
            pausa += 0.4  # respiro antes do fade para o preto
        atores, agora = [], {}
        for a in c.get("personagens", visual.get("personagens", [])):
            a = dict(a)
            a["novo"] = a["id"] not in em_cena
            a["apresentar"] = a["id"] not in apresentados
            apresentados.add(a["id"])
            if not a["novo"]:
                a["gestoAnterior"] = em_cena[a["id"]]
            agora[a["id"]] = a.get("gesto", "explicar" if a["id"] == c.get("quem", "cifrinho") else "parado")
            a.setdefault("gesto", agora[a["id"]])
            atores.append(a)
        em_cena = agora
        fala = round(fala_s * FPS)
        dur = fala + round(pausa * FPS)
        if anim["tipo"] in DURACAO_FIXA:
            dur = DURACAO_FIXA[anim["tipo"]]
        dur = max(dur, DURACAO_MINIMA.get(anim["tipo"], 0))
        broll = mapa.get(str(c["id"])) or (mapa.get(str(alvo["id"])) if alvo else None)
        capitulo = c.get("capitulo") or (anim["titulo"] if anim["tipo"] == "capitulo" else None)
        cenas.append({
            "id": c["id"], "texto": c.get("texto", ""), "inicio": inicio, "duracao": dur, "fala": fala,
            "palavras": palavras, "broll": broll, "animacao": anim,
            "quem": c.get("quem", "cifrinho"), "personagens": atores,
            "lofi": c.get("lofi", visual.get("lofi", "leve")), "capitulo": capitulo,
            "brollFrames": int(duracao(RAIZ / "public" / broll) * FPS) if broll else 0,
            "camera": c.get("camera"), "transicao": c.get("transicao"),
            "local": c.get("local") or (alvo or {}).get("local"), "previa": c.get("previa"),
        })
        inicio += dur
    if any(x["animacao"]["tipo"] == "capitulo" for x in cenas) and not cenas[0]["capitulo"]:
        cenas[0]["capitulo"] = "Introdução"  # o YouTube exige o 1º capítulo em 0:00

    narracao = None
    if trechos:
        # junta todas as falas numa faixa só, cada uma no seu tempo exato
        saida = build / "narracao.mp3"
        entradas, filtros = [], []
        for i, (p, t) in enumerate(trechos):
            entradas += ["-i", str(p)]
            ms = int(t * 1000)
            filtros.append(f"[{i}:a]adelay={ms}|{ms}[a{i}]")
        mix = "".join(f"[a{i}]" for i in range(len(trechos)))
        filtros.append(f"{mix}amix=inputs={len(trechos)}:normalize=0,loudnorm=I=-16:TP=-1.5[out]")
        script = build / "filtro.txt"
        script.write_text(";".join(filtros))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex_script", str(script),
                        "-map", "[out]", "-ar", "48000", "-b:a", "192k", str(saida)], check=True)
        narracao = f"build/{vid}/narracao.mp3"

    build.mkdir(parents=True, exist_ok=True)
    sfx_arq = None
    if roteiro.get("efeitos", True):
        sfx(cenas, roteiro, build / "sfx.mp3", short)
        sfx_arq = f"build/{vid}/sfx.mp3"

    trilha = roteiro.get("trilha", "misterio")
    musica = f"musica/{trilha}.mp3" if (RAIZ / "public" / "musica" / f"{trilha}.mp3").exists() else None
    manifesto = {"id": vid, "titulo": roteiro["titulo"], "fps": FPS, "totalFrames": inicio,
                 "narracao": narracao, "musica": musica, "sfx": sfx_arq,
                 "formato": roteiro.get("formato", "longo"), "cenas": cenas}
    build.mkdir(parents=True, exist_ok=True)
    (build / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False))
    print(f"manifesto: {len(cenas)} cenas, {inicio} frames ({inicio / FPS / 60:.1f} min)")


if __name__ == "__main__":
    main(sys.argv[1], "--estimar" in sys.argv)
