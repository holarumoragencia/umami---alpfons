# Video LinkedIn · Precios en restauración (Alfonso Mas)

Animación de 15 s en formato horizontal (1920×1080, 30 fps) hecha con [Remotion](https://github.com/remotion-dev/remotion)
para acompañar un post de LinkedIn de Alfonso Mas.

## Estructura del video

| Tiempo | Escena |
|---|---|
| 0–3,7 s | "La subida de precios en restauración se modera" + contador **3,1%** + "0,5 pts menos que hace un año" |
| 3,7–7,4 s | "Pero no todo sube igual": Café +5,9% · Pizza +5,5% · Hamburguesas +5,4% vs. media 3,1% |
| 7,4–10,7 s | "¿Dónde más suben?": País Vasco 4,9% · Madrid 4,4% · Baleares 4,0% · Galicia 4,0% |
| 10,7–13 s | Conclusión: "Menos subida en bloque. Más precio selectivo." |
| 13–15 s | Cierre con foto, nombre y cargo |

Marca personal sutil arriba a la derecha durante todo el video. Video de café en la franja inferior, con corte limpio (sin difuminado).
Tipografía: Arial. Colores: fondo `#ffffff`, texto `#2a2a2a`, acento `#75864A`.

## Uso

```bash
npm install
npm run dev      # Remotion Studio para previsualizar y ajustar
npm run render   # genera out/precios-restauracion.mp4
```

- Textos, datos y tiempos: `src/PreciosRestauracion.tsx` y `src/theme.ts` (`SCENES`).
- Assets: `public/cafe.mp4` (clip reescalado a 1080p) y `public/alfonso.jpg` (avatar recortado).
- Si Remotion no puede descargar su Chromium, pasá uno local con `--browser-executable=<ruta>`.
