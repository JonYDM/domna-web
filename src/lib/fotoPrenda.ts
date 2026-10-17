import type { ImagenProducto } from "@/types/api";

/**
 * Cada foto se sube a R2 en tres tamaños con el mismo nombre de carpeta: `400.webp`, `800.webp` y
 * `1600.webp`. El producto guarda la de 800. De ahí salen la miniatura (400, unas 3 veces más ligera) y
 * la de zoom (1600), sin pedirle nada más al servidor.
 */
const TAMANO_GUARDADO = /\/800\.webp(?=$|[?#])/;

/** La versión chica de una foto, para listas y tarjetas. Si la URL no sigue la convención, queda igual. */
export function urlMiniatura(url: string | undefined): string | undefined {
  return url?.replace(TAMANO_GUARDADO, "/400.webp");
}

/** La versión grande de una foto, para ampliarla. Si la URL no sigue la convención, queda igual. */
export function urlGrande(url: string): string {
  return url.replace(TAMANO_GUARDADO, "/1600.webp");
}

/** La foto con la que se reconoce una prenda en un color: la primera de ese color o, si no tiene, la primera de todas. */
export function fotoDeColor(imagenes: ImagenProducto[], colorId: string | undefined): string | undefined {
  return imagenes.find((i) => i.colorId === colorId)?.url ?? imagenes[0]?.url;
}
