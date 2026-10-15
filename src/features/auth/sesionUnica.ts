import { ApiError } from "@/lib/errores";

/**
 * Lógica pura de la "sesión única por cuenta". Separada de React y de la red para poder probarla
 * sola:
 * - `mensajeSesionVencida`: traduce el código del backend al aviso humano de /entrar.
 * - `esConflictoDeSesion`: ¿el error del login es "ya hay otra sesión abierta" (409)?
 * - `datosSesionActiva`: extrae y valida los datos del dispositivo de ese 409.
 * - `cuerpoLogin`: arma el cuerpo del POST /login con o sin `reemplazarSesion`.
 * - `debeComprobarSesion`: throttling de la comprobación de sesión (máx. 1 cada 30 s).
 */

/** Códigos de sesión que el backend manda en el 401 de una ruta autenticada. */
export type CodigoSesion = "sesion_reemplazada" | "sesion_cerrada" | "sesion_expirada" | "sesion_invalida";

/** Datos de la sesión activa que viajan en el 409 "sesion_activa" del login. */
export interface SesionActiva {
  dispositivo: string;
  creada: string;
  ultimaActividad: string;
}

/** Mensaje por defecto cuando el backend no manda un código conocido. */
export const MENSAJE_SESION_VENCIDA_DEFECTO = "Tu sesión venció. Entra de nuevo.";

const MENSAJES: Record<CodigoSesion, string> = {
  sesion_reemplazada: "Tu sesión se cerró porque entraste desde otro dispositivo.",
  sesion_expirada: "Tu sesión venció. Entra de nuevo.",
  sesion_cerrada: "Cerraste sesión.",
  sesion_invalida: MENSAJE_SESION_VENCIDA_DEFECTO,
};

/**
 * Aviso humano para /entrar según el código del backend. Para "sesion_invalida" u otro/ninguno
 * usa el mensaje por defecto (el "mensaje actual" que ya mostraba la app).
 */
export function mensajeSesionVencida(codigo?: string): string {
  if (codigo && codigo in MENSAJES) return MENSAJES[codigo as CodigoSesion];
  return MENSAJE_SESION_VENCIDA_DEFECTO;
}

/** El código "sesion_activa" del 409: ya hay otra sesión abierta en la cuenta. */
export const CODIGO_SESION_ACTIVA = "sesion_activa";

/** ¿Es un error de "ya tienes una sesión abierta" (409 + codigo sesion_activa)? */
export function esConflictoDeSesion(e: unknown): e is ApiError {
  return e instanceof ApiError && e.status === 409 && e.codigo === CODIGO_SESION_ACTIVA;
}

/** Extrae y valida los datos del dispositivo del 409. Null si vienen incompletos o mal. */
export function datosSesionActiva(e: unknown): SesionActiva | null {
  if (!(e instanceof ApiError) || e.datos == null || typeof e.datos !== "object") return null;
  const d = e.datos as Record<string, unknown>;
  if (typeof d.dispositivo !== "string" || typeof d.creada !== "string" || typeof d.ultimaActividad !== "string") {
    return null;
  }
  return { dispositivo: d.dispositivo, creada: d.creada, ultimaActividad: d.ultimaActividad };
}

/** Cuerpo del POST /api/auth/login. Solo incluye `reemplazarSesion` cuando es true (más limpio). */
export function cuerpoLogin(
  telefono: string,
  pin: string,
  reemplazarSesion = false,
): { telefono: string; pin: string; reemplazarSesion?: boolean } {
  return reemplazarSesion ? { telefono, pin, reemplazarSesion: true } : { telefono, pin };
}

/** Intervalo mínimo entre comprobaciones de sesión al volver al primer plano (ms). */
export const INTERVALO_COMPROBACION_MS = 30_000;

/**
 * ¿Toca comprobar la sesión ahora? Como máximo 1 vez cada `intervalo` ms. La primera vez
 * (`ultima` null) siempre sí.
 * @param ultima  timestamp (ms) de la última comprobación, o null si nunca.
 * @param ahora   timestamp (ms) actual.
 */
export function debeComprobarSesion(
  ultima: number | null,
  ahora: number,
  intervalo: number = INTERVALO_COMPROBACION_MS,
): boolean {
  if (ultima === null) return true;
  return ahora - ultima >= intervalo;
}
