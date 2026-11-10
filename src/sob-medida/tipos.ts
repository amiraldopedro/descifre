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

export type NomeSom =
  | "whoosh" | "pop" | "ding" | "click" | "tique" | "boom" | "zap" | "brilho"
  | "mecanico" | "batida" | "glitch" | "sobe" | "desce" | "porta" | "passos";

export type ModuloSobMedida = { default: React.FC<PropsSobMedida>; sons?: SomCena[]; vertical?: boolean }; // vertical = a cena já se adapta ao Short (senão roda numa telinha 16:9)
