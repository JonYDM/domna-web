import { useRef, useCallback } from "react";
import { esErrorDeConexion } from "./errores";

/**
 * Llaves de idempotencia (contrato con el backend).
 *
 * El backend acepta una cabecera `Idempotency-Key` con un UUID para que, si una acción se reintenta
 * tras un corte de red/timeout, no se duplique (p. ej. no cobrar dos abonos). La regla:
 *
 * - La llave se genera UNA vez por acción del usuario.
 * - Se REUTILIZA mientras la acción se reintente sin éxito (mismo intento lógico).
 * - Se RENUEVA tras un éxito, o cuando cambian los datos de la acción (es otra acción distinta).
 */

/** UUID v4. Usa crypto.randomUUID si existe; si no, un respaldo con getRandomValues o Math.random. */
export function nuevaLlaveIdempotencia(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Respaldo: construir un UUID v4 válido.
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/** Estado de una llave: la llave vigente y la firma de los datos que la originaron. */
export interface EstadoLlave {
  llave: string;
  firma: string;
}

/**
 * Decide la llave a usar para esta ejecución, de forma pura:
 * - Si no hay llave previa, o cambió la firma de los datos → nueva llave.
 * - Si la firma coincide (misma acción reintentada) → reutiliza la llave previa.
 */
export function resolverLlave(previo: EstadoLlave | null, firma: string): EstadoLlave {
  if (previo && previo.firma === firma) return previo;
  return { llave: nuevaLlaveIdempotencia(), firma };
}

/** Firma estable de los datos de una acción (para saber si "es la misma acción"). */
export function firmaDatos(datos: unknown): string {
  try {
    return JSON.stringify(datos ?? null);
  } catch {
    return String(datos);
  }
}

/**
 * Hook para manejar la llave de una mutación conservando su reutilización entre reintentos.
 * Devuelve `llavePara(datos)` (llámalo al construir la petición) y `confirmarExito()` (en onSuccess),
 * que fuerza una llave nueva para la próxima acción.
 */
export function useLlaveIdempotencia() {
  const estado = useRef<EstadoLlave | null>(null);

  const llavePara = useCallback((datos: unknown): string => {
    const siguiente = resolverLlave(estado.current, firmaDatos(datos));
    estado.current = siguiente;
    return siguiente.llave;
  }, []);

  const confirmarExito = useCallback(() => {
    estado.current = null; // la próxima acción estrena llave
  }, []);

  const alError = useCallback((error: unknown) => {
    // Si NO fue corte de conexión, la acción ya tuvo respuesta del backend: estrena llave la próxima.
    // Si fue red/timeout, conservamos la llave para reintentar la misma acción.
    if (!esErrorDeConexion(error)) estado.current = null;
  }, []);

  return { llavePara, confirmarExito, alError };
}
