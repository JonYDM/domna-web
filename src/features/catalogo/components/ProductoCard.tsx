import { memo } from "react";
import { Link } from "react-router-dom";
import type { ProductoResumen } from "@/types/api";
import { FotoPrenda } from "@/components/FotoPrenda";
import { fotoDeColor } from "@/lib/fotoPrenda";
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
 * Card de producto: la foto manda, en un marco de esquinas sutiles; debajo, nombre, precio y un
 * rastro de color. Las marcas (oferta / nuevo / de vuelta / agotado) son etiquetas pequeñas y
 * neutras, en texto normal, sobre la foto.
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
        <FotoPrenda
          hex={color.hex}
          url={fotoDeColor(p.imagenes, color.id)}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
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
              "absolute left-2 top-2 rounded-md bg-surface/90 px-1.5 py-0.5 text-label-md",
              etiqueta.clase,
            )}
          >
            {etiqueta.texto}
          </span>
        )}
        {agotado && (
          <div className="absolute inset-0 grid place-items-center bg-surface/55">
            <span className="rounded-md bg-surface/90 px-2.5 py-1 text-label-lg text-on-surface">Agotado</span>
          </div>
        )}
        {pocas && (
          <span className="absolute bottom-2 left-2 rounded-md bg-surface/90 px-1.5 py-0.5 text-label-md text-on-surface-variant">
            Últimas piezas
          </span>
        )}
      </div>

      {/* Pie: sobrio. Nombre, precio y un rastro de swatches. */}
      <div className="mt-2.5 flex flex-col gap-1">
        <h3 className="truncate text-body-md leading-tight text-on-surface">{p.nombre}</h3>
        <div className="flex items-baseline gap-2 tabular text-body-md">
          {p.precioAntes ? (
            <>
              <span className="font-medium text-on-surface">{formatMXN(p.precio)}</span>
              <span className="text-body-sm text-on-surface-variant line-through">{formatMXN(p.precioAntes)}</span>
            </>
          ) : (
            <span className="font-medium text-on-surface">{formatMXN(p.precio)}</span>
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
