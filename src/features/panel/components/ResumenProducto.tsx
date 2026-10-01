import { useState } from "react";
import { MapPin, Package } from "lucide-react";
import type { FamiliaColor, Silueta, SucursalId } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { PrecioTag } from "@/components/molecules/PrecioTag";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SILUETAS } from "@/lib/enums";
import { formatMXN } from "@/lib/format";

interface ResumenProductoProps {
  nombre: string;
  descripcion: string;
  categoria: string;
  silueta: Silueta;
  precio: number;
  colores: { nombre: string; hex: string; familia: FamiliaColor }[];
  tallas: string[];
  /** stock[talla][índice de color] */
  stock: Record<string, number[]>;
  totalPiezas: number;
  sucursal: SucursalId;
  permiteApartado: boolean;
  anticipoPct: number;
}

/** Vista previa del alta: cómo se verá en la tienda + resumen de lo que se va a publicar. */
export function ResumenProducto(p: ResumenProductoProps) {
  const [colorIdx, setColorIdx] = useState(0);
  const color = p.colores[colorIdx] ?? p.colores[0];
  const piezas = (t: string, ci?: number) =>
    ci === undefined ? p.colores.reduce((n, _, i) => n + (p.stock[t]?.[i] ?? 0), 0) : (p.stock[t]?.[ci] ?? 0);
  const piezasColor = (ci: number) => p.tallas.reduce((n, t) => n + piezas(t, ci), 0);
  const tipo = SILUETAS.find((s) => s.id === p.silueta)?.nombre;

  return (
    <section aria-label="Vista previa" className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-3">
      <p className="text-label-sm uppercase text-on-surface-variant">Así se verá en la tienda</p>

      <div className="flex gap-3">
        <PrendaImagen
          silueta={p.silueta}
          hex={color?.hex ?? "#D9C4A5"}
          alt={`Vista previa en ${color?.nombre ?? "color"}`}
          className="w-24 shrink-0 rounded-xl"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-body-sm text-on-surface-variant">
            {p.categoria}
            {tipo && ` · ${tipo}`}
          </p>
          <p className="line-clamp-2 font-marca text-headline-sm">{p.nombre.trim() || "Sin nombre"}</p>
          {p.precio > 0 ? (
            <PrecioTag precio={p.precio} tamano="sm" />
          ) : (
            <span className="text-body-sm text-on-surface-variant">Falta el precio</span>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tono="primary">Nuevo</Badge>
            {p.permiteApartado ? (
              <Badge tono="success">
                Se aparta con {p.precio > 0 ? formatMXN(Math.ceil((p.precio * p.anticipoPct) / 100)) : `${p.anticipoPct}%`}
              </Badge>
            ) : (
              <Badge>Solo de contado</Badge>
            )}
          </div>
        </div>
      </div>

      {p.descripcion.trim() && <p className="line-clamp-2 text-body-sm text-on-surface-variant">{p.descripcion.trim()}</p>}

      <div className="flex flex-col gap-1.5">
        <p className="text-label-md text-on-surface-variant">Colores (toca para ver la ilustración)</p>
        <div className="flex flex-wrap gap-1.5">
          {p.colores.map((c, i) => (
            <button
              key={c.nombre}
              type="button"
              onClick={() => setColorIdx(i)}
              aria-pressed={i === colorIdx}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border bg-surface-container-lowest pl-1.5 pr-2.5 text-body-sm",
                i === colorIdx ? "border-tinta" : "border-outline-variant",
              )}
            >
              <span className="h-5 w-5 rounded-full border border-on-surface/15" style={{ backgroundColor: c.hex }} aria-hidden />
              {c.nombre}
              <span className="tabular text-on-surface-variant">· {piezasColor(i)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-label-md text-on-surface-variant">Tallas y piezas</p>
        <div className="flex flex-wrap gap-1.5">
          {p.tallas.map((t) => {
            const n = piezas(t);
            return (
              <span
                key={t}
                className={cn(
                  "tabular inline-flex h-8 min-w-12 items-center justify-center gap-1 rounded-lg border px-2 text-label-md",
                  n > 0
                    ? "border-outline-variant bg-surface-container-lowest text-on-surface"
                    : "border-dashed border-outline-variant text-outline line-through",
                )}
                title={n > 0 ? `${n} piezas` : "Sin piezas: se verá agotada"}
              >
                {t}
                {n > 0 && <span className="font-normal text-on-surface-variant">{n}</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-outline-variant/60 pt-2.5 text-body-sm text-on-surface-variant">
        <span className="tabular inline-flex items-center gap-1.5">
          <Package className="h-4 w-4 text-primary" aria-hidden />
          {p.totalPiezas} {p.totalPiezas === 1 ? "pieza" : "piezas"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" aria-hidden />
          {p.sucursal === "temixco" ? "Temixco" : "La Azteca"}
        </span>
      </div>
    </section>
  );
}
