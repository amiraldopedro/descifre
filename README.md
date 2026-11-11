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

## Linguagem de documentário animado

- **Câmera sempre em movimento:** toda cena aproxima devagar (push) ou desliza de lado (pan), alternando sozinha;
  o fundo anda menos que o primeiro plano (parallax). Por cena: `"camera": "push" | "pan" | "parada"`.
- **Fusão entre cenas** (~0,5 s) em vez de corte seco. Por cena: `"transicao": "fusao" | "corte" | "preto"`
  (`preto` = fade para o preto, automático antes e depois de um capítulo). Cena com `"lofi": "forte"` entra com glitch.
- **Vinheta:** `"vinheta": true` no roteiro coloca a abertura de 3,5 s do Cifrinho no começo (ou `{"tipo": "vinheta"}`).
- **Gancho com prévias:** `"previa": 8` faz a cena mostrar o visual da cena 8 (animação, b-roll, personagens).
- **Cenas sem fala:** `"texto": ""` (vinheta, cartela de capítulo).
- Novos tipos de `animacao` (`src/Documentario.tsx`, sons em `scripts/montar.py`):

| tipo | campos | o que faz |
|---|---|---|
| `local` | `texto`, `ano?` | etiqueta "LUGAR · ANO" no canto; também como campo `"local": {...}` por cima de qualquer cena |
| `documento` | `titulo`, `autor`, `ano`, `revista?`, `trecho`, `destaque`, `nota?`, `p0?`, `p1?` | página de estudo em papel velho; marca-texto amarelo passa no `destaque` entre `p0` e `p1` da fala |
| `carimbo` | `texto` (MITO / VERDADE / EM DEBATE), `frase?`, `p?` | carimbo bate na tela (vermelho / ciano / amarelo); com `frase`, bate em `p` da fala |
| `capitulo` | `numero`, `titulo` | cartela cheia com fade para o preto; vira capítulo do YouTube sozinho |
| `fim` (Shorts) | `texto?` (linhas com `\|`), `thumb?` ou `video` | "VÍDEO COMPLETO NO CANAL" com a thumb do longo (`video: "002"` usa a thumb do `002.meta.json`) e o Cifrinho apontando |
| `vinheta` | — | abertura de 3,5 s, sempre igual |

Exemplo completo: `roteiros/d03.json` (experimento de Milgram).

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
