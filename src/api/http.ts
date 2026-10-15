import { ApiError, errorDeRed, errorDeTimeout } from "@/lib/errores";
import { esRutaDeAuth } from "@/lib/reintento";

/**
 * Cliente HTTP del backend real (domna-api).
 *
 * Interruptor: si `VITE_API_URL` está definida, la app usa la API real; si está vacía, el front
 * sigue con el mock (`src/mock/server.ts`). Así la demo con datos de ejemplo nunca se rompe.
 *
 * - Base URL desde `import.meta.env.VITE_API_URL`.
 * - Guarda/lee/limpia el token JWT en localStorage y lo manda como `Authorization: Bearer`.
 * - Traduce los errores del backend (`{ "mensaje": "..." }` + status) al `ApiError` del front.
 * - Tiempo límite por petición (AbortController) para que una señal lenta no cuelgue minutos.
 * - Cabecera `Idempotency-Key` opcional para que el backend no duplique acciones al reintentar.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** ¿Está activada la API real? (hay URL configurada). Si es false, los hooks usan el mock. */
export const apiActiva = BASE_URL.length > 0;

const STORAGE_TOKEN = "domna.token";

/** Tiempo límite por defecto de una petición (ms). Las subidas de archivos pueden pedir más. */
export const TIMEOUT_DEFECTO = 20_000;

export function guardarToken(token: string): void {
  localStorage.setItem(STORAGE_TOKEN, token);
}

export function leerToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN);
}

export function limpiarToken(): void {
  localStorage.removeItem(STORAGE_TOKEN);
}

/**
 * Manejo centralizado de la sesión vencida (401 en una ruta autenticada). SesionProvider registra
 * aquí qué hacer (limpiar la sesión y mandar a /entrar) sin crear dependencias circulares.
 */
type ManejadorSesionVencida = () => void;
let alVencerSesion: ManejadorSesionVencida | null = null;

export function registrarSesionVencida(fn: ManejadorSesionVencida | null): void {
  alVencerSesion = fn;
}

interface OpcionesPeticion {
  /** Cuerpo JSON (se serializa). */
  body?: unknown;
  /** ¿Adjuntar el token JWT? (default true si hay token). */
  conAuth?: boolean;
  /** Tiempo límite en ms (default 20 s). Súbelo para subidas de archivos. */
  timeoutMs?: number;
  /** UUID de idempotencia: se envía como cabecera `Idempotency-Key` (solo tiene efecto en POST). */
  idempotencyKey?: string;
  /** Señal externa opcional (p. ej. para cancelar al desmontar). Se combina con el timeout interno. */
  signal?: AbortSignal;
}

/** Petición JSON genérica al backend. Lanza ApiError con el status y el mensaje del backend. */
async function pedir<T>(metodo: string, ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = leerToken();
  if (token && opciones.conAuth !== false) headers.Authorization = `Bearer ${token}`;
  if (opciones.idempotencyKey) headers["Idempotency-Key"] = opciones.idempotencyKey;

  // AbortController propio por petición: así el timeout NUNCA cancela peticiones ajenas.
  const controlador = new AbortController();
  const limite = opciones.timeoutMs ?? TIMEOUT_DEFECTO;
  let porTimeout = false;
  const temporizador = setTimeout(() => {
    porTimeout = true;
    controlador.abort();
  }, limite);

  // Si quien llama pasó su propia señal, la encadenamos (sin cancelar la suya).
  const externa = opciones.signal;
  const alAbortarExterna = () => controlador.abort();
  if (externa) {
    if (externa.aborted) controlador.abort();
    else externa.addEventListener("abort", alAbortarExterna);
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
      signal: controlador.signal,
    });
  } catch (e) {
    if (porTimeout) throw errorDeTimeout();
    // La canceló quien llamó (desmontaje, navegación): respeta ese AbortError.
    if (externa?.aborted && e instanceof DOMException && e.name === "AbortError") throw e;
    // Falla de red / servidor caído / CORS.
    throw errorDeRed();
  } finally {
    clearTimeout(temporizador);
    if (externa) externa.removeEventListener("abort", alAbortarExterna);
  }

  // Sesión vencida: solo en rutas autenticadas (en login/registro/recuperación el 401 es credencial).
  if (respuesta.status === 401 && opciones.conAuth !== false && !esRutaDeAuth(ruta)) {
    alVencerSesion?.();
    throw new ApiError(401, "Tu sesión venció. Entra de nuevo.");
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    // El backend responde { mensaje } (ver ManejadorErrores del API).
    const mensaje = datos?.mensaje ?? "Algo salió mal. Intenta de nuevo.";
    throw new ApiError(respuesta.status, mensaje);
  }

  return datos as T;
}

export const http = {
  get: <T>(ruta: string, opciones?: OpcionesPeticion) => pedir<T>("GET", ruta, opciones),
  post: <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
    pedir<T>("POST", ruta, { ...opciones, body }),
  put: <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
    pedir<T>("PUT", ruta, { ...opciones, body }),
  del: <T>(ruta: string, opciones?: OpcionesPeticion) => pedir<T>("DELETE", ruta, opciones),
};
