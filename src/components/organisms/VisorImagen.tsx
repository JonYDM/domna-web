import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { urlGrande } from "@/lib/fotoPrenda";

interface VisorImagenProps {
  /** URLs de las imágenes a mostrar en grande. */
  imagenes: string[];
  /** Índice inicial. */
  indice: number;
  alt?: string;
  onClose: () => void;
}

/**
 * Lightbox editorial para ver una foto de producto en grande. PC: Esc, clic fuera, flechas del
 * teclado. Móvil: botón cerrar, swipe abajo para cerrar, swipe lateral para navegar. Fondo oscuro
 * con blur; la imagen respira con margen. Se monta en un portal para cubrir toda la pantalla.
 */
export function VisorImagen({ imagenes, indice, alt = "", onClose }: VisorImagenProps) {
  const [i, setI] = useState(indice);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const hayVarias = imagenes.length > 1;

  const anterior = useCallback(() => setI((n) => (n - 1 + imagenes.length) % imagenes.length), [imagenes.length]);
  const siguiente = useCallback(() => setI((n) => (n + 1) % imagenes.length), [imagenes.length]);

  // Teclado + bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hayVarias) anterior();
      else if (e.key === "ArrowRight" && hayVarias) siguiente();
    }
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, anterior, siguiente, hayVarias]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    inicio.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!inicio.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - inicio.current.x;
    const dy = t.clientY - inicio.current.y;
    inicio.current = null;
    if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx)) {
      onClose(); // swipe vertical → cerrar
    } else if (hayVarias && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) siguiente();
      else anterior(); // swipe lateral → navegar
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagen del producto"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/80 backdrop-blur-md anim-sube"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      {hayVarias && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); anterior(); }}
            aria-label="Anterior"
            className="absolute left-3 z-10 hidden h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:grid"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); siguiente(); }}
            aria-label="Siguiente"
            className="absolute right-3 z-10 hidden h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:grid"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </>
      )}

      <figure
        className="flex max-h-[90dvh] max-w-[92vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={imagenes[i]}
          src={urlGrande(imagenes[i])}
          onError={(e) => {
            // Si la versión grande no existe, se queda con la guardada.
            if (e.currentTarget.src !== imagenes[i]) e.currentTarget.src = imagenes[i];
          }}
          alt={alt}
          className="max-h-[90dvh] max-w-[92vw] rounded-[3px] object-contain shadow-float"
          draggable={false}
        />
      </figure>

      {hayVarias && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {imagenes.map((_, n) => (
            <span
              key={n}
              className={cn("h-1.5 rounded-full transition-all", n === i ? "w-5 bg-white" : "w-1.5 bg-white/40")}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
