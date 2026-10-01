// Genera los íconos de la PWA (Domi sobre rojo Domna con lunares sutiles).
// Uso: node scripts/generar-iconos-pwa.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const ROJO = "#E0344B";
const TINTA = "#1F1B24";
const RUBOR = "#FFB8C2";

/** Cabeza de Domi feliz centrada. `escala` < 1 deja margen (maskable: zona segura del 80%). */
function svg(escala = 1, radio = 0) {
  const s = 512;
  const g = `translate(${s / 2} ${s / 2 + 18 * escala}) scale(${escala})`;
  const lunares = [
    [70, 80], [430, 60], [40, 300], [470, 330], [120, 470], [400, 460], [256, 30],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="#fff" opacity="0.10"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${radio}" fill="${ROJO}"/>
  ${lunares}
  <g transform="${g}">
    <path d="M-60 -120 Q-80 -190 -120 -215" stroke="${TINTA}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M60 -120 Q80 -190 120 -215" stroke="${TINTA}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="-122" cy="-218" r="20" fill="${TINTA}"/>
    <circle cx="122" cy="-218" r="20" fill="${TINTA}"/>
    <g transform="translate(92 -170) rotate(-15)">
      <path d="M0 0 L-38 -26 Q-46 0 -38 26 Z" fill="#fff"/>
      <path d="M0 0 L38 -26 Q46 0 38 26 Z" fill="#fff"/>
      <circle r="11" fill="${RUBOR}"/>
    </g>
    <ellipse cx="0" cy="0" rx="170" ry="152" fill="${TINTA}"/>
    <ellipse cx="-58" cy="-12" rx="42" ry="45" fill="#fff"/>
    <ellipse cx="58" cy="-12" rx="42" ry="45" fill="#fff"/>
    <circle cx="-52" cy="-6" r="30" fill="${TINTA}"/>
    <circle cx="64" cy="-6" r="30" fill="${TINTA}"/>
    <circle cx="-40" cy="-24" r="12" fill="#fff"/>
    <circle cx="76" cy="-24" r="12" fill="#fff"/>
    <ellipse cx="-110" cy="58" rx="26" ry="16" fill="${RUBOR}"/>
    <ellipse cx="110" cy="58" rx="26" ry="16" fill="${RUBOR}"/>
    <path d="M-24 58 Q0 82 24 58" stroke="${RUBOR}" stroke-width="10" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
}

mkdirSync("public", { recursive: true });
const salida = [
  ["public/pwa-192x192.png", 192, svg(0.95, 0)],
  ["public/pwa-512x512.png", 512, svg(0.95, 0)],
  ["public/pwa-512x512-maskable.png", 512, svg(0.72, 0)],
  ["public/apple-touch-icon.png", 180, svg(0.85, 0)],
];
for (const [ruta, tam, contenido] of salida) {
  await sharp(Buffer.from(contenido)).resize(tam, tam).png({ compressionLevel: 9 }).toFile(ruta);
  console.log("✓", ruta);
}
