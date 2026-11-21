import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  A,
  Block,
  C,
  CAP_DURATION,
  FONT,
  Line,
  NodeState,
  STAGES,
  T,
  ease,
} from "./Capacidad";

/* Versión horizontal Full HD (1920×1080) del reel u1124.
   Misma línea de tiempo, música y textos que la 4:5; puesta rediseñada para 16:9. */

export const H_W = 1920;
export const H_H = 1080;
const PAD = 110;

const Clip: React.FC<{ src: string; from?: number; to?: number; len: number }> = ({
  src,
  from = 1.1,
  to = 1.0,
  len,
}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, len], [from, to], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.gris }}>
      <OffthreadVideo
        src={A(`clips-h/${src}.mp4`)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})` }}
      />
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => (
  <Img
    src={A("marca/logo-umami-blanco.png")}
    style={{ position: "absolute", left: 72, top: 60, width: 170 }}
  />
);

// Panel recortado (clip dentro de una caja)
const Panel: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number;
  reveal?: number;
  children: React.ReactNode;
}> = ({ left, top, width, height, radius = 0, reveal = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      height,
      overflow: "hidden",
      borderRadius: radius,
      clipPath: `inset(${(1 - reveal) * 100}% 0 0 0 round ${radius}px)`,
    }}
  >
    {children}
  </div>
);

/* ───────────── Esquema de la operación (16:9) ───────────── */

const PX0 = 300;
const PSTEP = 330;
const nodeX = (i: number) => PX0 + i * PSTEP;

const Pipeline: React.FC<{
  y: number;
  draw: number;
  states: NodeState[];
  indicator?: number | null;
  pulse?: number;
}> = ({ y, draw, states, indicator = null, pulse = 0 }) => {
  const lineEnd = PX0 + (nodeX(4) - PX0) * draw;
  return (
    <AbsoluteFill>
      <svg width={H_W} height={H_H} style={{ position: "absolute" }}>
        <line x1={PX0} y1={y} x2={nodeX(4)} y2={y} stroke={C.linea} strokeWidth={6} strokeLinecap="round" opacity={draw > 0 ? 1 : 0} strokeDasharray={`${lineEnd - PX0} 3000`} />
        {indicator !== null && (
          <line x1={PX0} y1={y} x2={nodeX(0) + indicator * PSTEP} y2={y} stroke={C.oliva} strokeWidth={6} strokeLinecap="round" />
        )}
        {STAGES.map((_, i) => {
          const appear = interpolate(draw * 4, [i - 0.6, i], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const st = states[i];
          const fill = st === "hot" ? C.naranja : st === "ok" ? C.oliva : C.gris;
          const stroke = st === "hot" ? C.naranja : st === "ok" ? C.oliva : C.blanco;
          const r = 24 * appear * (st === "hot" ? 1.25 : 1);
          return (
            <g key={i}>
              {st === "hot" &&
                [0, 0.5].map((off) => {
                  const ph = (pulse + off) % 1;
                  return <circle key={off} cx={nodeX(i)} cy={y} r={30 + ph * 60} fill="none" stroke={C.naranja} strokeWidth={4} opacity={(1 - ph) * 0.8} />;
                })}
              <circle cx={nodeX(i)} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={5} />
            </g>
          );
        })}
        {indicator !== null && <circle cx={nodeX(0) + indicator * PSTEP} cy={y} r={13} fill={C.blanco} />}
      </svg>
      {STAGES.map((s, i) => {
        const appear = interpolate(draw * 4, [i - 0.4, i], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const st = states[i];
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: nodeX(i) - 150,
              width: 300,
              top: y + 54,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: st === "hot" ? 800 : 500,
              color: st === "hot" ? C.naranja : C.blanco,
              opacity: appear * (st === "off" ? 0.75 : 1),
              transform: `translateY(${(1 - appear) * 16}px)`,
            }}
          >
            {s}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ───────────── Escenas ───────────── */

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [8, 44], [0, 20], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const big = ease(f, 6, 16);
  const win = ease(f, 18, 20);
  const mas = ease(f, 40, 14);
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <Logo />
      <div style={{ position: "absolute", left: PAD, top: 250 }}>
        <Line text="Si mañana" delay={0} size={76} weight={300} />
        <Line text="vendieras un" delay={4} size={76} weight={300} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 30, marginTop: -6 }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 225,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: C.naranja,
              opacity: big,
              transform: `scale(${0.85 + big * 0.15})`,
              transformOrigin: "left bottom",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +{n} %
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86, color: C.blanco, opacity: mas, transform: `translateX(${(1 - mas) * -20}px)` }}>
            más…
          </div>
        </div>
      </div>
      <Panel left={1130} top={100} width={690} height={880} radius={28} reveal={win}>
        <Sequence from={18} layout="none">
          <Clip src="a-clientes" len={66} from={1.15} to={1.03} />
        </Sequence>
      </Panel>
    </AbsoluteFill>
  );
};

const Atender: React.FC = () => (
  <AbsoluteFill>
    <Clip src="b-barra" len={60} from={1.12} to={1.0} />
    <Logo />
    <div style={{ position: "absolute", left: 90, top: 700 }}>
      <Block text="¿podrías" delay={2} bg={C.naranja} color={C.blanco} size={100} />
      <Block text="atenderlo bien?" delay={7} bg={C.blanco} color={C.gris} size={100} />
    </div>
  </AbsoluteFill>
);

const Mesas: React.FC = () => {
  const f = useCurrentFrame();
  const panel = ease(f, 0, 14);
  const tables = 15;
  const empty = [4, 11];
  return (
    <AbsoluteFill style={{ background: C.arena }}>
      <Panel left={0} top={0} width={1100} height={1080}>
        <Clip src="c-sala-vacia" len={84} from={1.0} to={1.08} />
      </Panel>
      <Logo />
      <div
        style={{
          position: "absolute",
          left: 1100,
          top: 0,
          width: 820,
          height: 1080,
          background: C.arena,
          transform: `translateX(${(1 - panel) * 820}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 90, top: 170 }}>
          <Line text="Mesas" delay={6} size={104} weight={800} color={C.gris} />
          <Line text="libres hay." delay={10} size={104} weight={800} color={C.gris} />
        </div>
        <div style={{ position: "absolute", left: 90, top: 520, width: 640, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", rowGap: 34, columnGap: 34 }}>
          {Array.from({ length: tables }).map((_, i) => {
            const on = !empty.includes(i) && f > 26 + i * 3;
            const pop = ease(f, 26 + i * 3, 10);
            return (
              <div
                key={i}
                style={{
                  height: 98,
                  borderRadius: 18,
                  border: `5px solid ${C.oliva}`,
                  background: on ? C.oliva : "transparent",
                  transform: `scale(${on ? 0.9 + pop * 0.1 : 1})`,
                  opacity: ease(f, 14 + i, 10),
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Resto: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <Logo />
      <div style={{ position: "absolute", left: PAD, top: 230 }}>
        <Line text="¿Y el resto de" delay={0} size={100} weight={300} />
        <Line text="la operación?" delay={5} size={100} weight={800} />
      </div>
      <Pipeline y={740} draw={ease(f, 14, 36)} states={["off", "off", "off", "off", "off"]} />
    </AbsoluteFill>
  );
};

const STAGE_CLIPS = ["e1-produccion", "e2-pase", "e3-sala", "e4-lavado", "e5-cobro"];

const Etapa: React.FC<{ i: number }> = ({ i }) => (
  <AbsoluteFill style={{ background: C.gris }}>
    <Panel left={720} top={0} width={1200} height={1080}>
      <Clip src={STAGE_CLIPS[i]} len={36} from={1.14} to={1.02} />
    </Panel>
    <Logo />
    <div style={{ position: "absolute", left: 90, top: 430 }}>
      <Block text={`0${i + 1}`} delay={0} bg={C.oliva} color={C.blanco} size={44} weight={700} />
      <Block text={`${STAGES[i]}.`} delay={2} bg={C.blanco} color={C.gris} size={88} />
    </div>
    {/* progreso de las 5 etapas */}
    <div style={{ position: "absolute", left: 110, top: 940, display: "flex", gap: 10 }}>
      {STAGES.map((_, k) => (
        <div key={k} style={{ width: 92, height: 8, borderRadius: 4, background: k < i ? C.oliva : k === i ? C.blanco : "rgba(255,255,255,0.25)" }} />
      ))}
    </div>
  </AbsoluteFill>
);

const Satura: React.FC = () => {
  const f = useCurrentFrame();
  const travel = interpolate(f, [24, 70], [0, 2], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const jump = ease(f, 150, 16);
  const hotLavado = f >= 162;
  const states: NodeState[] = STAGES.map((_, i) => {
    if (f < 150) {
      if (i === 2 && f >= 70) return "hot";
      return i < 2 && travel >= i ? "ok" : "off";
    }
    if (i <= 2) return "ok";
    return i === 3 && hotLavado ? "hot" : "off";
  });
  const pulse = (f % 24) / 24;
  const shake = f >= 162 && f < 174 ? Math.sin(f * 2.4) * (174 - f) * 1.2 : 0;
  const text1Out = interpolate(f, [126, 134], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = 780;
  const jx = nodeX(2) + jump * PSTEP;
  const jy = y - Math.sin(jump * Math.PI) * 160;
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <Logo />
      <div style={{ position: "absolute", left: PAD, top: 190, opacity: text1Out }}>
        <Line text="La capacidad real la marca" delay={0} size={84} weight={300} />
        <Line text="el primer punto" delay={4} size={84} weight={300} />
        <Line text="que se satura." delay={8} size={84} weight={800} color={C.naranja} />
      </div>
      {f >= 132 && (
        <div style={{ position: "absolute", left: PAD, top: 220 }}>
          <Sequence from={132} layout="none">
            <Line text="Y no siempre" delay={0} size={110} weight={300} />
            <Line text="es la sala." delay={5} size={110} weight={800} />
          </Sequence>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
        <Pipeline y={y} draw={1} states={states} indicator={f < 150 ? travel : null} pulse={pulse} />
        {f >= 150 && f < 166 && (
          <svg width={H_W} height={H_H} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={jx} cy={jy} r={26} fill={C.naranja} />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Volumen: React.FC = () => (
  <AbsoluteFill style={{ background: C.gris }}>
    <Panel left={820} top={0} width={1100} height={1080}>
      <Clip src="h-chef" len={96} from={1.0} to={1.1} />
    </Panel>
    <Logo />
    <div style={{ position: "absolute", left: 90, top: 330 }}>
      <Block text="¿Cuánto volumen" delay={2} bg={C.blanco} color={C.gris} size={86} />
      <Block text="puedes atender" delay={6} bg={C.blanco} color={C.gris} size={86} />
      <Block text="manteniendo" delay={10} bg={C.blanco} color={C.gris} size={86} />
      <Block text="tu servicio?" delay={14} bg={C.oliva} color={C.blanco} size={86} />
    </div>
  </AbsoluteFill>
);

const Ajustes: React.FC = () => (
  <AbsoluteFill>
    <Clip src="i-cocina" len={96} from={1.12} to={1.0} />
    <Logo />
    <div style={{ position: "absolute", left: 90, top: 600 }}>
      <Block text="¿Qué ajustes" delay={2} bg={C.blanco} color={C.gris} size={96} />
      <Block text="necesitas" delay={6} bg={C.blanco} color={C.gris} size={96} />
      <Block text="para crecer?" delay={10} bg={C.naranja} color={C.blanco} size={96} />
    </div>
  </AbsoluteFill>
);

const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const wipeIn = ease(f, 0, 10);
  const wipeOut = ease(f, 10, 14);
  const logo = ease(f, 16, 22);
  const rule = ease(f, 30, 20);
  const web = ease(f, 38, 18);
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <div style={{ position: "absolute", left: "50%", top: 450, transform: `translate(-50%, -50%) scale(${0.92 + logo * 0.08})`, opacity: logo }}>
        <Img src={A("marca/logo-umami-blanco.png")} style={{ width: 700 }} />
      </div>
      <div style={{ position: "absolute", left: (H_W - 320) / 2, top: 660, width: 320 * rule, height: 5, background: C.naranja, borderRadius: 3 }} />
      <div
        style={{
          position: "absolute",
          top: 700,
          width: H_W,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 42,
          letterSpacing: "0.02em",
          color: C.blanco,
          opacity: web,
          transform: `translateY(${(1 - web) * 16}px)`,
        }}
      >
        www.umami-projects.com
      </div>
      <AbsoluteFill style={{ background: C.naranja, transform: `translateY(${(1 - wipeIn) * 100 - wipeOut * 100}%)` }} />
    </AbsoluteFill>
  );
};

const S: React.FC<{ r: readonly [number, number]; children: React.ReactNode }> = ({ r, children }) => (
  <Sequence from={r[0]} durationInFrames={r[1] - r[0]}>
    {children}
  </Sequence>
);

export const CapacidadH: React.FC = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 6, CAP_DURATION - 40, CAP_DURATION], [0, 0.9, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <Audio src={A("musica/2-product-launch.mp3")} volume={vol} />
      <S r={T.intro}><Intro /></S>
      <S r={T.atender}><Atender /></S>
      <S r={T.mesas}><Mesas /></S>
      <S r={T.resto}><Resto /></S>
      {STAGES.map((_, i) => (
        <Sequence key={i} from={T.etapas[0] + i * 36} durationInFrames={36}>
          <Etapa i={i} />
        </Sequence>
      ))}
      <S r={T.satura}><Satura /></S>
      <S r={T.volumen}><Volumen /></S>
      <S r={T.ajustes}><Ajustes /></S>
      <S r={T.cierre}><Cierre /></S>
    </AbsoluteFill>
  );
};
