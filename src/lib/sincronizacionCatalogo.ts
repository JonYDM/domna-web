import type { QueryClient } from "@tanstack/react-query";

/**
 * Mantiene al día el catálogo entre ventanas de la MISMA app (pestañas del navegador o la PWA
 * instalada): cuando una ventana invalida productos, colores, categorías o la config (porque la
 * dueña publicó o editó algo), avisa a las demás para que también refresquen, sin recargar.
 *
 * Se engancha a `invalidateQueries` para cubrir todas las mutaciones actuales y futuras sin tocar
 * cada una. Lo que llega por el canal se invalida SIN volver a avisar (evita el rebote infinito).
 * Entre dispositivos distintos no hay aviso inmediato: ahí manda el refresco al volver a la app.
 */

/** Mientras es true, las invalidaciones no se difunden a las demás ventanas (ya llegó el aviso a todas). */
let silenciado = false;

/** Ejecuta `fn` sin que lo que invalide se repita en las demás ventanas. */
export function sinDifundir(fn: () => void): void {
  const antes = silenciado;
  silenciado = true;
  try {
    fn();
  } finally {
    silenciado = antes;
  }
}

const CANAL = "domna-catalogo";
const CLAVES_DEL_CATALOGO = new Set(["productos", "producto", "categorias", "colores", "config"]);

export function esClaveDelCatalogo(clave: unknown): clave is string {
  return typeof clave === "string" && CLAVES_DEL_CATALOGO.has(clave);
}

/** Devuelve la función que lo desconecta (p. ej. al desmontar el proveedor). */
export function sincronizarCatalogoEntreVentanas(qc: QueryClient): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};

  const canal = new BroadcastChannel(CANAL);
  const original = qc.invalidateQueries.bind(qc);
  let recibiendo = false;

  qc.invalidateQueries = ((filtros, opciones) => {
    const clave = filtros?.queryKey?.[0];
    if (!recibiendo && !silenciado && esClaveDelCatalogo(clave)) canal.postMessage({ clave });
    return original(filtros, opciones);
  }) as QueryClient["invalidateQueries"];

  canal.onmessage = (e: MessageEvent<{ clave?: unknown }>) => {
    const clave = e.data?.clave;
    if (!esClaveDelCatalogo(clave)) return;
    recibiendo = true;
    try {
      void original({ queryKey: [clave] });
    } finally {
      recibiendo = false;
    }
  };

  return () => {
    canal.close();
    qc.invalidateQueries = original;
  };
}
