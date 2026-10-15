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

/** Paleta de referencia (nombres de moda), en orden de neutros → cálidos → verdes → azules → morados → rosas. */
export const PALETA_REFERENCIA: ReadonlyArray<{ nombre: string; hex: string }> = NOMBRES.map(([nombre, hex]) => ({ nombre, hex }));

/** Nombre y color de un formulario de color. */
export interface ColorForm {
  nombre: string;
  hex: string;
}

/**
 * Resultado de usar un color tomado de la foto: el color elegido SIEMPRE se queda, y el nombre
 * sugerido solo se pone si no habían escrito uno. Se resuelve en una sola actualización: aplicar
 * color y nombre por separado sobre una copia vieja del formulario hacía que el segundo cambio
 * borrara el primero (el color volvía al de arranque).
 */
export function aplicarColorDeFoto(actual: ColorForm, hex: string, nombreSugerido: string): ColorForm {
  return { nombre: actual.nombre.trim() ? actual.nombre : nombreSugerido, hex };
}

const REFERENCIAS = NOMBRES.map(([nombre, hex]) => ({ nombre, lab: aLab(hexARgb(hex)) }));

const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

/**
 * Tono de referencia para un nombre conocido ("Marfil" → un marfil), o null si no se reconoce.
 * Sirve para no dejar un color sin tono: lo que se escribe como nombre y no se elige a mano
 * arranca con un tono que sí se parece.
 */
export function hexDeNombre(nombre: string): string | null {
  const buscado = sinAcentos(nombre);
  if (!buscado) return null;
  const ref = NOMBRES.find(([n]) => sinAcentos(n) === buscado);
  return ref ? ref[1] : null;
}

/** CIE Lab → sRGB (D65), recortado al rango válido. */
function deLab([L, a, b]: Lab): Rgb {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = inv(fx) * 0.95047;
  const y = inv(fy);
  const z = inv(fz) * 1.08883;
  const lineal: Rgb = [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z,
  ];
  const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  return lineal.map((v) => Math.round(Math.min(Math.max(gamma(Math.max(v, 0)), 0), 1) * 255)) as Rgb;
}

const aHexRgb = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

/**
 * Corrige un color tomado de una foto. Una tela marfil fotografiada con luz fría sale azulada: con
 * `calidez` positiva se lleva hacia amarillo/rojo (y negativa hacia azul); `claridad` aclara u
 * oscurece. Rangos útiles: calidez −50…50, claridad −30…30. Con 0 y 0 devuelve el mismo color.
 */
export function ajustarColor(hex: string, calidez: number, claridad: number): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  if (calidez === 0 && claridad === 0) return hex.toUpperCase();
  const [L, a, b] = aLab(hexARgb(hex));
  return aHexRgb(deLab([Math.min(Math.max(L + claridad, 0), 100), a + calidez * 0.15, b + calidez * 0.6]));
}

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
