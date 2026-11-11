import "@fontsource/unbounded/800.css";
import "@fontsource/unbounded/500.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/600.css";

export const COR = {
  azulEscuro: "#070F33",
  azul: "#14318F",
  azulClaro: "#2F6BFF",
  vermelho: "#FF3B4E",
  vermelhoEsc: "#C81E3A",
  ciano: "#5BE0FF",
  branco: "#F4F7FF",
  amarelo: "#FFD84D",
};

export const FONTE_TITULO = "Unbounded, sans-serif";
export const FONTE_TEXTO = "Poppins, sans-serif";

export type Palavra = { w: string; t0: number; t1: number };

export type Animacao =
  | { tipo: "nenhuma" }
  | { tipo: "titulo"; texto: string }
  | { tipo: "mascote"; texto: string }
  | { tipo: "pergunta"; numero: number; texto: string; a: string; b: string; rotulo?: string; total?: number }
  | { tipo: "contagem"; pergunta?: { numero: number; texto: string; a: string; b: string; rotulo?: string; total?: number } }
  | { tipo: "conceito"; nome: string; frase: string; rotulo?: string }
  | { tipo: "citacao"; texto: string; autor: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "resultado"; faixa: string; titulo: string }
  | { tipo: "encerramento" }
  | { tipo: "ilustracao"; nome: string; texto?: string }
  | { tipo: "gancho"; texto: string }
  | { tipo: "cta"; texto: string }
  | { tipo: "cena3d"; nome: string; texto?: string } // cena 3D padrão (src/3d/cenas3d.tsx)
  | { tipo: "sobmedida"; nome: string; props?: Record<string, any> } // cena da história deste vídeo (src/sob-medida/ID/)
  // linguagem de "documentário animado" (src/Documentario.tsx)
  | { tipo: "local"; texto: string; ano?: string | number } // etiqueta "LUGAR · ANO" no canto
  | { tipo: "documento"; titulo: string; autor: string; ano: string | number; revista?: string; trecho: string; destaque: string; nota?: string; p0?: number; p1?: number }
  | { tipo: "carimbo"; texto: string; frase?: string; p?: number } // MITO, VERDADE, EM DEBATE
  | { tipo: "capitulo"; numero: number; titulo: string; rotulo?: string }
  | { tipo: "fim"; texto?: string; thumb?: string | { linha1: string; destaque: string; selo?: string } } // só Shorts
  | { tipo: "vinheta" }; // abertura de 3,5 s, sempre igual

export type Cena = {
  id: number;
  texto: string;
  inicio: number; // frame inicial
  duracao: number; // frames
  fala: number; // frames de fala (o resto é pausa)
  palavras: Palavra[]; // tempos em segundos, relativos ao início da cena
  broll: string | null; // caminho em public/
  brollFrames?: number; // duração do clipe (frames)
  animacao: Animacao;
  quem?: string; // id do personagem que fala (padrão: cifrinho)
  personagens?: import("./personagens/Palco").AtorCena[];
  lofi?: "leve" | "forte" | "nenhum"; // shader no b-roll (padrão: leve)
  camera?: "push" | "pan" | "parada"; // movimento lento da câmera (padrão: alterna push/pan)
  transicao?: "fusao" | "corte" | "preto" | "glitch" | "zoom" | "deslize" | "luz"; // como a cena ENTRA (padrão: fusão)
  local?: { texto: string; ano?: string | number }; // etiqueta de lugar/ano por cima de qualquer visual
  previa?: number; // gancho: esta cena mostra o visual da cena N (prévia)
  capitulo?: string | null;
};

export type Manifesto = {
  id: string;
  titulo: string;
  fps: number;
  totalFrames: number;
  narracao: string | null;
  musica: string | null;
  sfx?: string | null;
  formato?: "longo" | "short";
  cenas: Cena[];
};
