/** Error de API normalizado (mismo shape que devolverá el backend: { error }). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function mensajeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Algo salió mal. Intenta de nuevo.";
}
