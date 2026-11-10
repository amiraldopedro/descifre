// Renderiza vários quadros de teste de uma vez (empacota uma vez só) e monta uma grade.
// Uso: node scripts/quadros.mjs ID 120,450,900 [saida.png] [--chrome=/usr/bin/google-chrome]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const [id, lista, saida = `/tmp/quadros_${id}.png`] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const chrome = (process.argv.find((a) => a.startsWith("--chrome=")) || "--chrome=/usr/bin/google-chrome").slice(9);
const props = JSON.parse(readFileSync(`public/build/${id}/manifest.json`, "utf8"));
const comp = props.formato === "short" ? "Short" : "Video";
const frames = lista.split(",").map(Number);
const dir = `/tmp/quadros_${id}`;
mkdirSync(dir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: props, browserExecutable: chrome, chromiumOptions: { gl: "angle" } });
const arquivos = [];
for (const frame of frames) {
  const out = `${dir}/${frame}.png`;
  await renderStill({ serveUrl, composition, inputProps: props, frame, output: out, browserExecutable: chrome, chromiumOptions: { gl: "angle" }, scale: 0.5 });
  arquivos.push(out);
  process.stdout.write(`${frame} `);
}
// grade com python/PIL (2 colunas)
execFileSync("python3", ["-c", `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size
cols=2; rows=(len(ims)+1)//2; g=Image.new('RGB',(w*cols,h*rows))
for i,(im,f) in enumerate(zip(ims,fs)):
    g.paste(im,((i%cols)*w,(i//cols)*h)); ImageDraw.Draw(g).text(((i%cols)*w+8,(i//cols)*h+8),f.split('/')[-1],fill='yellow')
g.save(sys.argv[1])`, saida, ...arquivos]);
console.log(`\ngrade: ${saida}`);
