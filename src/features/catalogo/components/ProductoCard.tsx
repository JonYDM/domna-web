import { memo } from "react";
import { Link } from "react-router-dom";
import type { ProductoResumen } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { PrecioTag } from "@/components/molecules/PrecioTag";
import { Swatches } from "@/components/molecules/SelectorColor";
import { Badge } from "@/components/ui";
import { STOCK_BAJO } from "@/lib/enums";

interface ProductoCardProps {
  producto: ProductoResumen;
  /** Color a mostrar (p. ej. el del filtro activo). */
  colorId?: string;
  onPrefetch?: (id: string) => void;
  prioridad?: boolean;
  /** Ruta base del detalle. */
  base?: string;
}

/** Card de producto: la foto manda. Imagen 3:4, nombre, precio y swatches. */
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

  return (
    <Link
      to={`${base}/${p.id}${colorId ? `?color=${colorId}` : ""}`}
      onPointerEnter={() => onPrefetch?.(p.id)}
      onTouchStart={() => onPrefetch?.(p.id)}
      className="group flex flex-col gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <PrendaImagen
          silueta={p.silueta}
          hex={color.hex}
          url={p.imagenes.find((i) => i.colorId === color.id)?.url ?? p.imagenes[0]?.url}
          alt={`${p.nombre} en color ${color.nombre}`}
          prioridad={prioridad}
          className="transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {descuento > 0 && <Badge tono="primary">-{descuento}%</Badge>}
          {p.nuevo && !descuento && <Badge className="bg-surface-container-lowest text-on-surface">Nuevo</Badge>}
        </div>
        {agotado ? (
          <div className="absolute inset-0 grid place-items-center bg-surface/60">
            <Badge className="bg-tinta text-on-primary">Agotado</Badge>
          </div>
        ) : p.disponibleTotal <= STOCK_BAJO ? (
          <Badge tono="warning" className="absolute bottom-2.5 left-2.5">
            Quedan pocas
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 text-body-md text-on-surface">{p.nombre}</h3>
        <div className="flex items-center justify-between gap-2">
          <PrecioTag precio={p.precio} precioAntes={p.precioAntes} tamano="sm" />
          <Swatches colores={p.colores} />
        </div>
      </div>
    </Link>
  );
});
