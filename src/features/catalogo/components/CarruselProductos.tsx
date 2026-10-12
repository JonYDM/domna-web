import { Link } from "react-router-dom";
import type { ProductoResumen } from "@/types/api";
import { ProductoCard } from "./ProductoCard";
import { ProductoCardSkeleton } from "./ProductoCardSkeleton";

interface CarruselProductosProps {
  titulo: string;
  subtitulo?: string;
  productos?: ProductoResumen[];
  cargando: boolean;
  /** Enlace "Ver todo" (lista filtrada). */
  verTodo: string;
  onPrefetch?: (id: string) => void;
}

/** Fila horizontal con scroll-snap (swipe en móvil). No se muestra si no hay productos. */
export function CarruselProductos({ titulo, subtitulo, productos, cargando, verTodo, onPrefetch }: CarruselProductosProps) {
  if (!cargando && !productos?.length) return null;

  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-marca text-headline-md text-on-surface">{titulo}</h2>
          {subtitulo && <p className="text-body-sm text-on-surface-variant">{subtitulo}</p>}
        </div>
        <Link to={verTodo} className="shrink-0 py-2 text-label-lg text-on-surface underline-offset-4 hover:underline">
          Ver todo
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
