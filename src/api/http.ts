import { ApiError } from "@/lib/errores";

/**
 * Cliente HTTP del backend real (domna-api).
 *
 * Interruptor: si `VITE_API_URL` está definida, la app usa la API real; si está vacía, el front
 * sigue con el mock (`src/mock/server.ts`). Así la demo con datos de ejemplo nunca se rompe.
 *
 * - Base URL desde `import.meta.env.VITE_API_URL`.
 * - Guarda/lee/limpia el token JWT en localStorage y lo manda como `Authorization: Bearer`.
 * - Traduce los errores del backend (`{ "mensaje": "..." }` + status) al `ApiError` del front.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** ¿Está activada la API real? (hay URL configurada). Si es false, los hooks usan el mock. */
export const apiActiva = BASE_URL.length > 0;

const STORAGE_TOKEN = "domna.token";

export function guardarToken(token: string): void {
  localStorage.setItem(STORAGE_TOKEN, token);
}

export function leerToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN);
}

export function limpiarToken(): void {
  localStorage.removeItem(STORAGE_TOKEN);
}

interface OpcionesPeticion {
  /** Cuerpo JSON (se serializa). */
  body?: unknown;
  /** ¿Adjuntar el token JWT? (default true si hay token). */
  conAuth?: boolean;
}

/** Petición JSON genérica al backend. Lanza ApiError con el status y el mensaje del backend. */
async function pedir<T>(metodo: string, ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = leerToken();
  if (token && opciones.conAuth !== false) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
    });
  } catch {
    // Falla de red / servidor caído / CORS.
    throw new ApiError(0, "No se pudo conectar con el servidor. Revisa tu conexión.");
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
