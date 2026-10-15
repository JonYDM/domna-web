/**
 * Conversión entre "#RRGGBB" y HSV (tono 0–360, saturación y brillo 0–1), que es el modelo con el
 * que funciona un selector de color de cuadro + barra de tono. Puras para poder probarlas.
 */

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const limitar = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export function hsvAHex({ h, s, v }: Hsv): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = limitar(s, 0, 1);
  const vv = limitar(v, 0, 1);
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  const [r, g, b] =
    hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  const canal = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${canal(r)}${canal(g)}${canal(b)}`.toUpperCase();
}

/** null si no es un "#RRGGBB" válido. En grises (s = 0) el tono se devuelve en 0. */
export function hexAHsv(hex: string): Hsv | null {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
