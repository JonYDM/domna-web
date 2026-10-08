import { useMemo, useState } from "react";
import type { SucursalId } from "@/types/api";
import { Badge, Button, Drawer, Skeleton } from "@/components/ui";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import { useProducto } from "@/features/catalogo/hooks";

/** Resultado de elegir una variante para el carrito. */
export interface SeleccionVariante {
  varianteId: string;
  productoId: string;
  nombre: string;
  precio: number;
  talla: string;
  colorNombre: string;
  colorHex: string;
}

/**
 * Elegir talla y color de un producto para agregarlo al carrito del POS.
 * Muestra el disponible en la sucursal de la caja (o en la otra, con aviso de traslado).
 */
export function ElegirVarianteDrawer({
  productoId,
  sucursal,
  onAgregar,
  onClose,
}: {
  productoId: string | null;
  sucursal: SucursalId;
  onAgregar: (sel: SeleccionVariante) => void;
  onClose: () => void;
}) {
  const detalle = useProducto(productoId ?? "", { incluirInactivo: true });
  const p = detalle.data;
  const [colorId, setColorId] = useState<string | null>(null);
  const [talla, setTalla] = useState<string | null>(null);

  // Color/talla por defecto al cargar.
  const colorActivo = colorId ?? p?.colores[0]?.id ?? null;

  const variante = useMemo(() => {
    if (!p || !colorActivo || !talla) return null;
    return p.variantes.find((v) => v.colorId === colorActivo && v.talla === talla) ?? null;
  }, [p, colorActivo, talla]);

  const dispVariante = variante?.disponible ?? 0;

  function agregar() {
    if (!p || !variante) return;
    const color = p.colores.find((c) => c.id === variante.colorId)!;
    onAgregar({
      varianteId: variante.id,
      productoId: p.id,
      nombre: p.nombre,
      precio: p.precio,
      talla: variante.talla,
      colorNombre: color.nombre,
      colorHex: color.hex,
    });
  }

  return (
    <Drawer
      open={!!productoId}
      onClose={onClose}
      title={p?.nombre ?? "Agregar al carrito"}
      descripcion={p ? formatMXN(p.precio) : undefined}
      pie={
        <Button size="lg" fullWidth disabled={!variante || dispVariante < 1} onClick={agregar}>
          {variante && dispVariante < 1 ? "Sin stock de esta talla" : "Agregar al carrito"}
        </Button>
      }
    >
      {detalle.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ) : !p ? (
        <p className="text-body-md text-on-surface-variant">No se pudo cargar la prenda.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <PrendaImagen
              silueta={p.silueta}
              hex={p.colores.find((c) => c.id === colorActivo)?.hex ?? p.colores[0].hex}
              alt=""
              className="w-16 shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <p className="truncate text-label-lg">{p.nombre}</p>
              <p className="tabular text-body-sm text-on-surface-variant">{formatMXN(p.precio)}</p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-label-lg">Color</legend>
            <div className="flex flex-wrap gap-2">
              {p.colores.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={colorActivo === c.id}
                  onClick={() => {
                    setColorId(c.id);
                    setTalla(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-body-sm",
                    colorActivo === c.id ? "border-tinta bg-surface-container-low" : "border-outline-variant",
                  )}
                >
                  <span className="h-4 w-4 rounded-full border border-on-surface/10" style={{ backgroundColor: c.hex }} aria-hidden />
                  {c.nombre}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-label-lg">Talla</legend>
            <div className="flex flex-wrap gap-2">
              {p.tallas.map((t) => {
                const v = p.variantes.find((x) => x.colorId === colorActivo && x.talla === t);
                const disp = v?.disponible ?? 0;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={talla === t}
                    disabled={disp < 1}
                    onClick={() => setTalla(t)}
                    className={cn(
                      "min-w-14 rounded-xl border px-3 py-2 text-center text-body-sm",
                      disp < 1 && "cursor-not-allowed text-on-surface-variant/40 line-through",
                      talla === t ? "border-tinta bg-surface-container-low" : "border-outline-variant",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {variante && (
            <p className="text-body-sm text-on-surface-variant">
              Disponible: <strong className="text-on-surface">{dispVariante}</strong>
              {variante.disponiblePorSucursal[sucursal] < 1 && dispVariante > 0 && (
                <Badge tono="info" className="ml-2">Viene de la otra sucursal</Badge>
              )}
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}
