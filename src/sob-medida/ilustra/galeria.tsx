/** Galeria de teste dos personagens ilustrados (trajes, poses e rostos). Não é usada em vídeo. */
import React from "react";
import { AbsoluteFill } from "remotion";
import { Figura, type Pose, type Rosto, type Traje } from "../../ilustra/Figura";
import type { PropsSobMedida, SomCena } from "../tipos";

export const sons: SomCena[] = [];
const ITENS: { t: Traje; p: Pose; r: Rosto }[] = [
  { t: "camponesa", p: "dancando", r: "riso" },
  { t: "campones", p: "assustado", r: "assustado" },
  { t: "puritano", p: "apontando", r: "preocupado" },
  { t: "puritana", p: "parado", r: "grito" },
  { t: "anos30", p: "ouvindo", r: "assustado" },
  { t: "anos30mulher", p: "falando", r: "preocupado" },
  { t: "estudante", p: "rindo", r: "riso" },
  { t: "medico", p: "falando", r: "neutro" },
  { t: "comum", p: "andando", r: "feliz" },
];
const Galeria: React.FC<PropsSobMedida> = ({ props }) => props.grande ? (
  <AbsoluteFill style={{ background: "linear-gradient(#3A4A7A, #1A2346)", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", paddingBottom: 60 }}>
    {ITENS.slice(0, 3).map((it, i) => (<div key={i} style={{ width: 460, height: 1000 }}><Figura traje={it.t} pose={it.p} rosto={it.r} seed={i + 2} luz="esquerda" /></div>))}
  </AbsoluteFill>
) : (
  <AbsoluteFill style={{ background: "linear-gradient(#3A4A7A, #1A2346)", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", padding: "40px 40px 160px" }}>
    {ITENS.map((it, i) => (
      <div key={i} style={{ width: 200, height: 440, margin: "0 2px" }}>
        <Figura traje={it.t} pose={it.p} rosto={it.r} seed={i + 2} luz={i % 2 ? "direita" : "esquerda"} />
      </div>
    ))}
  </AbsoluteFill>
);
export default Galeria;
