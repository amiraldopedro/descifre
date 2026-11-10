/**
 * Prova 7 — Tarefa 2-4-6 de Wason (1960): viés de confirmação.
 * fase "pergunta": "Eu tenho uma regra secreta, e a sequência dois, quatro, seis segue essa regra.
 *                   Que outros três números você testaria para descobrir qual é?"  (+ pausa com contador)
 * fase "testes":   "A maioria testa coisas como oito, dez, doze. Ou vinte, quarenta, sessenta.
 *                   Tudo dá certo, e a pessoa jura que a regra é somar de dois em dois."
 * fase "revelar":  "Mas a regra era só: números em ordem crescente. Um, dois, três também valia.
 *                   Quase ninguém testa uma sequência que poderia dar errado."
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE_TITULO, FONTE_TEXTO } from "../../tema";
import type { PropsSobMedida, SomCena } from "../tipos";
import { Contador, Rotulo, Selo, useMolaEm } from "../comum";

export const sons: SomCena[] = [
  { som: "click", p: 0.06, fase: "pergunta" },
  { som: "pop", p: 0.32, fase: "pergunta" }, { som: "pop", p: 0.37, fase: "pergunta" }, { som: "pop", p: 0.42, fase: "pergunta" },
  { som: "ding", p: 0.5, fase: "pergunta" },
  { som: "tique", fim: 3, fase: "pergunta" }, { som: "tique", fim: 2, fase: "pergunta" }, { som: "tique", fim: 1, fase: "pergunta" },
  { som: "pop", p: 0.18, fase: "testes" }, { som: "pop", p: 0.33, fase: "testes" },
  { som: "ding", p: 0.45, fase: "testes" }, { som: "ding", p: 0.5, fase: "testes" },
  { som: "pop", p: 0.85, fase: "testes" },
  { som: "click", p: 0.08, fase: "revelar" }, { som: "brilho", p: 0.12, fase: "revelar" },
  { som: "ding", p: 0.45, fase: "revelar" },
  { som: "glitch", p: 0.75, fase: "revelar" },
];

const Linha: React.FC<{ nums: (string | number)[]; ok?: boolean | null; k: number; kOk?: number; destaque?: boolean; nota?: string }> = ({
  nums, ok = null, k, kOk = 0, destaque, nota,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 30, transform: `translateX(${(1 - k) * -80}px)`, opacity: k, marginBottom: 22 }}>
    <div
      style={{
        display: "flex", gap: 22, padding: "16px 40px", borderRadius: 26,
        background: destaque ? "rgba(255,59,78,.18)" : "rgba(7,15,51,.8)",
        border: `3px solid ${destaque ? COR.vermelho : `${COR.ciano}55`}`,
      }}
    >
      {nums.map((n, i) => (
        <div key={i} style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 84, color: COR.branco, minWidth: 110, textAlign: "center" }}>{n}</div>
      ))}
    </div>
    {ok !== null && (
      <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 90, color: ok ? "#4BE08A" : COR.vermelho, transform: `scale(${kOk})` }}>{ok ? "✓" : "✗"}</div>
    )}
    {nota && <div style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 32, color: COR.amarelo, maxWidth: 360, opacity: kOk }}>{nota}</div>}
  </div>
);

const Cadeado: React.FC<{ aberto: number; texto: string; k: number }> = ({ aberto, texto, k }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 22, transform: `scale(${k})`, marginBottom: 40 }}>
    <svg width={90} height={100} viewBox="0 0 90 100">
      <path d={`M22 46 V30 Q22 8 45 8 Q68 8 68 30 V${46 - aberto * 18}`} fill="none" stroke="#B8C2DD" strokeWidth={10} transform={`translate(0 ${-aberto * 10})`} />
      <rect x={10} y={44} width={70} height={52} rx={12} fill={aberto ? COR.amarelo : COR.vermelho} stroke={COR.azulEscuro} strokeWidth={5} />
    </svg>
    <div style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 48, color: aberto ? COR.amarelo : COR.branco }}>{texto}</div>
  </div>
);

const Wason: React.FC<PropsSobMedida> = ({ fala, dur, props }) => {
  const f = useCurrentFrame();
  const mola = useMolaEm();
  const q = (p: number) => p * fala;
  const fase = props.fase ?? "pergunta";

  if (fase === "pergunta") {
    const n = [mola(q(0.32)), mola(q(0.37)), mola(q(0.42))];
    const pisca = 0.5 + Math.abs(Math.sin(f / 8)) * 0.5;
    return (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
        <Rotulo texto="PROVA 7 DE 7" />
        <div style={{ height: 30 }} />
        <Cadeado aberto={0} texto="REGRA SECRETA" k={mola(q(0.05))} />
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Linha nums={[n[0] > 0.01 ? 2 : "", n[1] > 0.01 ? 4 : "", n[2] > 0.01 ? 6 : ""]} ok k={mola(q(0.3))} kOk={mola(q(0.5))} />
        </div>
        <div style={{ opacity: mola(q(0.72)) * pisca }}>
          <Linha nums={["?", "?", "?"]} k={1} />
        </div>
        <Contador fala={fala} dur={dur} texto="SEU TESTE?" y={800} />
      </AbsoluteFill>
    );
  }

  if (fase === "testes") {
    const ok = mola(q(0.45));
    const pensa = mola(q(0.85));
    return (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
        <Rotulo texto="PROVA 7 DE 7" />
        <div style={{ height: 40 }} />
        <Linha nums={[2, 4, 6]} ok k={1} kOk={1} />
        <Linha nums={[8, 10, 12]} ok k={mola(q(0.18))} kOk={ok} />
        <Linha nums={[20, 40, 60]} ok k={mola(q(0.33))} kOk={mola(q(0.5))} />
        <div
          style={{
            marginTop: 10, transform: `scale(${pensa})`, background: COR.branco, color: COR.azulEscuro,
            fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52, padding: "16px 44px", borderRadius: 60,
          }}
        >
          "É de 2 em 2!"
        </div>
      </AbsoluteFill>
    );
  }

  // revelar
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
      <Rotulo texto="PROVA 7 DE 7" />
      <div style={{ height: 30 }} />
      <Cadeado aberto={mola(q(0.08))} texto="REGRA: ORDEM CRESCENTE" k={1} />
      <Linha nums={[1, 2, 3]} ok k={mola(q(0.42))} kOk={mola(q(0.47))} />
      <Linha nums={[6, 4, 2]} ok={false} k={mola(q(0.72))} kOk={mola(q(0.76))} destaque nota="o teste que quase ninguém faz" />
      <div style={{ marginTop: 6 }}>
        <Selo texto="TENTE PROVAR QUE ESTÁ ERRADO" k={mola(q(0.9))} cor={COR.azulClaro} rot={-3} style={{ fontSize: 44 }} />
      </div>
    </AbsoluteFill>
  );
};

export default Wason;
