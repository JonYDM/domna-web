/** Motivo de un error de conexión (status 0): sin red o la petición tardó demasiado. */
export type MotivoConexion = "red" | "timeout";

/** Error de API normalizado (mismo shape que devolverá el backend: { mensaje, codigo?, datos? }). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Solo para errores de conexión (status 0): distingue "sin red" de "timeout". */
    public motivo?: MotivoConexion,
    /**
     * Código de negocio del backend (p. ej. "sesion_activa", "sesion_reemplazada"). Permite
     * decidir el flujo sin parsear el mensaje humano. Lo llena http.ts desde el cuerpo del error.
     */
    public codigo?: string,
    /** Datos extra del error (p. ej. el dispositivo de la sesión activa en un 409). */
    public datos?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Mensajes claros para los dos cortes de conexión (status 0). */
export const MENSAJE_SIN_RED = "No hay conexión.";
export const MENSAJE_TIMEOUT = "La conexión está lenta. Intenta de nuevo.";

/** Falla de red (servidor caído, sin internet, CORS): status 0, motivo "red". */
export function errorDeRed(mensaje: string = MENSAJE_SIN_RED): ApiError {
  return new ApiError(0, mensaje, "red");
}

/** La petición superó el tiempo límite (señal lenta): status 0, motivo "timeout". */
export function errorDeTimeout(mensaje: string = MENSAJE_TIMEOUT): ApiError {
  return new ApiError(0, mensaje, "timeout");
}

/** ¿Es un corte de conexión (sin red o timeout)? Estos sí se reintentan. */
export function esErrorDeConexion(e: unknown): e is ApiError {
  return e instanceof ApiError && e.status === 0;
}

export function mensajeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Algo salió mal. Intenta de nuevo.";
}
