
export const FPS = 30;
export const DURATION = 15 * FPS;

export const COLORS = {
  bg: "#ffffff",
  ink: "#2a2a2a",
  muted: "#6b6b6b",
  rule: "#e6e6e3",
  brand: "#75864A",
  brandSoft: "#eef1e6",
};

// Arial; Liberation Sans es métricamente idéntica (respaldo en Linux)
export const FONT = "Arial, 'Liberation Sans', Helvetica, sans-serif";

// Bloques de la animación (en frames)
export const SCENES = {
  intro: { from: 0, to: 112 },
  categorias: { from: 112, to: 222 },
  comunidades: { from: 222, to: 322 },
  conclusion: { from: 322, to: 398 },
  cierre: { from: 392, to: DURATION },
};
