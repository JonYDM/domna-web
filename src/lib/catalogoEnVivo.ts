import type { QueryClient } from "@tanstack/react-query";
import { sinDifundir } from "./sincronizacionCatalogo";

/**
 * Actualización en vivo. El servidor tiene un canal de eventos (SSE) por el que avisa "algo cambió" cada vez
 * que alguien modifica productos, stock, colores, categorías, configuración o pedidos. Aquí se escucha ese
 * canal en cualquier rol (también quien solo mira la tienda) y se vuelve a pedir lo que está en pantalla.
 *
 * Reglas:
 *  - Solo se mantiene la conexión abierta mientras la pantalla se ve; al esconderla se cierra (el iPhone la
 *    mataría igual) y al volver se reabre y, si algo cambió mientras tanto, se refresca.
 *  - El aviso no lleva datos, solo un número de versión. Si el número cambia, hay que refrescar.
 *  - Si el canal falla, no pasa nada grave: queda el refresco periódico de siempre.
 */

/** Lo mínimo que se usa de EventSource; permite probarlo sin navegador. */
export interface FuenteEventos {
  readonly readyState: number;
  onerror: ((e: unknown) => void) | null;
  addEventListener(tipo: string, escucha: (e: { data: string }) => void): void;
  close(): void;
}

const CERRADA = 2; // EventSource.CLOSED

export interface OpcionesCatalogoEnVivo {
  url: string;
  /** Se llama (una vez, aunque lleguen varios avisos juntos) cuando hay que volver a pedir los datos. */
  alCambiar: () => void;
  crearFuente?: (url: string) => FuenteEventos;
  estaVisible?: () => boolean;
  /** Registra una función para cuando la pantalla se esconde o se muestra; devuelve cómo quitarla. */
  alCambiarVisibilidad?: (fn: () => void) => () => void;
  /** Espera para juntar avisos seguidos en uno solo. */
  esperaAgrupar?: number;
  /** Cuánto esperar antes de reabrir un canal que el servidor rechazó, según el intento. */
  esperaReintento?: (intento: number) => number;
}

const ESPERAS_REINTENTO = [30_000, 60_000, 120_000];

/** Devuelve la función que corta todo (conexión y temporizadores). */
export function conectarCatalogoEnVivo(o: OpcionesCatalogoEnVivo): () => void {
  const crear = o.crearFuente ?? (typeof EventSource !== "undefined" ? (u: string) => new EventSource(u) as FuenteEventos : null);
  if (!crear) return () => {};

  const visible = o.estaVisible ?? (() => typeof document === "undefined" || document.visibilityState !== "hidden");
  const alCambiarVisibilidad =
    o.alCambiarVisibilidad ??
    ((fn: () => void) => {
      if (typeof document === "undefined") return () => {};
      document.addEventListener("visibilitychange", fn);
      return () => document.removeEventListener("visibilitychange", fn);
    });
  const esperaAgrupar = o.esperaAgrupar ?? 400;
  const esperaReintento = o.esperaReintento ?? ((n: number) => ESPERAS_REINTENTO[Math.min(n, ESPERAS_REINTENTO.length - 1)]);

  let fuente: FuenteEventos | null = null;
  let ultimaVersion: number | null = null;
  let temporizadorAgrupar: ReturnType<typeof setTimeout> | undefined;
  let temporizadorReintento: ReturnType<typeof setTimeout> | undefined;
  let intentos = 0;
  let activo = true;

  function avisar() {
    clearTimeout(temporizadorAgrupar);
    temporizadorAgrupar = setTimeout(() => {
      if (activo) o.alCambiar();
    }, esperaAgrupar);
  }

  function cerrar() {
    fuente?.close();
    fuente = null;
  }

  function programarReintento() {
    clearTimeout(temporizadorReintento);
    temporizadorReintento = setTimeout(abrir, esperaReintento(intentos++));
  }

  function abrir() {
    if (!activo || fuente || !visible()) return;
    const f = crear!(o.url);
    fuente = f;
    f.addEventListener("version", (e) => {
      intentos = 0;
      const version = Number(e.data);
      if (!Number.isFinite(version)) return;
      // La primera versión que se ve solo marca el punto de partida; después, cualquier cambio de número
      // (también hacia abajo: el servidor se reinició) significa que hay datos nuevos.
      if (ultimaVersion !== null && version !== ultimaVersion) avisar();
      ultimaVersion = version;
    });
    f.onerror = () => {
      // Mientras la conexión siga "conectando", el navegador reintenta solo. Si quedó cerrada, el servidor la
      // rechazó (por ejemplo, demasiadas conexiones): se vuelve a intentar más tarde, sin insistir.
      if (f.readyState === CERRADA) {
        cerrar();
        programarReintento();
      }
    };
  }

  function alVisibilidadCambiada() {
    if (visible()) {
      abrir();
    } else {
      clearTimeout(temporizadorReintento);
      cerrar();
    }
  }

  const quitarVisibilidad = alCambiarVisibilidad(alVisibilidadCambiada);
  abrir();

  return () => {
    activo = false;
    clearTimeout(temporizadorAgrupar);
    clearTimeout(temporizadorReintento);
    quitarVisibilidad();
    cerrar();
  };
}

/** Lo que se vuelve a pedir cuando algo cambió. Solo se refrescan las consultas que están en pantalla. */
const CLAVES_A_REFRESCAR = [
  "productos", "producto", "categorias", "colores", "config",
  "apartados", "apartado", "pagos", "tienda", "metricas", "corte", "clientas", "clienta",
];

export function refrescarPorCambio(qc: QueryClient): void {
  // Las demás ventanas de este dispositivo reciben el mismo aviso del servidor: no hace falta avisarles.
  sinDifundir(() => {
    for (const clave of CLAVES_A_REFRESCAR) void qc.invalidateQueries({ queryKey: [clave] });
  });
}