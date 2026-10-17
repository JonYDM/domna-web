import { useState } from "react";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/cn";
import { esClaro, tintar } from "@/lib/color";
import { urlMiniatura } from "@/lib/fotoPrenda";

interface FotoPrendaProps {
  /** Foto guardada de la prenda (la de 800). Sin ella se muestra un fondo con el color de la prenda. */
  url?: string;
  /** Color de la prenda: tiñe el fondo mientras no hay foto o si la foto no carga. */
  hex: string;
  alt: string;
  className?: string;
  /**
   * `mini` (por omisión) baja la versión de 400 px: es lo que se necesita en listas y tarjetas pequeñas.
   * `completa` baja la de 800 px, para cuando la foto es la protagonista.
   */
  tamano?: "mini" | "completa";
  /**
   * Para fotos grandes que cambian de ancho según la pantalla (rejilla de la tienda): con `sizes` el
   * navegador elige entre la de 400 y la de 800 según el ancho que realmente ocupa. Sustituye a `tamano`.
   */
  sizes?: string;
  /** La primera imagen visible no se difiere (LCP). */
  prioridad?: boolean;
}

/**
 * Foto de una prenda en proporción 3:4 (el contenedor tiene tamaño fijo, así que no hay saltos al cargar).
 * Solo se descarga cuando la tarjeta está por entrar en pantalla.
 */
export function FotoPrenda({ url, hex, alt, className, tamano = "mini", sizes, prioridad }: FotoPrendaProps) {
  // Se recuerda la URL que falló, así una foto nueva (otra URL) vuelve a intentarse.
  const [fallida, setFallida] = useState<string | null>(null);
  const adaptable = !!sizes && !!url && urlMiniatura(url) !== url;
  const src = tamano === "mini" && !sizes ? urlMiniatura(url) : url;
  const hayFoto = !!src && fallida !== src;

  return (
    <div
      className={cn("relative aspect-[3/4] overflow-hidden", className)}
      style={{ backgroundColor: hayFoto ? undefined : tintar(hex, esClaro(hex) ? 0.55 : 0.8) }}
    >
      {hayFoto ? (
        <img
          src={src}
          srcSet={adaptable ? `${urlMiniatura(url)} 400w, ${url} 800w` : undefined}
          sizes={adaptable ? sizes : undefined}
          alt={alt}
          loading={prioridad ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFallida(src)}
          className="h-full w-full bg-surface-container object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center" role={alt ? "img" : undefined} aria-label={alt || undefined}>
          <Shirt className={cn("h-1/3 w-1/3", esClaro(hex) ? "text-tinta/25" : "text-white/50")} aria-hidden />
        </span>
      )}
    </div>
  );
}
