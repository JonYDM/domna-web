import { memo } from "react";
import { Link } from "react-router-dom";
import type { Aviso } from "@/types/api";
import { cn } from "@/lib/cn";
import { formatHace } from "@/lib/format";
import { ESTILO_AVISO } from "../estilos";

/** Un aviso: ícono por tipo, título, texto, hace cuánto y punto si no está leído. */
export const AvisoItem = memo(function AvisoItem({
  aviso: a,
  onAbrir,
}: {
  aviso: Aviso;
  onAbrir: (id: string) => void;
}) {
  const { icono: Icono, clase } = ESTILO_AVISO[a.tipo];
  return (
    <Link
      to={`/tienda/apartados/${a.apartadoId}`}
      onClick={() => !a.leido && onAbrir(a.id)}
      className={cn(
        "flex gap-3 rounded-2xl p-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        a.leido ? "bg-transparent hover:bg-surface-container-low" : "bg-surface-container-lowest shadow-soft",
        a.urgente && !a.leido && "ring-1 ring-warning/40",
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", clase)}>
        <Icono className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn("text-label-lg", a.leido ? "text-on-surface-variant" : "text-on-surface")}>{a.titulo}</span>
          <span className="shrink-0 text-body-sm text-on-surface-variant">{formatHace(a.fecha)}</span>
        </span>
        <span className="mt-0.5 block text-body-sm text-on-surface-variant">{a.texto}</span>
      </span>
      {!a.leido && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />}
    </Link>
  );
});
