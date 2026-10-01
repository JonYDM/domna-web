import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { useSesion } from "@/features/auth/sesion";
import { useAvisos, useMarcarAvisosLeidos } from "../hooks";

/** Banda del aviso urgente sin leer más reciente (p. ej. "Tu apartado vence mañana"). */
export function AvisoUrgente() {
  const { sesion } = useSesion();
  const clientaId = sesion?.rol === "clienta" ? sesion.clientaId : undefined;
  const avisos = useAvisos(clientaId);
  const marcar = useMarcarAvisosLeidos(clientaId);
  const urgente = avisos.data?.find((a) => a.urgente && !a.leido);
  if (!urgente) return null;

  return (
    <Link
      to={`/tienda/apartados/${urgente.apartadoId}`}
      onClick={() => marcar.mutate([urgente.id])}
      role="alert"
      className="flex items-center gap-3 rounded-2xl bg-warning-container p-3.5 text-warning"
    >
      <Clock className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-label-lg">{urgente.titulo}</span>
        <span className="block truncate text-body-sm">{urgente.texto}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
    </Link>
  );
}
