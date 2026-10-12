/**
 * Paleta de marca white-label. Cada boutique define UN color (hex) y de él se deriva toda la
 * familia (acento, botón, hover, fondo suave, texto sobre fondo suave, halo), garantizando
 * contraste AA: el acento y el botón se oscurecen lo necesario sobre blanco.
 *
 * Los valores por defecto (rosa de Jesly) están en `src/styles/index.css`; esto solo los
 * sustituye en ejecución escribiendo las variables `--marca*` en <html>.
 */

export interface PaletaMarca {
  marca: string;
  strong: string;
  hover: string;
  soft: string;
  rubor: string;
  onSoft: string;
  orbe: string;
}

type Rgb = [number, number, number];

const aRgb = (hex: string): Rgb => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
};

const aHex = ([r, g, b]: Rgb) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

const luminancia = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Contraste WCAG entre dos colores hex. */
export function contraste(a: string, b: string): number {
  const x = luminancia(aRgb(a));
  const y = luminancia(aRgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function aHsl(hex: string): [number, number, number] {
  const [r, g, b] = aRgb(hex).map((v) => v / 255) as Rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

function deHsl(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return aHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/** Baja la luminosidad hasta alcanzar el contraste pedido contra blanco (con tope inferior). */
function oscurecerHasta(h: number, s: number, l: number, minimo: number): string {
  let luz = l;
  let hex = deHsl(h, s, luz);
  while (contraste(hex, "#FFFFFF") < minimo && luz > 8) {
    luz -= 1;
    hex = deHsl(h, s, luz);
  }
  return hex;
}

/** Deriva la familia completa de colores de marca a partir de un hex (#RRGGBB). */
export function derivarPaleta(hex: string): PaletaMarca {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Color de marca inválido: ${hex}`);
  const [h, sRaw, lRaw] = aHsl(hex);
  // Con saturación muy baja (marca gris) no se inventa un matiz fuerte.
  const s = Math.min(100, Math.max(sRaw, 0));
  return {
    marca: oscurecerHasta(h, s, Math.min(lRaw, 50), 4.5),
    strong: oscurecerHasta(h, s, Math.min(lRaw, 46), 5.5),
    hover: oscurecerHasta(h, s, Math.min(lRaw, 36), 7),
    soft: deHsl(h, Math.min(s, 70), 95),
    rubor: deHsl(h, Math.min(100, s), 85),
    onSoft: oscurecerHasta(h, Math.min(s, 80), 30, 9),
    // El halo conserva el color de marca; solo se oscurece si el texto blanco encima no llega a 3.5
    // (texto grande en bold).
    orbe: oscurecerHasta(h, s, lRaw, 3.5),
  };
}

const canales = (hex: string) => aRgb(hex).join(" ");

/** Escribe la paleta derivada en las variables CSS del documento y en el color de la barra del navegador. */
export function aplicarPaletaMarca(hex: string, raiz: Pick<HTMLElement, "style"> = document.documentElement): PaletaMarca {
  const p = derivarPaleta(hex);
  const estilo = raiz.style;
  estilo.setProperty("--marca", canales(p.marca));
  estilo.setProperty("--marca-strong", canales(p.strong));
  estilo.setProperty("--marca-hover", canales(p.hover));
  estilo.setProperty("--marca-soft", canales(p.soft));
  estilo.setProperty("--marca-rubor", canales(p.rubor));
  estilo.setProperty("--marca-on-soft", canales(p.onSoft));
  estilo.setProperty("--marca-orbe", canales(p.orbe));
  if (typeof document !== "undefined") {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", p.orbe);
  }
  return p;
}
