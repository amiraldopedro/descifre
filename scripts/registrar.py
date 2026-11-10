"""Gera src/sob-medida/index.ts com todas as cenas sob medida (uma pasta por vídeo)
e scripts/sons_cenas.json com os efeitos sonoros declarados em cada cena.

Uso: python scripts/registrar.py
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "src" / "sob-medida"


def main():
    linhas, entradas, sons = ["// GERADO por scripts/registrar.py — não edite à mão.",
                              'import type { ModuloSobMedida } from "./tipos";'], [], {}
    i = 0
    for arq in sorted(PASTA.glob("*/*.tsx")):
        chave = f"{arq.parent.name}/{arq.stem}"
        var = f"m{i}"
        i += 1
        linhas.append(f'import * as {var} from "./{chave}";')
        entradas.append(f'  "{chave}": {var} as ModuloSobMedida,')
        # lê "export const sons = [...]" (JSON-like) para o mix de efeitos
        txt = arq.read_text()
        m = re.search(r"export const sons[^=]*=\s*(\[[\s\S]*?\]);", txt)
        if m:
            bruto = re.sub(r"//.*", "", m.group(1))
            bruto = re.sub(r"(\w+)\s*:", r'"\1":', bruto)
            bruto = re.sub(r",\s*([\]}])", r"\1", bruto)
            try:
                sons[chave] = json.loads(bruto)
            except json.JSONDecodeError:
                print(f"aviso: não consegui ler sons de {chave}")
    linhas.append("export const SOB_MEDIDA: Record<string, ModuloSobMedida> = {")
    linhas += entradas
    linhas.append("};")
    (PASTA / "index.ts").write_text("\n".join(linhas) + "\n")
    (RAIZ / "scripts" / "sons_cenas.json").write_text(json.dumps(sons, ensure_ascii=False, indent=1))
    print(f"registradas {i} cenas sob medida")


if __name__ == "__main__":
    main()
