# Descifre — fábrica de vídeos

Roteiro em cenas → voz natural (Edge TTS) com legenda palavra por palavra → b-roll (Pixabay) →
animação no Remotion com o mascote Cifrinho → render em 8 partes paralelas → postagem no YouTube.
Tudo roda no GitHub Actions (grátis em repositório público, máquinas de 4 núcleos).

## Pastas

```
roteiros/NNN.json        cenas do vídeo (texto, b-roll, animação)
roteiros/NNN.meta.json   título, descrição, tags e thumbnail
src/                     template do vídeo (Remotion)
scripts/voz.py           narração + tempos de cada palavra (Edge TTS, reserva Piper)
scripts/broll.py         b-roll do Pixabay, sem repetir clipes
scripts/montar.py        manifesto com os tempos + faixa única de narração
scripts/publicar.py      upload no YouTube com capítulos automáticos
brand/                   logo, foto de perfil, banner e mascote
public/musica/           (opcional) coloque 1 música .mp3 sem direitos autorais
```

## Personagens, animações e trilhas

- `elenco.json`: personagens (visual + voz). Hoje: cifrinho, tesla, homem, mulher, jovem, idoso, cientista, executivo.
- Na cena do roteiro: `"quem"` (quem fala), `"personagens": [{"id","gesto","expressao","entrada","lado"}]`.
  Gestos: parado, explicar, apontar, acenar, pensar, cruzar, surpreso, comemorar.
  Entradas: pop, deslizar, cair, teletransporte.
- Animações: `"animacao": {"tipo": "ilustracao", "nome": "...", "texto": "..."}` com lampada, engrenagens, neuronios,
  dominos, balanca, ampulheta, marionete, raio, grafico, cadeado, coracao, olho, interrogacao (`src/Ilustracoes.tsx`).
- Trilha: `"trilha": "misterio" | "tenso" | "leve"` no roteiro (geradas por `scripts/trilha.py`).
- Shorts: `"formato": "short"` no roteiro (arquivos `roteiros/sNN.json`).

## Gerar um vídeo

- **Automático:** suba um novo `roteiros/NNN.json` → o vídeo é gerado (sem postar).
- **Manual:** aba **Actions → Gerar vídeo → Run workflow**, escolha o número e se quer postar.
- O MP4 e a thumbnail ficam em **Artifacts** da execução por 14 dias.

## Secrets necessários (Settings → Secrets and variables → Actions)

| Nome | Para quê |
|---|---|
| `PIXABAY_API_KEY` | b-roll |
| `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` | postar no YouTube |

## Testar no computador

```
npm ci
python scripts/montar.py 001 --estimar   # prévia sem voz
npx remotion studio                       # abre o editor visual
```
