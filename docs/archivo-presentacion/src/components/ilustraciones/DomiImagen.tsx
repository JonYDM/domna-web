import { cn } from "@/lib/cn";

/** Proporción de la imagen recortada (1189 × 969). */
const PROPORCION = 1189 / 969;

interface DomiImagenProps {
  /** Ancho en px; el alto se calcula para no causar saltos de layout. */
  ancho: number;
  /** Texto para lectores de pantalla. Si se omite, es decorativa. */
  alt?: string;
  /** true en la primera imagen visible de la pantalla (no se difiere). */
  prioridad?: boolean;
  animar?: boolean;
  className?: string;
}

/**
 * Domi oficial (ilustración de marca en WebP, 5 KB / 22 KB). El navegador elige el tamaño con
 * srcset según el ancho y la densidad de pantalla. Para expresiones (triste, dormida…) se usa el
 * componente <Domi> en SVG hasta tener esas poses como imagen.
 */
export function DomiImagen({ ancho, alt, prioridad = false, animar = false, className }: DomiImagenProps) {
  return (
    <img
      src="/domi-512.webp"
      srcSet="/domi-128.webp 128w, /domi-512.webp 512w"
      sizes={`${ancho}px`}
      width={ancho}
      height={Math.round(ancho / PROPORCION)}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn("select-none object-contain", animar && "domi-respira", className)}
    />
  );
}
