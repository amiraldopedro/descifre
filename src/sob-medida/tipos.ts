/**
 * Contrato das cenas SOB MEDIDA (feitas para a história de um vídeo específico).
 *
 * Onde ficam:   src/sob-medida/<id do roteiro>/<nome>.tsx   (ex.: src/sob-medida/d02/elevador.tsx)
 * Como exportar: export default <componente>  +  export const sons = [...] (opcional)
 * No roteiro:    "animacao": { "tipo": "sobmedida", "nome": "d02/elevador", "props": {...} }
 * Registro:      scripts/registrar.py gera src/sob-medida/index.ts (roda sozinho no workflow).
 *
 * Pode usar tudo: kit 3D (src/3d/kit.tsx), ilustrações, personagens, SVG livre.
 * A cena ocupa a tela inteira; a legenda é desenhada por cima pelo template.
 */
import type React from "react";

export type PropsSobMedida = {
  dur: number; // duração total da cena (frames)
  fala: number; // frames com narração (o resto é pausa)
  falando: boolean; // a voz está soando neste frame
  vertical: boolean; // true no Short 9:16
  props: Record<string, any>; // parâmetros livres vindos do roteiro
};

/** Efeito sonoro da cena. Use "p" (0..1, proporção da FALA — acompanha a narração, recomendado)
 *  ou "t" (segundos fixos desde o início da cena). "vol" opcional (padrão 1). */
export type SomCena = { som: NomeSom; p?: number; t?: number; fim?: number; vol?: number; fase?: string }; // fase = só toca quando props.fase for igual // fim = segundos antes do fim da cena

/** Converte proporção da fala em frame (use na cena para bater com os sons). */
export const emP = (p: number, fala: number) => p * fala;

export type NomeSom = // sintetizados (montar.py) + gravados em public/sons (mapa.json, CC0)
  | "808" | "alarme" | "alerta" | "aparece" | "aplausos" | "barra" | "batida" | "batida_leve"
  | "bolha" | "boom" | "boom_forte" | "brilho" | "brilho_longo" | "caixa" | "caneta" | "certo"
  | "click" | "confete" | "conta_sobe" | "contagem" | "decifra" | "degrau1" | "degrau2" | "degrau3"
  | "degrau4" | "degrau5" | "desce" | "desliga" | "digitar" | "ding" | "enter" | "errado"
  | "estatica" | "falha" | "faller" | "gira" | "giz" | "glitch" | "hacker" | "impacto"
  | "impacto_max" | "liga" | "marcador" | "mecanico" | "mensagem" | "metal" | "moeda" | "moedas"
  | "mola" | "numero" | "pagina" | "papel" | "passos" | "pop" | "pop_pequeno" | "pop_sai"
  | "porta" | "puf" | "queda_grave" | "relogio" | "relogio_rapido" | "risco" | "riser" | "riser_longo"
  | "riser_suave" | "rumble" | "scan" | "shutter" | "shutter_forte" | "slam" | "sobe" | "soco"
  | "sub" | "swipe" | "swish" | "tap" | "tecla" | "tique" | "toggle" | "toque"
  | "trava" | "trovao" | "vibra" | "vinheta_bold" | "vinheta_tech" | "whoosh" | "whoosh_forte" | "whoosh_lento"
  | "whoosh_leve" | "whoosh_rev" | "zap" | "zip" | "zoom";

export type ModuloSobMedida = { default: React.FC<PropsSobMedida>; sons?: SomCena[]; vertical?: boolean }; // vertical = a cena já se adapta ao Short (senão roda numa telinha 16:9)
