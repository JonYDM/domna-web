import { Banknote, Clock, Hourglass, MapPin, Truck, XCircle } from "lucide-react";
import type { Apartado, ConfigBoutique } from "@/types/api";
import { FotoPrenda } from "@/components/FotoPrenda";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ESTADO_ENTREGA, METODO_PAGO, MODALIDAD, estadoVisible } from "@/lib/enums";
import { formatFecha, formatFechaHora, formatMXN, textoVencimiento } from "@/lib/format";
import { diasHasta } from "@/lib/reloj";
import { ProgresoPago } from "./ProgresoPago";

const CONCEPTO = { anticipo: "Anticipo", abono: "Abono", liquidacion: "Liquidación", compra: "Pago completo" } as const;

/** Detalle de un apartado: prenda, pago, vigencia, entrega y abonos. Compartido clienta/dueña. */
export function DetalleApartado({
  apartado: a,
  config,
  vista = "clienta",
}: {
  apartado: Apartado;
  config?: ConfigBoutique;
  vista?: "clienta" | "duena";
}) {
  const activo = a.estado === "activo";
  const urgente = activo && diasHasta(a.venceEl) <= 3;
  const sucursal = config?.sucursales.find((s) => s.id === a.entrega);
  const entrega = ESTADO_ENTREGA[a.estadoEntrega];
  const porConfirmar = a.porConfirmar ?? 0;
  const pendiente = a.abonos.find((x) => x.estado === "pendiente");
  const rechazado = !pendiente ? [...a.abonos].reverse().find((x) => x.estado === "rechazado") : undefined;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        {a.lineas.map((l) => (
          <div key={l.varianteId} className="flex gap-3">
            <FotoPrenda hex={l.colorHex} url={l.imagenUrl} alt="" className="w-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-label-lg">{l.nombre}</p>
              <p className="text-body-sm text-on-surface-variant">
                {l.colorNombre} · Talla {l.talla}
              </p>
              <p className="tabular mt-1 text-body-md font-semibold">{formatMXN(l.precio)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tono={estadoVisible(a).tono}>{estadoVisible(a).label}</Badge>
                <Badge>{MODALIDAD[a.modalidad]}</Badge>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="text-label-lg">Pago</h2>
        <ProgresoPago pagado={a.pagado} total={a.total} />
        {activo && pendiente && (
          <p className="flex items-start gap-2 rounded-xl bg-warning-container px-3 py-2.5 text-body-sm text-warning">
            <Hourglass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {vista === "clienta" ? (
                <>
                  <strong>Tu pago de {formatMXN(pendiente.monto)} está por confirmar.</strong>{" "}
                  {pendiente.metodo === "transferencia"
                    ? "La tienda lo revisa y, en cuanto lo confirme, lo verás como pagado aquí."
                    : `Págalo en ${sucursal?.nombre ?? "la sucursal"} mencionando tu folio ${a.folio}; la cajera lo registra y lo verás como pagado aquí.`}
                </>
              ) : (
                <>
                  <strong>La clienta declaró un pago de {formatMXN(pendiente.monto)}</strong> ({METODO_PAGO[pendiente.metodo].toLowerCase()}).
                  Confírmalo en Pagos cuando lo recibas.
                </>
              )}
            </span>
          </p>
        )}
        {activo && rechazado && (
          <p className="flex items-start gap-2 rounded-xl bg-error-container px-3 py-2.5 text-body-sm text-error">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong>No pudimos confirmar tu pago de {formatMXN(rechazado.monto)}.</strong>
              {rechazado.motivoRechazo ? ` ${rechazado.motivoRechazo}.` : ""}{" "}
              {vista === "clienta" ? `Puedes pagarlo en tienda con tu folio ${a.folio}.` : ""}
            </span>
          </p>
        )}
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
          {porConfirmar > 0 && (
            <div className="flex justify-between text-on-surface-variant">
              <dt>Pago por confirmar</dt>
              <dd>{formatMXN(porConfirmar)}</dd>
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
            {a.abonos.map((ab) => {
              const estado = ab.estado ?? "confirmado";
              return (
                <li key={ab.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      estado === "confirmado" && "bg-success-container text-success",
                      estado === "pendiente" && "bg-warning-container text-warning",
                      estado === "rechazado" && "bg-error-container text-error",
                    )}
                  >
                    {estado === "pendiente" ? (
                      <Hourglass className="h-4 w-4" aria-hidden />
                    ) : estado === "rechazado" ? (
                      <XCircle className="h-4 w-4" aria-hidden />
                    ) : (
                      <Banknote className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block text-label-lg">
                      {CONCEPTO[ab.concepto]}
                      {estado === "pendiente" && <span className="ml-2 text-body-sm font-normal text-warning">Por confirmar</span>}
                      {estado === "rechazado" && <span className="ml-2 text-body-sm font-normal text-error">Rechazado</span>}
                    </span>
                    <span className="block text-body-sm text-on-surface-variant">
                      {METODO_PAGO[ab.metodo]} · {formatFechaHora(ab.fecha)}
                    </span>
                    {estado === "confirmado" && ab.revisadoPor && vista === "duena" && (
                      <span className="block text-body-sm text-on-surface-variant">Confirmó {ab.revisadoPor}</span>
                    )}
                  </span>
                  <span className={cn("tabular text-label-lg", estado === "rechazado" && "text-on-surface-variant line-through")}>
                    {formatMXN(ab.monto)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
