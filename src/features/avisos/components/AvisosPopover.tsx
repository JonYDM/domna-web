import { Link } from "react-router-dom";
import { CheckCheck, ChevronRight } from "lucide-react";
import type { Aviso } from "@/types/api";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatHace } from "@/lib/format";
import { ESTILO_AVISO } from "../estilos";
import { useAvisos, useMarcarAvisosLeidos } from "../hooks";

/** Avisos dentro del popover del perfil: los 3 más relevantes (sin leer y urgentes primero). */
export function AvisosPopover({ clientaId, onNavegar }: { clientaId: string; onNavegar: () => void }) {
  const avisos = useAvisos(clientaId);
  const marcar = useMarcarAvisosLeidos(clientaId);
  const lista = avisos.data ?? [];
  const sinLeer = lista.filter((a) => !a.leido);

  return (
    <section aria-label="Avisos" className="flex flex-col">
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <h2 className="text-label-lg">
          Avisos
          {sinLeer.length > 0 && <span className="ml-1.5 text-body-sm font-normal text-on-surface-variant">{sinLeer.length} sin leer</span>}
        </h2>
        {sinLeer.length > 0 && (
          <button
            type="button"
            onClick={() => marcar.mutate(sinLeer.map((a) => a.id))}
            className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-label-md text-on-surface-variant hover:bg-surface-container"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Marcar leídos
          </button>
        )}
      </div>

      {avisos.isPending ? (
        <div className="flex flex-col gap-2 p-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : lista.length === 0 ? (
        <p className="px-4 pb-4 pt-2 text-body-sm text-on-surface-variant">Estás al día. Aquí te avisaremos de vencimientos y entregas.</p>
      ) : (
        <ul className="flex flex-col px-2 pb-1">
          {lista.slice(0, 3).map((a) => (
            <li key={a.id}>
              <FilaAviso
                aviso={a}
                onClick={() => {
                  if (!a.leido) marcar.mutate([a.id]);
                  onNavegar();
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/tienda/avisos"
        onClick={onNavegar}
        className="mx-2 mb-2 flex h-11 items-center justify-between rounded-xl px-3 text-label-lg text-primary-strong hover:bg-primary-soft"
      >
        Ver todos los avisos
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}

function FilaAviso({ aviso: a, onClick }: { aviso: Aviso; onClick: () => void }) {
  const { icono: Icono, clase } = ESTILO_AVISO[a.tipo];
  return (
    <Link
      to={`/tienda/apartados/${a.apartadoId}`}
      onClick={onClick}
      className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", clase)}>
        <Icono className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-label-lg", a.leido ? "text-on-surface-variant" : "text-on-surface")}>{a.titulo}</span>
        <span className="block truncate text-body-sm text-on-surface-variant">{a.texto}</span>
        <span className="block text-label-sm text-outline">{formatHace(a.fecha)}</span>
      </span>
      {!a.leido && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />}
    </Link>
  );
}
