/**
 * Formato "tweet" do Descifre (só Shorts): um post do @descifre que vai se escrevendo
 * palavra por palavra junto com a narração, com curtidas e reposts subindo no fim,
 * o Cifrinho grande embaixo reagindo e um fundo 3D (túnel de partículas + cristal) atrás.
 *
 * No roteiro: "animacao": {"tipo":"tweet","curtidas":48200,"reposts":3100,"reacao":"surpreso","titulo":"FATO"}
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Mascote } from "./Mascote";
import { Cristal, Palco3D, TunelParticulas, CameraFixa } from "./3d/kit";
import { COR, FONTE_TEXTO, FONTE_TITULO, Palavra } from "./tema";
import type { Gesto } from "./personagens/Boneco";

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")} mil` : String(n));

const Fundo3D: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Palco3D camera={[0, 0, 7]} fov={60}>
      <CameraFixa posicao={[Math.sin(f * 0.004) * 0.5, Math.cos(f * 0.003) * 0.3, 7]} alvo={[0, 0, 0]} />
      <TunelParticulas quantidade={170} velocidade={0.08} raio={3.4} />
      <group position={[0, -0.4, -5]} rotation={[0, f * 0.01, 0]}>
        <Cristal escala={1.1} cor={COR.vermelho} />
      </group>
      <group position={[2.6, 2.2, -6]} rotation={[0.4, f * 0.013, 0]}>
        <Cristal escala={0.5} cor={COR.ciano} seed={3} />
      </group>
      <group position={[-2.8, -2.4, -4]} rotation={[0.2, -f * 0.009, 0.3]}>
        <Cristal escala={0.4} cor={COR.amarelo} seed={7} />
      </group>
    </Palco3D>
  );
};

const Icone: React.FC<{ tipo: "coracao" | "repost" | "comentario"; cor: string }> = ({ tipo, cor }) => {
  if (tipo === "coracao")
    return (
      <svg width={54} height={54} viewBox="0 0 24 24">
        <path d="M12 21s-7.5-4.6-9.5-9A5.3 5.3 0 0 1 12 6.3 5.3 5.3 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9z" fill={cor} />
      </svg>
    );
  if (tipo === "repost")
    return (
      <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    );
  return (
    <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-8 8H6l-3 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
    </svg>
  );
};

export const Tweet: React.FC<{
  palavras: Palavra[];
  fala: number;
  dur: number;
  curtidas?: number;
  reposts?: number;
  reacao?: Gesto;
  titulo?: string;
  falando: boolean;
  seed?: number;
}> = ({ palavras, fala, dur, curtidas = 31400, reposts = 2800, reacao = "surpreso", titulo, falando, seed = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const entrada = spring({ frame: f, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
  const fim = f >= fala; // terminou de falar: curtidas disparam e o Cifrinho reage
  const kFim = spring({ frame: f - fala, fps, config: { damping: 9, stiffness: 200 } });
  const prog = interpolate(f, [fala, fala + 0.9 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nCurt = Math.round(curtidas * (0.12 + 0.88 * prog));
  const nRep = Math.round(reposts * (0.12 + 0.88 * prog));
  const cursor = Math.floor(f / 8) % 2 === 0;
  const ultima = palavras.length ? palavras[palavras.length - 1].t1 : 0;
  const visiveis = palavras.filter((p) => t >= p.t0 - 0.03);
  const gesto: Gesto = fim ? reacao : "pensar";
  const expressao = fim ? (reacao === "surpreso" ? "surpreso" : reacao === "comemorar" ? "feliz" : "feliz") : "pensativo";
  const pulo = fim ? Math.sin(Math.min(1, kFim) * Math.PI) * 60 : 0;
  const flut = Math.sin(f / 14) * 6;

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Fundo3D />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(7,15,51,0) 40%, rgba(7,15,51,.75) 100%)" }} />
      {/* etiqueta em cima (FATO, CURIOSIDADE, A CIÊNCIA DIZ) */}
      {titulo && (
        <div style={{ position: "absolute", top: 178, width: "100%", textAlign: "center", transform: `scale(${entrada})` }}>
          <span style={{ fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 38, letterSpacing: 12, color: COR.ciano, background: "rgba(7,15,51,.7)", padding: "8px 28px", borderRadius: 999, border: `3px solid ${COR.ciano}55` }}>
            {titulo}
          </span>
        </div>
      )}
      {/* o card */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 290 + flut,
          background: "rgba(10, 18, 60, .92)",
          border: `4px solid ${COR.ciano}44`,
          borderRadius: 44,
          padding: "44px 48px 36px",
          boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 60px ${COR.ciano}22`,
          transform: `scale(${0.7 + 0.3 * entrada}) rotate(${(1 - entrada) * -4}deg)`,
          opacity: Math.min(1, entrada * 1.5),
          backdropFilter: "blur(6px)",
        }}
      >
        {/* cabeçalho: avatar + nome + arroba + selo */}
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 150, height: 150, borderRadius: 75, background: `radial-gradient(circle at 40% 35%, ${COR.azul}, ${COR.azulEscuro})`, border: `5px solid ${COR.ciano}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <div style={{ transform: "translateY(6px)" }}>
              <Mascote tamanho={150} flutua={false} seed={seed + 3} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: FONTE_TITULO, fontWeight: 800, fontSize: 52, color: COR.branco }}>Cifrinho</span>
              <svg width={48} height={48} viewBox="0 0 24 24">
                <path d="M12 1.5l2.6 2.2 3.4-.4 1 3.3 3 1.7-1.3 3.2 1.3 3.2-3 1.7-1 3.3-3.4-.4L12 22.5l-2.6-2.2-3.4.4-1-3.3-3-1.7 1.3-3.2L2 9.3l3-1.7 1-3.3 3.4.4z" fill={COR.ciano} />
                <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke={COR.azulEscuro} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 40, color: "#9FB3E8" }}>@descifre · agora</span>
          </div>
        </div>
        {/* texto que se escreve com a fala */}
        <div style={{ marginTop: 34, fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 60, lineHeight: 1.28, color: COR.branco, minHeight: 300, display: "flex", flexWrap: "wrap", gap: "0 18px", alignContent: "flex-start" }}>
          {visiveis.map((p, i) => {
            const ativa = t >= p.t0 && t <= p.t1 + 0.06;
            const k = spring({ frame: f - Math.round(p.t0 * fps), fps, config: { damping: 12, stiffness: 320, mass: 0.5 } });
            const destaque = /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}/.test(p.w);
            return (
              <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - k) * 18}px) scale(${0.9 + 0.1 * k})`, opacity: Math.min(1, k * 1.4), color: destaque ? COR.amarelo : ativa ? COR.ciano : COR.branco, fontWeight: destaque ? 800 : 600 }}>
                {p.w}
              </span>
            );
          })}
          {!fim && t <= ultima + 0.3 && cursor && <span style={{ display: "inline-block", width: 6, height: 66, background: COR.ciano, marginTop: 6, borderRadius: 3 }} />}
        </div>
        {/* rodapé: comentários, reposts, curtidas */}
        <div style={{ marginTop: 26, paddingTop: 24, borderTop: `3px solid ${COR.ciano}22`, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#9FB3E8", fontFamily: FONTE_TEXTO, fontWeight: 700, fontSize: 40 }}>
            <Icone tipo="comentario" cor="#9FB3E8" /> {fmt(Math.round(nRep * 0.4))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: fim ? "#2FD37A" : "#9FB3E8", fontFamily: FONTE_TEXTO, fontWeight: 700, fontSize: 40, transform: `scale(${fim ? 1 + 0.25 * Math.max(0, 1 - prog) : 1})` }}>
            <Icone tipo="repost" cor={fim ? "#2FD37A" : "#9FB3E8"} /> {fmt(nRep)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: fim ? COR.vermelho : "#9FB3E8", fontFamily: FONTE_TEXTO, fontWeight: 800, fontSize: 44, transform: `scale(${fim ? 1 + 0.35 * Math.max(0, 1 - prog) : 1})` }}>
            <Icone tipo="coracao" cor={fim ? COR.vermelho : "#9FB3E8"} /> {fmt(nCurt)}
          </div>
        </div>
      </div>
      {/* corações subindo quando acaba a fala */}
      {fim &&
        Array.from({ length: 9 }).map((_, i) => {
          const d = (f - fala - i * 3) / fps;
          if (d < 0 || d > 1.4) return null;
          const x = 540 + Math.sin(i * 2.3) * 300 + Math.sin(d * 6 + i) * 30;
          const y = 1180 - d * 520;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, opacity: 1 - d / 1.4, transform: `scale(${0.6 + d * 0.6})` }}>
              <Icone tipo="coracao" cor={i % 3 === 0 ? COR.amarelo : COR.vermelho} />
            </div>
          );
        })}
      {/* Cifrinho reagindo embaixo */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1250 - pulo, display: "flex", justifyContent: "center", transform: `scale(${0.6 + 0.4 * entrada})` }}>
        <Mascote tamanho={600} falando={falando} gesto={gesto} expressao={expressao as never} seed={seed} />
      </div>
    </AbsoluteFill>
  );
};
