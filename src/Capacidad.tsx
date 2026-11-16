import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/* ───────────── Sistema de marca Umami (presentación visual) ───────────── */

export const CAP_FPS = 30;
export const CAP_W = 1080;
export const CAP_H = 1350;

const C = {
  naranja: "#F99F1A",
  gris: "#2A2A2A",
  blanco: "#FFFFFF",
  oliva: "#75864A",
  arena: "#E9DFC9",
  linea: "#4a4a4a",
};
const FONT = "Manrope, Arial, sans-serif";
const A = (p: string) => staticFile(`capacidad/${p}`);

// Manrope local (sin depender de Google Fonts en el render)
if (typeof window !== "undefined" && "FontFace" in window) {
  const handle = delayRender("Cargando Manrope");
  Promise.all(
    [300, 500, 700, 800].map((w) => {
      const f = new FontFace(
        "Manrope",
        `url(${A(`fonts/manrope-latin-${w}-normal.woff2`)}) format('woff2')`,
        { weight: String(w) },
      );
      return f.load().then((ff) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff));
    }),
  )
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}

/* ───────────── Línea de tiempo (frames a 30 fps; música a 150 BPM = 12 f/pulso) ───────────── */

const T = {
  intro: [0, 84], // Si mañana vendieras un 20 % más…
  atender: [84, 144], // …¿podrías atenderlo bien?
  mesas: [144, 228], // Mesas libres hay.
  resto: [228, 288], // ¿Y el resto de la operación?
  etapas: [288, 468], // 5 × 36 f
  satura: [468, 684], // primer punto que se satura + no siempre es la sala
  volumen: [684, 780],
  ajustes: [780, 876],
  cierre: [876, 1008],
} as const;
export const CAP_DURATION = 1008;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const ease = (f: number, start: number, dur: number) =>
  interpolate(f, [start, start + dur], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const STAGES = ["Producción", "Pase", "Sala", "Lavado", "Cobro"];

/* ───────────── Piezas ───────────── */

// Clip a sangre con leve zoom (punch-in)
const Clip: React.FC<{
  src: string;
  from?: number;
  to?: number;
  len: number;
}> = ({ src, from = 1.1, to = 1.0, len }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, len], [from, to], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.gris }}>
      <OffthreadVideo
        src={A(`clips/${src}.mp4`)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${s})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Bloque de color con texto, que entra con barrido (estilo Amazon)
const Block: React.FC<{
  text: string;
  delay: number;
  bg: string;
  color: string;
  size?: number;
  weight?: number;
}> = ({ text, delay, bg, color, size = 78, weight = 800 }) => {
  const f = useCurrentFrame();
  const p = ease(f, delay, 14);
  const t = ease(f, delay + 4, 14);
  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          background: bg,
          padding: `${size * 0.12}px ${size * 0.28}px ${size * 0.16}px`,
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: weight,
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color,
            whiteSpace: "nowrap",
            transform: `translateY(${(1 - t) * 60}%)`,
            opacity: t,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// Texto que sube desde una máscara, por línea
const Line: React.FC<{
  text: string;
  delay: number;
  size: number;
  weight: number;
  color?: string;
}> = ({ text, delay, size, weight, color = C.blanco }) => {
  const f = useCurrentFrame();
  const p = ease(f, delay, 18);
  return (
    <div style={{ overflow: "hidden", paddingBottom: size * 0.1 }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          fontWeight: weight,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          color,
          transform: `translateY(${(1 - p) * 110}%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Logo: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <Img
    src={A(dark ? "marca/logo-umami.png" : "marca/logo-umami-blanco.png")}
    style={{ position: "absolute", left: 64, top: 56, width: 150 }}
  />
);

// Salida rápida de escena
const Out: React.FC<{ len: number; children: React.ReactNode }> = ({
  len,
  children,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [len - 6, len], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/* ───────────── Esquema de la operación ───────────── */

const PX0 = 140;
const PSTEP = 200;
const nodeX = (i: number) => PX0 + i * PSTEP;

type NodeState = "off" | "ok" | "hot";

const Pipeline: React.FC<{
  y: number;
  draw: number; // 0–1
  states: NodeState[];
  indicator?: number | null; // posición 0–4
  pulse?: number; // 0–1, para el nodo caliente
  labelSize?: number;
}> = ({ y, draw, states, indicator = null, pulse = 0, labelSize = 30 }) => {
  const lineEnd = PX0 + (nodeX(4) - PX0) * draw;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: CAP_W, height: CAP_H }}>
      <svg width={CAP_W} height={CAP_H} style={{ position: "absolute" }}>
        <line x1={PX0} y1={y} x2={nodeX(4)} y2={y} stroke={C.linea} strokeWidth={6} strokeLinecap="round" opacity={draw > 0 ? 1 : 0} strokeDasharray={`${lineEnd - PX0} 2000`} />
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
                  return (
                    <circle key={off} cx={nodeX(i)} cy={y} r={30 + ph * 60} fill="none" stroke={C.naranja} strokeWidth={4} opacity={(1 - ph) * 0.8} />
                  );
                })}
              <circle cx={nodeX(i)} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={5} />
            </g>
          );
        })}
        {indicator !== null && (
          <circle cx={nodeX(0) + indicator * PSTEP} cy={y} r={13} fill={C.blanco} />
        )}
      </svg>
      {STAGES.map((s, i) => {
        const appear = interpolate(draw * 4, [i - 0.4, i], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const st = states[i];
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: nodeX(i) - 100,
              width: 200,
              top: y + 52,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: labelSize,
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
    </div>
  );
};

/* ───────────── Escenas ───────────── */

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [8, 44], [0, 20], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const big = ease(f, 6, 16);
  const win = ease(f, 22, 20);
  const mas = ease(f, 40, 14);
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <Logo />
      <div style={{ position: "absolute", left: 72, top: 170 }}>
        <Line text="Si mañana" delay={0} size={66} weight={300} />
        <Line text="vendieras un" delay={4} size={66} weight={300} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: -10 }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 230,
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
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 76,
              color: C.blanco,
              opacity: mas,
              transform: `translateX(${(1 - mas) * -20}px)`,
            }}
          >
            más…
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 690,
          width: 960,
          height: 610,
          borderRadius: 28,
          overflow: "hidden",
          clipPath: `inset(${(1 - win) * 100}% 0 0 0 round 28px)`,
        }}
      >
        <Sequence from={22} layout="none">
          <Clip src="a-clientes" len={62} from={1.15} to={1.03} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

const Atender: React.FC = () => (
  <AbsoluteFill>
    <Clip src="b-barra" len={60} from={1.12} to={1.0} />
    <Logo />
    <div style={{ position: "absolute", left: 56, top: 900, display: "flex", flexDirection: "column", gap: 0 }}>
      <Block text="¿podrías" delay={2} bg={C.naranja} color={C.blanco} size={92} />
      <Block text="atenderlo bien?" delay={7} bg={C.blanco} color={C.gris} size={92} />
    </div>
  </AbsoluteFill>
);

const Mesas: React.FC = () => {
  const f = useCurrentFrame();
  const panel = ease(f, 0, 14);
  const tables = 14;
  const empty = [5, 11]; // quedan mesas libres
  return (
    <AbsoluteFill style={{ background: C.arena }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: CAP_W, height: 820, overflow: "hidden" }}>
        <Clip src="c-sala-vacia" len={84} from={1.0} to={1.08} />
      </div>
      <Logo />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 820,
          width: CAP_W,
          height: 530,
          background: C.arena,
          transform: `translateY(${(1 - panel) * 530}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 72, top: 54 }}>
          <Line text="Mesas libres hay." delay={6} size={88} weight={800} color={C.gris} />
        </div>
        <div style={{ position: "absolute", left: 72, top: 230, width: 936, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 36, columnGap: 36 }}>
          {Array.from({ length: tables }).map((_, i) => {
            const on = !empty.includes(i) && f > 26 + i * 3;
            const pop = ease(f, 26 + i * 3, 10);
            const fillT = empty.includes(i) ? 0 : pop;
            return (
              <div
                key={i}
                style={{
                  height: 100,
                  borderRadius: 18,
                  border: `5px solid ${C.oliva}`,
                  background: on ? C.oliva : "transparent",
                  transform: `scale(${on ? 0.9 + fillT * 0.1 : 1})`,
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
      <div style={{ position: "absolute", left: 72, top: 300 }}>
        <Line text="¿Y el resto de" delay={0} size={84} weight={300} />
        <Line text="la operación?" delay={5} size={84} weight={800} />
      </div>
      <Pipeline y={860} draw={ease(f, 14, 36)} states={["off", "off", "off", "off", "off"]} />
    </AbsoluteFill>
  );
};

const STAGE_CLIPS = ["e1-produccion", "e2-pase", "e3-sala", "e4-lavado", "e5-cobro"];

const Etapa: React.FC<{ i: number }> = ({ i }) => {
  return (
    <AbsoluteFill>
      <Clip src={STAGE_CLIPS[i]} len={36} from={1.14} to={1.02} />
      <Logo />
      {/* progreso: 5 segmentos arriba a la derecha */}
      <div style={{ position: "absolute", right: 64, top: 74, display: "flex", gap: 8 }}>
        {STAGES.map((_, k) => (
          <div key={k} style={{ width: 46, height: 8, borderRadius: 4, background: k <= i ? C.blanco : "rgba(255,255,255,0.35)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 56, top: 1060 }}>
        <Block text={`0${i + 1}`} delay={0} bg={C.oliva} color={C.blanco} size={40} weight={700} />
        <Block text={`${STAGES[i]}.`} delay={2} bg={C.blanco} color={C.gris} size={112} />
      </div>
    </AbsoluteFill>
  );
};

const Satura: React.FC = () => {
  const f = useCurrentFrame();
  // Parte 1 (0–132): indicador recorre hasta Sala y la satura
  // Parte 2 (132–216): «Y no siempre es la sala» → salta a Lavado
  const travel = interpolate(f, [24, 70], [0, 2], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const jump = ease(f, 150, 16); // salto del punto naranja
  const hotLavado = f >= 162;
  const states: NodeState[] = STAGES.map((_, i) => {
    if (f < 150) {
      if (i === 2 && f >= 70) return "hot";
      return i < 2 && travel >= i ? "ok" : "off";
    }
    if (i <= 2) return "ok";
    return i === 3 && hotLavado ? "hot" : "off";
  });
  const pulse = ((f % 24) / 24);
  const shake = f >= 162 && f < 174 ? Math.sin(f * 2.4) * (174 - f) * 1.2 : 0;
  const text1Out = interpolate(f, [126, 134], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = 900;
  // arco del punto naranja de Sala → Lavado
  const jx = nodeX(2) + jump * PSTEP;
  const jy = y - Math.sin(jump * Math.PI) * 140;
  return (
    <AbsoluteFill style={{ background: C.gris }}>
      <Logo />
      <div style={{ position: "absolute", left: 72, top: 230, opacity: text1Out }}>
        <Line text="La capacidad real" delay={0} size={74} weight={300} />
        <Line text="la marca el primer punto" delay={4} size={74} weight={300} />
        <Line text="que se satura." delay={8} size={74} weight={800} color={C.naranja} />
      </div>
      {f >= 132 && (
        <div style={{ position: "absolute", left: 72, top: 260 }}>
          <Sequence from={132} layout="none">
            <Line text="Y no siempre" delay={0} size={96} weight={300} />
            <Line text="es la sala." delay={5} size={96} weight={800} />
          </Sequence>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
        <Pipeline
          y={y}
          draw={1}
          states={states}
          indicator={f < 150 ? travel : null}
          pulse={pulse}
        />
        {f >= 150 && f < 166 && (
          <svg width={CAP_W} height={CAP_H} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={jx} cy={jy} r={26} fill={C.naranja} />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Volumen: React.FC = () => (
  <AbsoluteFill>
    <Clip src="h-chef" len={96} from={1.0} to={1.1} />
    <Logo />
    <div style={{ position: "absolute", left: 56, top: 850 }}>
      <Block text="¿Cuánto volumen" delay={2} bg={C.blanco} color={C.gris} size={70} />
      <Block text="puedes atender" delay={6} bg={C.blanco} color={C.gris} size={70} />
      <Block text="manteniendo" delay={10} bg={C.blanco} color={C.gris} size={70} />
      <Block text="tu servicio?" delay={14} bg={C.oliva} color={C.blanco} size={70} />
    </div>
  </AbsoluteFill>
);

const Ajustes: React.FC = () => (
  <AbsoluteFill>
    <Clip src="i-cocina" len={96} from={1.12} to={1.0} />
    <Logo />
    <div style={{ position: "absolute", left: 56, top: 900 }}>
      <Block text="¿Qué ajustes" delay={2} bg={C.blanco} color={C.gris} size={86} />
      <Block text="necesitas" delay={6} bg={C.blanco} color={C.gris} size={86} />
      <Block text="para crecer?" delay={10} bg={C.naranja} color={C.blanco} size={86} />
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
      <div style={{ position: "absolute", left: "50%", top: 560, transform: `translate(-50%, -50%) scale(${0.92 + logo * 0.08})`, opacity: logo }}>
        <Img src={A("marca/logo-umami-blanco.png")} style={{ width: 640 }} />
      </div>
      <div style={{ position: "absolute", left: (CAP_W - 300) / 2, top: 760, width: 300 * rule, height: 5, background: C.naranja, borderRadius: 3 }} />
      <div
        style={{
          position: "absolute",
          top: 800,
          width: CAP_W,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 38,
          letterSpacing: "0.02em",
          color: C.blanco,
          opacity: web,
          transform: `translateY(${(1 - web) * 16}px)`,
        }}
      >
        www.umami-projects.com
      </div>
      {/* barrido naranja de entrada */}
      <AbsoluteFill
        style={{
          background: C.naranja,
          transform: `translateY(${(1 - wipeIn) * 100 - wipeOut * 100}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ───────────── Composición ───────────── */

const S: React.FC<{ r: readonly [number, number]; out?: boolean; children: React.ReactNode }> = ({ r, out, children }) => (
  <Sequence from={r[0]} durationInFrames={r[1] - r[0]}>
    {out ? <Out len={r[1] - r[0]}>{children}</Out> : children}
  </Sequence>
);

export const Capacidad: React.FC = () => {
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
