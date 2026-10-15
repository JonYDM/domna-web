import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { bordesDeScroll } from "@/lib/carrusel";

const FILAS: Record<1 | 2, string> = { 1: "grid-rows-1", 2: "grid-rows-2" };

/**
 * Fila (o dos) de elementos que se desliza de lado, en lugar de una rejilla que crece hacia abajo.
 * En el celular se desliza con el dedo; en pantallas con mouse aparecen flechas. Los bordes se
 * difuminan solo del lado donde aún hay más. Al abrirse, deja a la vista el elemento marcado con
 * `aria-pressed="true"`. Con teclado se avanza de elemento en elemento (cada uno es un botón).
 */
export function Carrusel({
  etiqueta,
  filas = 1,
  children,
  className,
}: {
  etiqueta: string;
  filas?: 1 | 2;
  children: ReactNode;
  className?: string;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ izquierda: false, derecha: false });

  const medir = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    const nuevo = bordesDeScroll(el.scrollLeft, el.clientWidth, el.scrollWidth);
    setBordes((b) => (b.izquierda === nuevo.izquierda && b.derecha === nuevo.derecha ? b : nuevo));
  }, []);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    medir();
    // Deja a la vista lo ya elegido sin mover la página ni el formulario de arriba/abajo.
    const elegido = el.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (elegido) {
      const izq = elegido.offsetLeft - (el.clientWidth - elegido.offsetWidth) / 2;
      el.scrollLeft = Math.max(izq, 0);
      medir();
    }
    const obs = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    obs?.observe(el);
    return () => obs?.disconnect();
  }, [medir, children]);

  function mover(direccion: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: reducido ? "auto" : "smooth" });
  }

  // Difumina solo el borde que tiene más contenido detrás.
  const izq = bordes.izquierda ? "transparent, #000 28px" : "#000, #000";
  const der = bordes.derecha ? "#000 calc(100% - 28px), transparent" : "#000, #000";
  const mascara = `linear-gradient(to right, ${izq}, ${der})`;

  return (
    <div className={cn("group/carrusel relative w-full min-w-0 max-w-full", className)}>
      <div
        ref={pista}
        role="group"
        aria-label={etiqueta}
        onScroll={medir}
        className="snap-x snap-proximity overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitMaskImage: mascara, maskImage: mascara }}
      >
        <div className={cn("grid w-max auto-cols-max grid-flow-col gap-x-2 gap-y-1.5 px-0.5", FILAS[filas])}>{children}</div>
      </div>

      {bordes.izquierda && (
        <button
          type="button"
          onClick={() => mover(-1)}
          aria-label={`${etiqueta}: ver anteriores`}
          className="absolute left-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-outline-variant bg-surface-container-lowest shadow-soft hover:bg-surface-container [@media(hover:hover)]:grid"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      )}
      {bordes.derecha && (
        <button
          type="button"
          onClick={() => mover(1)}
          aria-label={`${etiqueta}: ver más`}
          className="absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-outline-variant bg-surface-container-lowest shadow-soft hover:bg-surface-container [@media(hover:hover)]:grid"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
