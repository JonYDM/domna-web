/**
 * Procesamiento de imágenes de producto EN EL CLIENTE (navegador), antes de subir a R2.
 *
 * Al adjuntar una foto:
 *  - se redimensiona a 3 tamaños (400 / 800 / 1600 px) y se exporta a WebP (ligero);
 *  - se extrae el COLOR DOMINANTE de la prenda (cuantización simple sobre el canvas);
 *  - se genera un FONDO DEGRADADO (CSS) a partir de ese tono, con contraste, para el catálogo.
 *
 * No sube nada: eso es la Fase 2 (presigned URL a R2). Aquí todo vive en memoria del navegador.
 */

/** Tamaños que guardaremos en R2 (como en docs/PLANEACION: 400/800/1600). */
export const TAMANOS_IMAGEN = [400, 800, 1600] as const;
export type TamanoImagen = (typeof TAMANOS_IMAGEN)[number];

export interface ImagenProcesada {
  /** WebP por tamaño (ancho en px → blob). Listos para subir a R2. */
  webp: Record<TamanoImagen, Blob>;
  /** Vista previa lista para <img src> (WebP 800 como dataURL). */
  preview: string;
  /** Color dominante de la prenda, "#RRGGBB". */
  colorDominante: string;
  /** Fondo degradado CSS (listo para `style={{ background }}`) con contraste al tono. */
  fondoDegradado: string;
  /** Peso aproximado del WebP de 800 px, en KB (para mostrar "optimizada a X KB"). */
  pesoKb: number;
  /** La prenda está recortada sin fondo (PNG/WebP con transparencia). */
  transparente: boolean;
  /** Archivo original (para quitar fondo después, sin re-elegir). */
  originalFile?: File;
}

/** Carga un File en un HTMLImageElement. */
function cargarImagen(file: File): Promise<HTMLImageElement> {
  return cargarBlob(file);
}

/** Carga un Blob (p. ej. el PNG recortado) en un HTMLImageElement. */
function cargarBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}

/** Dibuja la imagen en un canvas del ancho pedido, manteniendo proporción. */
function dibujarEscalado(img: HTMLImageElement, anchoDestino: number): HTMLCanvasElement {
  const escala = Math.min(1, anchoDestino / img.naturalWidth);
  const w = Math.round(img.naturalWidth * escala);
  const h = Math.round(img.naturalHeight * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

/**
 * Encuadra la imagen en un lienzo 3:4 UNIFORME (ancho × ancho·4/3), centrada sin recortar (contain).
 * El espacio sobrante se rellena con el fondo degradado del tono, para que todas las fotos midan
 * igual aunque vengan de capturas de distintos tamaños. Si la imagen es transparente (recortada),
 * la prenda queda flotando sobre su fondo a juego.
 */
function encuadrar34(img: HTMLImageElement, anchoDestino: number, colorFondo: string): HTMLCanvasElement {
  const w = anchoDestino;
  const h = Math.round((anchoDestino * 4) / 3);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";

  // Fondo degradado (mismo criterio que fondoDegradadoDe, pero pintado en el canvas).
  const rgb = aRgb(colorFondo);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, aclarar(rgb, 0.85));
  grad.addColorStop(1, aclarar(rgb, 0.7));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Imagen centrada (contain) con un pequeño margen para que respire.
  const margen = 0.92;
  const escala = Math.min((w * margen) / img.naturalWidth, (h * margen) / img.naturalHeight);
  const iw = img.naturalWidth * escala;
  const ih = img.naturalHeight * escala;
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  return canvas;
}

/** Exporta un canvas a WebP (calidad 0.82, buen balance peso/calidad). */
function aWebp(canvas: HTMLCanvasElement, calidad = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo convertir a WebP."))),
      "image/webp",
      calidad,
    );
  });
}

/**
 * Color dominante por cuantización simple: agrupa los píxeles en una rejilla de color (bucket de
 * 4 bits por canal), ignora casi-blancos y casi-negros (suelen ser fondo/sombra) y toma el grupo
 * más poblado. Devuelve "#RRGGBB". Trabaja sobre un canvas chico (rápido).
 */
function colorDominanteDe(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  const cuentas = new Map<number, { n: number; r: number; g: number; b: number }>();
  // Submuestreo: 1 de cada 4 píxeles es suficiente y mucho más rápido.
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 125) continue; // transparente
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 240 && min > 225) continue; // casi blanco (fondo)
    if (max < 28) continue; // casi negro (sombra)
    // Bucket de 4 bits por canal.
    const clave = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const prev = cuentas.get(clave);
    if (prev) {
      prev.n++;
      prev.r += r;
      prev.g += g;
      prev.b += b;
    } else {
      cuentas.set(clave, { n: 1, r, g, b });
    }
  }

  let mejor: { n: number; r: number; g: number; b: number } | null = null;
  for (const v of cuentas.values()) if (!mejor || v.n > mejor.n) mejor = v;
  if (!mejor) return "#C9BCae".toUpperCase(); // fallback neutro cálido

  const r = Math.round(mejor.r / mejor.n);
  const g = Math.round(mejor.g / mejor.n);
  const b = Math.round(mejor.b / mejor.n);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** RGB desde "#RRGGBB". */
function aRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mezcla un color con blanco (`t`=proporción de blanco 0–1) para versiones claras del tono. */
function aclarar([r, g, b]: [number, number, number], t: number): string {
  const m = (x: number) => Math.round(x + (255 - x) * t);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/**
 * Fondo degradado a partir del tono dominante: un degradado diagonal suave entre dos versiones
 * claras del color (85% y 70% de blanco), de modo que la prenda contraste encima sin competir.
 * Elegante y editorial, dentro del mundo crema de Domna.
 */
function fondoDegradadoDe(hex: string): string {
  const rgb = aRgb(hex);
  const claro = aclarar(rgb, 0.85);
  const medio = aclarar(rgb, 0.7);
  return `linear-gradient(145deg, ${claro} 0%, ${medio} 100%)`;
}

/** Procesa un File de imagen y devuelve WebP por tamaño + color + fondo + preview. */
export async function procesarImagenProducto(file: File): Promise<ImagenProcesada> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Elige un archivo de imagen.");
  }
  const img = await cargarImagen(file);
  return procesarImagen(img, { originalFile: file });
}

/**
 * Quita el fondo de una imagen con IA LOCAL en el navegador (@imgly/background-removal) y procesa
 * la prenda recortada. Gratis, sin servidor. El import es dinámico: el modelo (~varios MB) solo se
 * descarga cuando la dueña usa "Quitar fondo", nunca en la carga inicial de la app.
 */
export async function quitarFondoYProcesar(file: File): Promise<ImagenProcesada> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Elige un archivo de imagen.");
  }
  const { removeBackground } = await import("@imgly/background-removal");
  // Devuelve un PNG con transparencia (la prenda recortada).
  const recortada = await removeBackground(file, { output: { format: "image/png" } });
  const img = await cargarBlob(recortada);
  return procesarImagen(img, { transparente: true, originalFile: file });
}

/** Núcleo compartido: a partir de un HTMLImageElement genera color, fondo y WebP por tamaño. */
async function procesarImagen(
  img: HTMLImageElement,
  opciones: { transparente?: boolean; originalFile?: File } = {},
): Promise<ImagenProcesada> {
  // Canvas chico solo para el análisis de color (rápido).
  const canvasColor = dibujarEscalado(img, 160);
  const colorDominante = colorDominanteDe(canvasColor);
  const fondoDegradado = fondoDegradadoDe(colorDominante);

  // WebP por tamaño, TODOS encuadrados en 3:4 uniforme (misma proporción) sobre el fondo del tono.
  // Si la prenda viene recortada (transparente), queda flotando sobre su fondo a juego.
  const webp = {} as Record<TamanoImagen, Blob>;
  for (const t of TAMANOS_IMAGEN) {
    const canvas = encuadrar34(img, t, colorDominante);
    webp[t] = await aWebp(canvas, opciones.transparente ? 0.9 : 0.82);
  }

  const preview = await blobADataUrl(webp[800]);
  const pesoKb = Math.round(webp[800].size / 1024);
  return {
    webp,
    preview,
    colorDominante,
    fondoDegradado,
    pesoKb,
    transparente: !!opciones.transparente,
    originalFile: opciones.originalFile,
  };
}

function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("No se pudo generar la vista previa."));
    fr.readAsDataURL(blob);
  });
}


/** Lado mayor del comprobante: suficiente para leer montos y claves de rastreo, sin pesar de más. */
const LADO_MAX_COMPROBANTE = 1800;

/**
 * Prepara la foto o captura de un comprobante para subirla: la reduce (lado mayor 1800 px) y la
 * exporta a JPEG con calidad alta para que el texto siga legible. Rechaza lo que no sea imagen.
 * Una captura de pantalla de varios MB queda en unos cientos de KB.
 */
export async function comprimirComprobante(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Elige una foto o captura del comprobante.");
  const img = await cargarImagen(file);
  const escala = Math.min(1, LADO_MAX_COMPROBANTE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * escala));
  const h = Math.max(1, Math.round(img.naturalHeight * escala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen.");
  // Fondo blanco: una captura PNG con transparencia no debe quedar negra al pasar a JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo preparar la imagen."))),
      "image/jpeg",
      0.88,
    );
  });
}
