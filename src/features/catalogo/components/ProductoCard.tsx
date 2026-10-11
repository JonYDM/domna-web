import { memo } from "react";
import { Link } from "react-router-dom";
import type { ProductoResumen } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { Swatches } from "@/components/molecules/SelectorColor";
import { formatMXN } from "@/lib/format";
import { STOCK_BAJO } from "@/lib/enums";
import { cn } from "@/lib/cn";

interface ProductoCardProps {
  producto: ProductoResumen;
  /** Color a mostrar (p. ej. el del filtro activo). */
  colorId?: string;
  onPrefetch?: (id: string) => void;
  prioridad?: boolean;
  /** Ruta base del detalle. */
  base?: string;
}

/**
 * Card de producto, dirección editorial (boutique de lujo tipo Zara): la foto ocupa el protagonismo
 * en un marco de esquinas sutiles; debajo, tipografía fina y sparse (nombre, precio, un rastro de
 * color). Las marcas (Nuevo / oferta / agotado) son texto en versalitas con tracking, no píldoras.
 */
export const ProductoCard = memo(function ProductoCard({
  producto: p,
  colorId,
  onPrefetch,
  prioridad,
  base = "/tienda/producto",
}: ProductoCardProps) {
  const color = p.colores.find((c) => c.id === colorId) ?? p.colores[0];
  const agotado = p.disponibleTotal <= 0;
  const descuento = p.precioAntes ? Math.round((1 - p.precio / p.precioAntes) * 100) : 0;
  const pocas = !agotado && p.disponibleTotal <= STOCK_BAJO;

  // Una sola etiqueta de estado, en versalitas (prioridad: oferta → nuevo → de vuelta).
  const etiqueta = descuento > 0
    ? { texto: `−${descuento}%`, clase: "text-primary-strong" }
    : p.nuevo
      ? { texto: "Nuevo", clase: "text-on-surface" }
      : p.reabastecido
        ? { texto: "De vuelta", clase: "text-on-surface" }
        : null;

  return (
    <Link
      to={`${base}/${p.id}${colorId ? `?color=${colorId}` : ""}`}
      onPointerEnter={() => onPrefetch?.(p.id)}
      onTouchStart={() => onPrefetch?.(p.id)}
      className="group block focus-visible:outline-none"
    >
      {/* Foto: protagonista, marco de esquina sutil, zoom lento en hover. */}
      <div className="relative overflow-hidden rounded-[3px] bg-surface-container-low ring-1 ring-black/[0.03]">
        <PrendaImagen
          silueta={p.silueta}
          hex={color.hex}
          url={p.imagenes.find((i) => i.colorId === color.id)?.url ?? p.imagenes[0]?.url}
          alt={`${p.nombre} en color ${color.nombre}`}
          prioridad={prioridad}
          className={cn(
            "transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]",
            agotado && "opacity-85",
          )}
        />
        {etiqueta && (
          <span
            className={cn(
              "absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-[0.14em]",
              etiqueta.clase,
            )}
          >
            {etiqueta.texto}
          </span>
        )}
        {agotado && (
          <div className="absolute inset-0 grid place-items-center bg-surface/55">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface">Agotado</span>
          </div>
        )}
        {pocas && (
          <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Últimas piezas
          </span>
        )}
      </div>

      {/* Pie: sparse y fino. Nombre, precio discreto, un rastro de swatches. */}
      <div className="mt-3 flex flex-col gap-1">
        <h3 className="truncate text-[13px] leading-tight tracking-wide text-on-surface">{p.nombre}</h3>
        <div className="flex items-baseline gap-2 tabular text-[13px]">
          {p.precioAntes ? (
            <>
              <span className="text-on-surface">{formatMXN(p.precio)}</span>
              <span className="text-[11px] text-on-surface-variant line-through">{formatMXN(p.precioAntes)}</span>
            </>
          ) : (
            <span className="text-on-surface">{formatMXN(p.precio)}</span>
          )}
        </div>
        {p.colores.length > 1 && (
          <div className="mt-0.5">
            <Swatches colores={p.colores} />
          </div>
        )}
      </div>
    </Link>
  );
});
