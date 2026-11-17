"""Análise quadro a quadro (30 fps) de Shorts de referência — roda no GitHub Actions.
Para cada URL: baixa (yt-dlp), extrai TODOS os quadros a 30 fps, monta folhas de contato
(2 s por folha = 60 quadros), detecta cortes, mede ritmo e volume e guarda a legenda automática.
Saída em analise/<id>/ (vai para a branch "analise", não para a main)."""
import json, subprocess, sys
from pathlib import Path

OUT = Path("analise")


def sh(*a, **k):
    return subprocess.run(a, check=True, text=True, capture_output=True, **k).stdout


def um(url):
    info = json.loads(sh("yt-dlp", "-J", "--no-warnings", url))
    vid = info["id"]
    d = OUT / vid; (d / "folhas").mkdir(parents=True, exist_ok=True)
    mp4 = Path(f"/tmp/{vid}.mp4")
    sh("yt-dlp", "-f", "bv*[height<=1920][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "-o", str(mp4), "--merge-output-format", "mp4",
       "--write-auto-subs", "--sub-langs", "pt.*,en.*", "--sub-format", "vtt", "--skip-download" if False else "--no-simulate", url)
    for v in Path("/tmp").glob(f"{vid}*.vtt"):
        (d / v.name.replace(f"{vid}.", "legenda.")).write_bytes(v.read_bytes())
    dur = float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)).strip())
    # quadros a 30 fps, miniaturas 180x320; folha = 60 quadros (2 s) em grade 10x6
    q = Path(f"/tmp/q_{vid}"); q.mkdir(exist_ok=True)
    sh("ffmpeg", "-v", "error", "-i", str(mp4), "-vf", "fps=30,scale=180:320:force_original_aspect_ratio=decrease,pad=180:320:(ow-iw)/2:(oh-ih)/2,"
       "drawtext=text='%{eif\\:n\\:d}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6", str(q / "%05d.jpg"))
    n = len(list(q.glob("*.jpg")))
    for i in range(0, n, 60):
        sh("ffmpeg", "-v", "error", "-y", "-start_number", str(i + 1), "-i", str(q / "%05d.jpg"), "-frames:v", "1",
           "-vf", "tile=10x6:padding=2:color=white", "-q:v", "4", str(d / "folhas" / f"{i // 60 * 2:03d}s.jpg"))
    # cortes de cena
    log = subprocess.run(["ffmpeg", "-i", str(mp4), "-vf", "scdet=threshold=12", "-f", "null", "-"], text=True, capture_output=True).stderr
    cortes = [float(l.split("lavfi.scd.time:")[1].split()[0]) for l in log.splitlines() if "lavfi.scd.time:" in l]
    # volume por segundo
    vol = subprocess.run(["ffmpeg", "-i", str(mp4), "-af", "ebur128=peak=true", "-f", "null", "-"], text=True, capture_output=True).stderr
    integ = [l for l in vol.splitlines() if l.strip().startswith("I:")][-1:]
    res = {"id": vid, "titulo": info.get("title"), "canal": info.get("channel"), "inscritos": info.get("channel_follower_count"),
           "views": info.get("view_count"), "likes": info.get("like_count"), "comentarios": info.get("comment_count"),
           "data": info.get("upload_date"), "duracao": dur, "quadros": n, "fps_origem": info.get("fps"),
           "cortes": cortes, "num_cortes": len(cortes), "plano_medio_s": round(dur / (len(cortes) + 1), 2),
           "loudness": integ, "descricao": (info.get("description") or "")[:800]}
    (d / "info.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print(vid, res["titulo"], res["views"], f"{dur:.1f}s", res["num_cortes"], "cortes", res["plano_medio_s"], "s/plano")


if __name__ == "__main__":
    for u in sys.argv[1:]:
        try:
            um(u)
        except subprocess.CalledProcessError as e:
            print("FALHOU", u, (e.stderr or "")[-600:])
