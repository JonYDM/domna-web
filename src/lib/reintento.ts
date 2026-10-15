import { ApiError, esErrorDeConexion } from "./errores";

/**
 * Política de reintentos (lógica pura, probada aparte de TanStack Query).
 *
 * - Corte de conexión (status 0: sin red o timeout): se reintenta hasta 2 veces (3 intentos en total),
 *   porque suelen ser pasajeros y la misma acción puede completarse al recuperar la señal.
 * - Errores de negocio/permiso (4xx): NO se reintentan (no cambian al reintentar).
 * - Errores 5xx persistentes: un solo reintento (fallos < 1), por si fue un hipo del servidor.
 *
 * @param fallos  número de reintentos ya ocurridos (0 en el primer fallo).
 */
const MAX_REINTENTOS_CONEXION = 2;

export function debeReintentar(fallos: number, error: unknown): boolean {
  if (esErrorDeConexion(error)) return fallos < MAX_REINTENTOS_CONEXION;
  if (error instanceof ApiError && error.status < 500) return false;
  return fallos < 1;
}

/**
 * Espera exponencial entre reintentos, con tope. 1ª espera ~1 s, 2ª ~2 s, 3ª ~4 s… hasta 10 s.
 * @param fallos número de reintentos ya ocurridos.
 */
export function esperaReintento(fallos: number): number {
  return Math.min(1000 * 2 ** fallos, 10_000);
}

/**
 * Rutas de autenticación donde un 401 significa "credenciales incorrectas", NO "sesión vencida".
 * En estas NO se dispara el cierre de sesión global.
 */
const RUTAS_AUTH = [
  "/api/auth/login",
  "/api/auth/registrar",
  "/api/auth/recuperar",
  "/api/auth/recuperar/confirmar",
];

/** ¿La ruta es de login/registro/recuperación? (ahí el 401 es credencial incorrecta). */
export function esRutaDeAuth(ruta: string): boolean {
  const limpia = ruta.split("?")[0];
  return RUTAS_AUTH.some((r) => limpia === r || limpia.startsWith(`${r}/`));
}
