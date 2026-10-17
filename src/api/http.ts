import { ApiError, errorDeRed, errorDeTimeout } from "@/lib/errores";
import { esRutaDeAuth } from "@/lib/reintento";
import { CABECERA_MODO_APP, VALOR_APP_INSTALADA, detectarAppInstalada } from "@/lib/modoApp";

/**
 * Cliente HTTP del backend real (domna-api).
 *
 * - Base URL desde `import.meta.env.VITE_API_URL`.
 * - Guarda/lee/limpia el token JWT en localStorage y lo manda como `Authorization: Bearer`.
 * - Traduce los errores del backend (`{ "mensaje": "..." }` + status) al `ApiError` del front.
 * - Tiempo límite por petición (AbortController) para que una señal lenta no cuelgue minutos.
 * - Cabecera `Idempotency-Key` opcional para que el backend no duplique acciones al reintentar.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

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
 * aquí qué hacer (limpiar la sesión y mandar a /entrar) sin crear dependencias circulares. Recibe el
 * `codigo` del backend ("sesion_reemplazada" | "sesion_cerrada" | "sesion_expirada" | ...) para dar
 * un aviso acorde, o `undefined` si el cuerpo no lo trae.
 */
type ManejadorSesionVencida = (codigo?: string) => void;
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
  /**
   * Modo de caché del navegador. "no-cache" = revalida siempre con el servidor (ETag: si no cambió,
   * responde 304 sin cuerpo). Úsalo en lecturas del catálogo: así un refresco tras publicar nunca
   * recibe la lista vieja de la caché HTTP (max-age) del navegador.
   */
  cache?: RequestCache;
}

/** Petición JSON genérica al backend. Lanza ApiError con el status y el mensaje del backend. */
async function pedir<T>(metodo: string, ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  // Content-Type solo si hay cuerpo: en un GET obliga a una consulta previa (preflight) sin necesidad.
  const headers: Record<string, string> = opciones.body !== undefined ? { "Content-Type": "application/json" } : {};
  const token = leerToken();
  if (token && opciones.conAuth !== false) headers.Authorization = `Bearer ${token}`;
  if (opciones.idempotencyKey) headers["Idempotency-Key"] = opciones.idempotencyKey;
  // Solo al entrar/registrarse (rutas de auth): el servidor nombra el dispositivo como "iPhone · App
  // instalada" en lugar de repetir "iPhone · Safari". Fuera de auth no hace falta: evitaría una
  // consulta previa (preflight) en lecturas públicas.
  if (esRutaDeAuth(ruta) && detectarAppInstalada()) headers[CABECERA_MODO_APP] = VALOR_APP_INSTALADA;

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
      cache: opciones.cache,
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
  // El cuerpo trae `{ mensaje, codigo }`; el código decide el aviso (reemplazada / vencida / cerrada).
  if (respuesta.status === 401 && opciones.conAuth !== false && !esRutaDeAuth(ruta)) {
    const cuerpo = await leerCuerpo(respuesta);
    const codigo = typeof cuerpo?.codigo === "string" ? cuerpo.codigo : undefined;
    alVencerSesion?.(codigo);
    throw new ApiError(401, cuerpo?.mensaje ?? "Tu sesión venció. Entra de nuevo.", undefined, codigo, cuerpo?.datos);
  }

  if (respuesta.status === 204) return undefined as T;

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    // El backend responde { mensaje, codigo?, datos? } (ver ManejadorErrores del API). Guardamos
    // `codigo`/`datos` en el ApiError para que el flujo (p. ej. login con 409 "sesion_activa") los use.
    const mensaje = datos?.mensaje ?? "Algo salió mal. Intenta de nuevo.";
    const codigo = typeof datos?.codigo === "string" ? datos.codigo : undefined;
    throw new ApiError(respuesta.status, mensaje, undefined, codigo, datos?.datos);
  }

  return datos as T;
}

/** Lee y parsea el cuerpo JSON de una respuesta. Devuelve null si está vacío o no es JSON. */
async function leerCuerpo(respuesta: Response): Promise<{ mensaje?: string; codigo?: string; datos?: unknown } | null> {
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export const http = {
  get: <T>(ruta: string, opciones?: OpcionesPeticion) => pedir<T>("GET", ruta, opciones),
  post: <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
    pedir<T>("POST", ruta, { ...opciones, body }),
  put: <T>(ruta: string, body?: unknown, opciones?: OpcionesPeticion) =>
    pedir<T>("PUT", ruta, { ...opciones, body }),
  del: <T>(ruta: string, opciones?: OpcionesPeticion) => pedir<T>("DELETE", ruta, opciones),
};
