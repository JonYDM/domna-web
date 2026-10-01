import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import type { Apartado } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ESTADO_APARTADO } from "@/lib/enums";
import { formatFecha, formatMXN, textoVencimiento } from "@/lib/format";
import { diasHasta } from "@/lib/reloj";
import { ProgresoPago } from "./ProgresoPago";

/** Card de apartado (clienta y dueña). Imagen, folio, prenda, estado, vigencia y saldo. */
export const ApartadoCard = memo(function ApartadoCard({
  apartado: a,
  to,
  mostrarClienta = false,
}: {
  apartado: Apartado;
  to: string;
  mostrarClienta?: boolean;
}) {
  const l = a.lineas[0];
  const estado = ESTADO_APARTADO[a.estado];
  const activo = a.estado === "activo";
  const urgente = activo && diasHasta(a.venceEl) <= 3;

  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-3.5 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex gap-3">
        <PrendaImagen silueta={l.silueta} hex={l.colorHex} alt="" className="w-16 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="tabular text-label-md text-on-surface-variant">{a.folio}</p>
            <Badge tono={estado.tono}>{estado.label}</Badge>
          </div>
          {mostrarClienta && <p className="mt-0.5 truncate text-label-lg">{a.clientaNombre}</p>}
          <p className={cn("truncate", mostrarClienta ? "text-body-sm text-on-surface-variant" : "mt-0.5 text-label-lg")}>
            {l.nombre}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {l.colorNombre} · Talla {l.talla}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-outline" aria-hidden />
      </div>
      {activo ? (
        <>
          <ProgresoPago pagado={a.pagado} total={a.total} />
          <div className="flex items-center justify-between text-body-sm">
            <span className={cn("inline-flex items-center gap-1.5", urgente ? "font-semibold text-warning" : "text-on-surface-variant")}>
              <Clock className="h-4 w-4" aria-hidden />
              {textoVencimiento(a.venceEl)}
            </span>
            <span className="tabular font-semibold">Saldo {formatMXN(a.saldo)}</span>
          </div>
        </>
      ) : (
        <p className="tabular flex justify-between border-t border-outline-variant/50 pt-2.5 text-body-sm text-on-surface-variant">
          <span>{a.cerradoEl ? `${estado.label} el ${formatFecha(a.cerradoEl)}` : estado.label}</span>
          <span>{formatMXN(a.total)}</span>
        </p>
      )}
    </Link>
  );
});
