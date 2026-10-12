import { Loader2 } from "lucide-react";

/** Carga de ruta (lazy): spinner neutro. */
export function PantallaCarga() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-label="Cargando">
      <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" aria-hidden />
    </div>
  );
}
