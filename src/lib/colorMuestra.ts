/**
 * Utilidades puras para elegir el color de una prenda a partir de su foto:
 *  - promedioColor: promedia los píxeles alrededor de un punto (un solo píxel es ruidoso).
 *  - nombreDeHex: sugiere un nombre en español ("Verde pistache") por cercanía perceptual (CIE Lab).
 */

/** Promedio RGB (como "#RRGGBB") de un cuadrado de (2·radio+1)² píxeles. Ignora los casi transparentes. */
export function promedioColor(
  datos: Uint8ClampedArray,
  ancho: number,
  alto: number,
  cx: number,
  cy: number,
  radio = 3,
): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  // Un toque fuera de la imagen (o en la orilla) se recorta al borde en lugar de quedar vacío.
  const px = Math.min(Math.max(Math.floor(cx), 0), ancho - 1);
  const py = Math.min(Math.max(Math.floor(cy), 0), alto - 1);
  const x0 = Math.max(0, px - radio);
  const x1 = Math.min(ancho - 1, px + radio);
  const y0 = Math.max(0, py - radio);
  const y1 = Math.min(alto - 1, py + radio);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * ancho + x) * 4;
      if (datos[i + 3] < 128) continue; // transparente (prenda recortada): no es color de la prenda
      r += datos[i];
      g += datos[i + 1];
      b += datos[i + 2];
      n++;
    }
  }
  if (n === 0) return null;
  const aHex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${aHex(r)}${aHex(g)}${aHex(b)}`.toUpperCase();
}

type Rgb = [number, number, number];
type Lab = [number, number, number];

function hexARgb(hex: string): Rgb {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** sRGB → CIE Lab (D65). */
function aLab([r, g, b]: Rgb): Lab {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Nombres de moda comunes en español, con un tono de referencia cada uno. */
const NOMBRES: ReadonlyArray<readonly [string, string]> = [
  ["Negro", "#1A1A1A"],
  ["Gris oscuro", "#4A4A4A"],
  ["Gris", "#8E8E8E"],
  ["Gris claro", "#CFCFCF"],
  ["Plata", "#BFC3C7"],
  ["Blanco", "#FFFFFF"],
  ["Marfil", "#F5F0E1"],
  ["Crema", "#EBDDC3"],
  ["Beige", "#D9C3A5"],
  ["Arena", "#C8AD8D"],
  ["Camel", "#B98A5B"],
  ["Café", "#6F4E37"],
  ["Chocolate", "#3E2723"],
  ["Rojo", "#D32F2F"],
  ["Vino", "#7B1E3A"],
  ["Coral", "#FF7F6B"],
  ["Salmón", "#F4A38C"],
  ["Naranja", "#F28C28"],
  ["Mostaza", "#D9A521"],
  ["Dorado", "#C9A24A"],
  ["Amarillo", "#F6D743"],
  ["Verde pistache", "#B9C98F"],
  ["Verde menta", "#A8DCC4"],
  ["Verde oliva", "#7C8A3B"],
  ["Verde militar", "#4B5320"],
  ["Verde esmeralda", "#1E8F5C"],
  ["Verde bosque", "#1F4D2E"],
  ["Verde", "#2E9E44"],
  ["Turquesa", "#2BB5B0"],
  ["Azul cielo", "#8EC5E8"],
  ["Azul mezclilla", "#5B7DA8"],
  ["Azul rey", "#2F5FD0"],
  ["Azul marino", "#1B2A4A"],
  ["Lila", "#C8A2D8"],
  ["Lavanda", "#B8A9D9"],
  ["Morado", "#6A3FA0"],
  ["Rosa pastel", "#F8C8D8"],
  ["Rosa palo", "#D9A3A3"],
  ["Rosa", "#F06292"],
  ["Fucsia", "#D81B7A"],
];

const REFERENCIAS = NOMBRES.map(([nombre, hex]) => ({ nombre, lab: aLab(hexARgb(hex)) }));

/** Nombre sugerido para un "#RRGGBB": el de referencia más cercano en Lab. */
export function nombreDeHex(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "";
  const lab = aLab(hexARgb(hex));
  let mejor = REFERENCIAS[0];
  let mejorD = Infinity;
  for (const ref of REFERENCIAS) {
    const d = (lab[0] - ref.lab[0]) ** 2 + (lab[1] - ref.lab[1]) ** 2 + (lab[2] - ref.lab[2]) ** 2;
    if (d < mejorD) {
      mejorD = d;
      mejor = ref;
    }
  }
  return mejor.nombre;
}
