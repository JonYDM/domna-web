import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductoResumen } from "@/types/api";
import { ProductoCard } from "./ProductoCard";
import { ProductoCardSkeleton } from "./ProductoCardSkeleton";

interface CarruselProductosProps {
  titulo: string;
  subtitulo?: string;
  icono?: ReactNode;
  productos?: ProductoResumen[];
  cargando: boolean;
  /** Enlace "Ver todo" (lista filtrada). */
  verTodo: string;
  onPrefetch?: (id: string) => void;
}

/** Fila horizontal con scroll-snap (swipe en móvil). No se muestra si no hay productos. */
export function CarruselProductos({ titulo, subtitulo, icono, productos, cargando, verTodo, onPrefetch }: CarruselProductosProps) {
  if (!cargando && !productos?.length) return null;

  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-marca text-headline-md text-on-surface">
            {icono}
            {titulo}
          </h2>
          {subtitulo && <p className="text-body-sm text-on-surface-variant">{subtitulo}</p>}
        </div>
        <Link
          to={verTodo}
          className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-full pl-3 pr-1.5 text-label-lg text-primary-strong hover:bg-primary-soft"
        >
          Ver todo
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
        {cargando
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="w-[42%] shrink-0 sm:w-48">
                <ProductoCardSkeleton />
              </div>
            ))
          : productos!.map((p) => (
              <div key={p.id} className="w-[42%] shrink-0 snap-start sm:w-48">
                <ProductoCard producto={p} onPrefetch={onPrefetch} />
              </div>
            ))}
      </div>
    </section>
  );
}
