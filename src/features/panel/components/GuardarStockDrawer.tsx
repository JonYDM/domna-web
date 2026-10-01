import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { MotivoAjuste, SucursalId } from "@/types/api";
import { Button, Chip, Drawer } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface CambioVista {
  varianteId: string;
  sucursal: SucursalId;
  nuevo: number;
  antes: number;
  talla: string;
  colorNombre: string;
  colorHex: string;
  sucursalNombre: string;
  invalido: boolean;
}

const MOTIVOS: { id: Exclude<MotivoAjuste, "traspaso">; label: string; detalle: string }[] = [
  { id: "entrada", label: "Llegó mercancía", detalle: "Piezas nuevas de proveedor" },
  { id: "conteo", label: "Conteo físico", detalle: "Ajuste tras contar en tienda" },
  { id: "merma", label: "Prenda dañada o perdida", detalle: "Sale del inventario" },
  { id: "devolucion", label: "Devolución", detalle: "Una clienta la regresó" },
];

/** Motivo sugerido según los cambios: todo sube → entrada; todo baja → merma; mezcla → conteo. */
function sugerido(cambios: CambioVista[]): MotivoAjuste {
  const suben = cambios.every((c) => c.nuevo > c.antes);
  const bajan = cambios.every((c) => c.nuevo < c.antes);
  return suben ? "entrada" : bajan ? "merma" : "conteo";
}

interface Props {
  open: boolean;
  onClose: () => void;
  cambios: CambioVista[];
  reabastecera: boolean;
  guardando: boolean;
  onGuardar: (motivo: MotivoAjuste) => void;
}

/** Confirmar el borrador: resumen de cambios + motivo. */
export function GuardarStockDrawer({ open, onClose, cambios, reabastecera, guardando, onGuardar }: Props) {
  const [elegido, setElegido] = useState<MotivoAjuste | null>(null);
  const motivo = elegido ?? sugerido(cambios);
  const neto = cambios.reduce((n, c) => n + (c.nuevo - c.antes), 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Guardar cambios de stock"
      descripcion={`${cambios.length} ${cambios.length === 1 ? "cambio" : "cambios"} · ${neto >= 0 ? "+" : ""}${neto} piezas en total`}
      pie={
        <Button size="lg" fullWidth loading={guardando} onClick={() => onGuardar(motivo)}>
          Guardar cambios
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-label-lg">¿Por qué cambió?</legend>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <Chip key={m.id} activo={motivo === m.id} onClick={() => setElegido(m.id)} title={m.detalle}>
                {m.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">Queda en el historial del producto.</p>
        </fieldset>

        <section aria-label="Resumen">
          <h3 className="mb-1.5 text-label-lg">Resumen</h3>
          <ul className="flex flex-col divide-y divide-outline-variant/50 rounded-2xl border border-outline-variant/70">
            {cambios.map((c) => {
              const d = c.nuevo - c.antes;
              return (
                <li key={`${c.varianteId}-${c.sucursal}`} className="flex items-center gap-3 px-3 py-2.5 text-body-md">
                  <span className="h-4 w-4 shrink-0 rounded-full border border-on-surface/15" style={{ backgroundColor: c.colorHex }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {c.colorNombre} · <strong>{c.talla}</strong> · {c.sucursalNombre}
                  </span>
                  <span className="tabular text-on-surface-variant">
                    {c.antes} → {c.nuevo}
                  </span>
                  <span className={cn("tabular w-9 text-right text-label-lg", d > 0 ? "text-success" : "text-error")}>
                    {d > 0 ? `+${d}` : d}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {reabastecera && (
          <p className="flex items-start gap-2 rounded-xl bg-success-container px-3 py-2.5 text-body-sm text-success">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Una talla agotada vuelve a tener piezas: la prenda saldrá en “De vuelta en stock”.
          </p>
        )}
      </div>
    </Drawer>
  );
}
