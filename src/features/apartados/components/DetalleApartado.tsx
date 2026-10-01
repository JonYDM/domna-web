import { Banknote, Clock, MapPin, Truck } from "lucide-react";
import type { Apartado, ConfigBoutique } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ESTADO_APARTADO, ESTADO_ENTREGA, METODO_PAGO, MODALIDAD } from "@/lib/enums";
import { formatFecha, formatFechaHora, formatMXN, textoVencimiento } from "@/lib/format";
import { diasHasta } from "@/lib/reloj";
import { ProgresoPago } from "./ProgresoPago";

const CONCEPTO = { anticipo: "Anticipo", abono: "Abono", liquidacion: "Liquidación" } as const;

/** Detalle de un apartado: prenda, pago, vigencia, entrega y abonos. Compartido clienta/dueña. */
export function DetalleApartado({ apartado: a, config }: { apartado: Apartado; config?: ConfigBoutique }) {
  const activo = a.estado === "activo";
  const urgente = activo && diasHasta(a.venceEl) <= 3;
  const sucursal = config?.sucursales.find((s) => s.id === a.entrega);
  const entrega = ESTADO_ENTREGA[a.estadoEntrega];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        {a.lineas.map((l) => (
          <div key={l.varianteId} className="flex gap-3">
            <PrendaImagen silueta={l.silueta} hex={l.colorHex} alt="" className="w-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-label-lg">{l.nombre}</p>
              <p className="text-body-sm text-on-surface-variant">
                {l.colorNombre} · Talla {l.talla}
              </p>
              <p className="tabular mt-1 text-body-md font-semibold">{formatMXN(l.precio)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tono={ESTADO_APARTADO[a.estado].tono}>{ESTADO_APARTADO[a.estado].label}</Badge>
                <Badge>{MODALIDAD[a.modalidad]}</Badge>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="text-label-lg">Pago</h2>
        <ProgresoPago pagado={a.pagado} total={a.total} />
        <dl className="tabular flex flex-col gap-1.5 text-body-md">
          <div className="flex justify-between text-on-surface-variant">
            <dt>Prenda</dt>
            <dd>{formatMXN(a.subtotal)}</dd>
          </div>
          {a.penalizacion > 0 && (
            <div className="flex justify-between text-warning">
              <dt>Cargo por apartado vencido</dt>
              <dd>{formatMXN(a.penalizacion)}</dd>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <dt>Saldo pendiente</dt>
            <dd>{formatMXN(a.saldo)}</dd>
          </div>
        </dl>
        {activo && (
          <p
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-body-sm",
              urgente ? "bg-warning-container text-warning" : "bg-surface-container-low text-on-surface-variant",
            )}
          >
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            {textoVencimiento(a.venceEl)} · {formatFecha(a.venceEl)}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2.5 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="text-label-lg">Entrega</h2>
        <p className="flex items-start gap-2 text-body-md">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            {sucursal?.nombre ?? a.entrega}
            {sucursal && <span className="block text-body-sm text-on-surface-variant">{sucursal.direccion}</span>}
          </span>
        </p>
        {a.estado !== "cancelado" && a.estado !== "vencido" && (
          <p className="flex items-center gap-2 text-body-md">
            <Truck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <Badge tono={entrega.tono}>{entrega.label}</Badge>
            {a.requiereTraslado && a.estadoEntrega !== "listo" && a.estadoEntrega !== "entregado" && (
              <span className="text-body-sm text-on-surface-variant">Lista el {formatFecha(a.listoEstimado)}</span>
            )}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="text-label-lg">Pagos registrados</h2>
        {a.abonos.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">Aún no hay pagos.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant/50">
            {a.abonos.map((ab) => (
              <li key={ab.id} className="flex items-center gap-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success-container text-success">
                  <Banknote className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-label-lg">{CONCEPTO[ab.concepto]}</span>
                  <span className="block text-body-sm text-on-surface-variant">
                    {METODO_PAGO[ab.metodo]} · {formatFechaHora(ab.fecha)}
                  </span>
                </span>
                <span className="tabular text-label-lg">{formatMXN(ab.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
