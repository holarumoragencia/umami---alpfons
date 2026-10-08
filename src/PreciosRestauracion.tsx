import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { COLORS, DURATION, FONT, MONO, SCENES } from "./theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// 0 → 1 con easing suave entre `start` y `start + dur`
const ease = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const VIDEO_TOP = 600;
const PAD_X = 120;
const SCALE_MAX = 7; // % — escala común a todas las barras

/* ───────────────────────── Piezas reutilizables ───────────────────────── */

// Titular que entra palabra a palabra desde una máscara
const WordReveal: React.FC<{
  lines: { text: string; color?: string }[];
  delay?: number;
  size: number;
  weight?: number;
}> = ({ lines, delay = 0, size, weight = 600 }) => {
  const frame = useCurrentFrame();
  let i = 0;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.08,
        letterSpacing: "-0.025em",
        color: COLORS.ink,
      }}
    >
      {lines.map((line, li) => (
        <div key={li}>
          {line.text.split(" ").map((word, wi) => {
            const p = ease(frame, delay + i++ * 3, 22);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  verticalAlign: "top",
                  paddingBottom: "0.08em",
                  marginRight: "0.24em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 105}%)`,
                    color: line.color ?? COLORS.ink,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const FadeUp: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, 20);
  return (
    <div
      style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)`, ...style }}
    >
      {children}
    </div>
  );
};

// Envoltorio de escena: salida con fade + desplazamiento
const Scene: React.FC<{ length: number; children: React.ReactNode }> = ({
  length,
  children,
}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [length - 12, length], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        transform: `translateY(${-out * 30}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const LeftCol: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: PAD_X,
      top: 168,
      width: 860,
    }}
  >
    {children}
  </div>
);

const RightCol: React.FC<{ children: React.ReactNode; top?: number }> = ({
  children,
  top = 168,
}) => (
  <div style={{ position: "absolute", left: 1060, top, width: 740 }}>
    {children}
  </div>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 30,
      fontWeight: 400,
      color: COLORS.muted,
      marginTop: 26,
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </div>
);

const fmt = (n: number) => n.toFixed(1).replace(".", ",");

// Filas de barras horizontales con línea de referencia de la media (3,1%)
const BarRows: React.FC<{
  rows: { label: string; value: number }[];
  delay: number;
  ranked?: boolean;
  rowHeight: number;
}> = ({ rows, delay, ranked, rowHeight }) => {
  const frame = useCurrentFrame();
  const labelW = ranked ? 300 : 280;
  const trackW = 330;
  const mediaX = labelW + (3.1 / SCALE_MAX) * trackW;
  const mediaP = ease(frame, delay + 4, 24);
  return (
    <div style={{ position: "relative", fontFamily: FONT, paddingTop: 44 }}>
      {/* Línea de la media del sector */}
      <div
        style={{
          position: "absolute",
          left: mediaX,
          top: 40,
          height: (rows.length * rowHeight + 8) * mediaP,
          borderLeft: `2px dashed ${COLORS.ink}`,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: mediaX - 8,
          top: 0,
          fontFamily: MONO,
          fontSize: 17,
          letterSpacing: "0.08em",
          color: COLORS.muted,
          opacity: mediaP,
          whiteSpace: "nowrap",
        }}
      >
        MEDIA SECTOR 3,1%
      </div>

      {rows.map((r, i) => {
        const p = ease(frame, delay + 6 + i * 6, 30);
        const w = (r.value / SCALE_MAX) * trackW * p;
        return (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              height: rowHeight,
              opacity: ease(frame, delay + i * 6, 14),
            }}
          >
            <div
              style={{
                width: labelW,
                display: "flex",
                alignItems: "baseline",
                gap: 16,
                fontSize: ranked ? 32 : 36,
                fontWeight: 500,
                color: COLORS.ink,
                letterSpacing: "-0.015em",
              }}
            >
              {ranked ? (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 18,
                    color: COLORS.brand,
                    width: 30,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ) : null}
              {r.label}
            </div>
            <div
              style={{
                height: ranked ? 16 : 22,
                width: w,
                background: COLORS.brand,
                borderRadius: "0 4px 4px 0",
              }}
            />
            <div
              style={{
                marginLeft: 18,
                fontSize: ranked ? 32 : 36,
                fontWeight: 700,
                color: COLORS.ink,
                fontVariantNumeric: "tabular-nums",
                opacity: p,
              }}
            >
              {ranked ? "" : "+"}
              {fmt(r.value * Math.min(1, p * 1.05))}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────────── Escenas ───────────────────────────── */

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const count = ease(frame, 14, 50);
  const len = SCENES.intro.to - SCENES.intro.from;
  return (
    <Scene length={len}>
      <LeftCol>
        <WordReveal
          size={76}
          delay={6}
          lines={[
            { text: "La subida de precios" },
            { text: "en restauración" },
            { text: "se modera", color: COLORS.brand },
          ]}
        />
      </LeftCol>
      <RightCol top={150}>
        <FadeUp delay={10}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 210,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: COLORS.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmt(3.1 * count)}%
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 20,
              letterSpacing: "0.14em",
              color: COLORS.muted,
              marginTop: 18,
            }}
          >
            SUBIDA INTERANUAL · JULIO
          </div>
        </FadeUp>
        <FadeUp delay={44} style={{ marginTop: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              background: COLORS.brandSoft,
              color: COLORS.ink,
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 500,
              padding: "14px 24px",
              borderRadius: 999,
            }}
          >
            <span style={{ color: COLORS.brand, fontSize: 24 }}>▼</span>
            <span>
              <b style={{ fontWeight: 700 }}>0,5 pts</b> menos que hace un año
            </span>
          </div>
        </FadeUp>
      </RightCol>
    </Scene>
  );
};

const Categorias: React.FC = () => (
  <Scene length={SCENES.categorias.to - SCENES.categorias.from}>
    <LeftCol>
      <WordReveal
        size={76}
        delay={4}
        lines={[{ text: "Pero no todo" }, { text: "sube igual", color: COLORS.brand }]}
      />
      <FadeUp delay={18}>
        <Sub>Lo que más se ha encarecido en 12 meses</Sub>
      </FadeUp>
    </LeftCol>
    <RightCol top={150}>
      <BarRows
        delay={12}
        rowHeight={92}
        rows={[
          { label: "Café", value: 5.9 },
          { label: "Pizza", value: 5.5 },
          { label: "Hamburguesas", value: 5.4 },
        ]}
      />
    </RightCol>
  </Scene>
);

const Comunidades: React.FC = () => (
  <Scene length={SCENES.comunidades.to - SCENES.comunidades.from}>
    <LeftCol>
      <WordReveal
        size={76}
        delay={4}
        lines={[{ text: "¿Dónde más" }, { text: "suben?", color: COLORS.brand }]}
      />
      <FadeUp delay={16}>
        <Sub>Las comunidades que lideran el ranking</Sub>
      </FadeUp>
    </LeftCol>
    <RightCol top={140}>
      <BarRows
        ranked
        delay={10}
        rowHeight={74}
        rows={[
          { label: "País Vasco", value: 4.9 },
          { label: "Madrid", value: 4.4 },
          { label: "Baleares", value: 4.0 },
          { label: "Galicia", value: 4.0 },
        ]}
      />
    </RightCol>
  </Scene>
);

const Conclusion: React.FC = () => (
  <Scene length={SCENES.conclusion.to - SCENES.conclusion.from + 30}>
    <div style={{ position: "absolute", left: PAD_X, top: 190 }}>
      <WordReveal
        size={92}
        delay={4}
        lines={[
          { text: "Menos subida en bloque." },
          { text: "Más precio selectivo.", color: COLORS.brand },
        ]}
      />
    </div>
  </Scene>
);

/* ───────────────────────── Marco persistente ───────────────────────── */

const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = ease(frame, 0, 20);
  const scenes = [SCENES.intro, SCENES.categorias, SCENES.comunidades, SCENES.conclusion];
  return (
    <>
      {/* Etiqueta superior, como el "JUST ANNOUNCED" de la referencia */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          top: 78,
          display: "flex",
          alignItems: "center",
          gap: 22,
          opacity: p,
          fontFamily: MONO,
          fontSize: 19,
          letterSpacing: "0.2em",
          color: COLORS.ink,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 99,
            background: COLORS.brand,
          }}
        />
        RESTAURACIÓN · PRECIOS DE VERANO
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          {scenes.map((s, i) => {
            const fill = interpolate(frame, [s.from, s.to], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 3,
                  borderRadius: 2,
                  background: COLORS.rule,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${fill * 100}%`,
                    height: "100%",
                    background: COLORS.brand,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Marca personal, sutil, donde iría el logo */}
      <div
        style={{
          position: "absolute",
          right: PAD_X,
          top: 58,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: p * 0.92,
          fontFamily: FONT,
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: "-0.01em",
            }}
          >
            Alfonso Mas
          </div>
          <div style={{ fontSize: 15, color: COLORS.muted, marginTop: 3 }}>
            Hospitality Strategy, Operations & Talent Consultant
          </div>
        </div>
        <Img
          src={staticFile("alfonso.jpg")}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: `0 0 0 2px ${COLORS.bg}, 0 0 0 3.5px ${COLORS.brand}`,
          }}
        />
      </div>
    </>
  );
};

const VideoBand: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = ease(frame, 4, 30);
  const zoom = interpolate(frame, [0, DURATION], [1.04, 1.14]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: VIDEO_TOP,
        bottom: 0,
        overflow: "hidden",
        clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`,
      }}
    >
      <OffthreadVideo
        src={staticFile("cafe.mp4")}
        muted
        playbackRate={0.68}
        style={{
          position: "absolute",
          width: "100%",
          top: "50%",
          transform: `translateY(-52%) scale(${zoom})`,
        }}
      />
      {/* Fundido a blanco hacia el bloque de texto */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${COLORS.bg} 0%, rgba(255,255,255,0.55) 14%, rgba(255,255,255,0) 34%)`,
        }}
      />
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const wipe = ease(frame, 0, 20);
  const p = ease(frame, 10, 24);
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        clipPath: `inset(${(1 - wipe) * 100}% 0 0 0)`,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: p,
          transform: `translateY(${(1 - p) * 24}px)`,
        }}
      >
        <Img
          src={staticFile("alfonso.jpg")}
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: `0 0 0 4px ${COLORS.bg}, 0 0 0 6px ${COLORS.brand}`,
          }}
        />
        <div
          style={{
            marginTop: 34,
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: COLORS.ink,
          }}
        >
          Alfonso Mas
        </div>
        <div
          style={{
            width: 48 * ease(frame, 18, 20),
            height: 3,
            background: COLORS.brand,
            borderRadius: 2,
            margin: "20px 0",
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 20,
            letterSpacing: "0.14em",
            color: COLORS.muted,
          }}
        >
          HOSPITALITY STRATEGY, OPERATIONS & TALENT CONSULTANT
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── Composición ───────────────────────────── */

export const PreciosRestauracion: React.FC = () => {
  const seq = (s: { from: number; to: number }) => ({
    from: s.from,
    durationInFrames: s.to - s.from,
  });
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <VideoBand />
      <Sequence {...seq(SCENES.intro)}>
        <Intro />
      </Sequence>
      <Sequence {...seq(SCENES.categorias)}>
        <Categorias />
      </Sequence>
      <Sequence {...seq(SCENES.comunidades)}>
        <Comunidades />
      </Sequence>
      <Sequence from={SCENES.conclusion.from}>
        <Conclusion />
      </Sequence>
      <TopBar />
      <Sequence {...seq(SCENES.cierre)}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
