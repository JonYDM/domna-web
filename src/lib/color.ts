/** Utilidades de color para las ilustraciones de prenda (no para la UI: la UI usa tokens). */

function aRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function aHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
}

/** Mezcla el color con crema (#FBF7F4). `t` = proporción de crema (0–1). */
export function tintar(hex: string, t: number): string {
  const [r, g, b] = aRgb(hex);
  const c: [number, number, number] = [251, 247, 244];
  return aHex([r + (c[0] - r) * t, g + (c[1] - g) * t, b + (c[2] - b) * t]);
}

/** Luminancia relativa (0 = negro, 1 = blanco). */
export function luminancia(hex: string): number {
  const [r, g, b] = aRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function esClaro(hex: string): boolean {
  return luminancia(hex) > 0.6;
}
