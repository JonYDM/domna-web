import type { FamiliaColor } from "@/types/api";

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

/**
 * Grupo del color para el filtro de la tienda, a partir del tono (HSL). Así un "Azul marino" cae
 * en Azul y un "Marfil" en Blanco, sin que la dueña tenga que clasificarlos. Espera "#RRGGBB".
 */
export function familiaDeHex(hex: string): FamiliaColor {
  const [r, g, b] = aRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const croma = max - min;
  if (l < 0.18) return "negro";
  if (l > 0.86) return "blanco";
  if (croma < 0.12) return l > 0.75 ? "blanco" : "gris";
  let h = 0;
  if (max === r) h = ((g - b) / croma) % 6;
  else if (max === g) h = (b - r) / croma + 2;
  else h = (r - g) / croma + 4;
  h = (h * 60 + 360) % 360;
  if (h >= 345 || h < 15) return l > 0.68 ? "rosa" : "rojo";
  if (h < 50) return l < 0.6 ? "cafe" : "beige";
  if (h < 62) return "beige";
  if (h < 170) return "verde";
  if (h < 260) return "azul";
  return l > 0.55 ? "rosa" : "rojo"; // morados y fucsias
}
