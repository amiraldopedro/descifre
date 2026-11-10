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
  | { tipo: "pergunta"; numero: number; texto: string; a: string; b: string }
  | { tipo: "contagem"; pergunta?: { numero: number; texto: string; a: string; b: string } }
  | { tipo: "conceito"; nome: string; frase: string }
  | { tipo: "citacao"; texto: string; autor: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "resultado"; faixa: string; titulo: string }
  | { tipo: "encerramento" }
  | { tipo: "gancho"; texto: string }
  | { tipo: "cta"; texto: string };

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
