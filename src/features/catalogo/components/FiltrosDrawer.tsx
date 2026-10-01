import type { FiltrosCatalogo, OrdenCatalogo } from "@/types/api";
import { Button, Chip, Drawer } from "@/components/ui";
import { cn } from "@/lib/cn";
import { FAMILIAS_COLOR, ORDEN_CATALOGO, TALLAS_NUMERICAS, TALLAS_ROPA } from "@/lib/enums";
import { esClaro } from "@/lib/color";
import { formatMXN } from "@/lib/format";
import { Check } from "lucide-react";

const PRECIOS = [400, 500, 650, 800];

interface FiltrosDrawerProps {
  open: boolean;
  onClose: () => void;
  filtros: FiltrosCatalogo;
  cambiar: (c: Record<string, string | number | undefined>) => void;
  total?: number;
}

/** Filtros del catálogo (talla, color, precio, orden). Escriben directo en la URL. */
export function FiltrosDrawer({ open, onClose, filtros, cambiar, total }: FiltrosDrawerProps) {
  const toggle = (k: string, v: string | number, actual?: string | number) =>
    cambiar({ [k]: actual === v ? undefined : v });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filtros"
      pie={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => cambiar({ talla: undefined, color: undefined, precioMax: undefined, orden: undefined })}
          >
            Limpiar
          </Button>
          <Button fullWidth variant="tinta" onClick={onClose}>
            Ver {total ?? ""} {total === 1 ? "prenda" : "prendas"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <section>
          <h3 className="mb-2.5 text-label-lg">Ordenar</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ORDEN_CATALOGO) as OrdenCatalogo[]).map((o) => (
              <Chip
                key={o}
                activo={(filtros.orden ?? "nuevos") === o}
                onClick={() => cambiar({ orden: o === "nuevos" ? undefined : o })}
              >
                {ORDEN_CATALOGO[o]}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-label-lg">Talla</h3>
          <div className="flex flex-wrap gap-2">
            {[...TALLAS_ROPA, ...TALLAS_NUMERICAS].map((t) => (
              <Chip key={t} activo={filtros.talla === t} onClick={() => toggle("talla", t, filtros.talla)} className="min-w-12 justify-center">
                {t}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">Solo verás prendas con esa talla disponible.</p>
        </section>

        <section>
          <h3 className="mb-2.5 text-label-lg">Color</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {FAMILIAS_COLOR.map((c) => {
              const activo = filtros.color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => toggle("color", c.id, filtros.color)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-body-sm transition-colors",
                    activo ? "border-tinta bg-surface-container-low" : "border-transparent hover:bg-surface-container-low",
                  )}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full border border-on-surface/10"
                    style={{ backgroundColor: c.hex }}
                  >
                    {activo && (
                      <Check className={cn("h-4 w-4", esClaro(c.hex) ? "text-on-surface" : "text-on-primary")} strokeWidth={3} aria-hidden />
                    )}
                  </span>
                  {c.nombre}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-label-lg">Precio</h3>
          <div className="flex flex-wrap gap-2">
            {PRECIOS.map((p) => (
              <Chip key={p} activo={filtros.precioMax === p} onClick={() => toggle("precioMax", p, filtros.precioMax)}>
                Hasta {formatMXN(p)}
              </Chip>
            ))}
          </div>
        </section>
      </div>
    </Drawer>
  );
}
