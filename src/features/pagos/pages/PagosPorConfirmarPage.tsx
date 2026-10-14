import { useState } from "react";
import toast from "react-hot-toast";
import { Banknote, ChevronRight, Clock, CreditCard, Landmark, MapPin, Phone } from "lucide-react";
import type { Abono, Apartado, MetodoPago } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { DeslizarConfirmar } from "@/components/molecules/DeslizarConfirmar";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Badge, Button, Drawer, Skeleton, Textarea } from "@/components/ui";
import { METODO_PAGO } from "@/lib/enums";
import { mensajeError } from "@/lib/errores";
import { formatFecha, formatHace, formatMXN, plural, textoVencimiento } from "@/lib/format";
import { useConfirmarPago, usePorConfirmar, useRechazarPago } from "@/features/apartados/hooks";
import { useSesion } from "@/features/auth/sesion";
import { ComprobanteVisor } from "../components/ComprobanteVisor";

const ICONO_METODO: Record<MetodoPago, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: Landmark,
};

/** Qué debe hacer la cajera antes de confirmar, según cómo dijo la clienta que pagaría. */
const INSTRUCCION: Record<MetodoPago, (monto: string) => string> = {
  efectivo: (m) => `Cobra ${m} en efectivo en caja y entonces confirma.`,
  tarjeta: (m) => `Cobra ${m} con la terminal y entonces confirma.`,
  transferencia: (m) => `Verifica que ${m} ya llegó a la cuenta antes de confirmar.`,
};

const pendienteDe = (a: Apartado): Abono | undefined => a.abonos.find((x) => x.estado === "pendiente");

/**
 * Pedidos en línea con un pago que la clienta declaró y la tienda aún no confirma. La cajera ve
 * los de su sucursal; la dueña, todos. Al confirmar, el pedido aparece pagado en el portal de la clienta.
 */
export default function PagosPorConfirmarPage() {
  const { sesion } = useSesion();
  const cola = usePorConfirmar();
  const [abierto, setAbierto] = useState<string | null>(null);
  const seleccionado = cola.data?.find((a) => a.id === abierto) ?? null;
  const total = cola.data?.length ?? 0;
  const subtitulo = sesion?.rol === "cajera" ? "De los pedidos que se entregan en tu sucursal" : "De todas las sucursales";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header>
        <h1 className="font-marca text-headline-lg">Pagos por confirmar</h1>
        <p className="text-body-md text-on-surface-variant">{subtitulo}</p>
      </header>

      {cola.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : cola.isError ? (
        <EmptyState
          expresion="triste"
          titulo="No pudimos cargar los pagos"
          texto={mensajeError(cola.error)}
          accion={<Button onClick={() => cola.refetch()}>Reintentar</Button>}
        />
      ) : total === 0 ? (
        <EmptyState
          expresion="feliz"
          titulo="Todo al día"
          texto="Cuando una clienta haga un pedido en línea, su pago aparecerá aquí para que lo confirmes."
        />
      ) : (
        <>
          <p className="text-label-lg text-on-surface-variant" aria-live="polite">
            {total} {plural(total, "pedido por confirmar", "pedidos por confirmar")}
          </p>
          <ul className="flex flex-col gap-3">
            {cola.data.map((a) => (
              <li key={a.id}>
                <TarjetaPago apartado={a} onAbrir={() => setAbierto(a.id)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {seleccionado && <DetallePago key={seleccionado.id} apartado={seleccionado} onCerrar={() => setAbierto(null)} />}
    </div>
  );
}

function TarjetaPago({ apartado: a, onAbrir }: { apartado: Apartado; onAbrir: () => void }) {
  const pago = pendienteDe(a);
  if (!pago) return null;
  const Icono = ICONO_METODO[pago.metodo];
  const l = a.lineas[0];
  const sucursal = a.entrega === "temixco" ? "Temixco" : "La Azteca";

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-lowest p-3.5 text-left shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <PrendaImagen silueta={l.silueta} hex={l.colorHex} alt="" className="w-14 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="tabular text-label-md text-on-surface-variant">{a.folio}</span>
          <span className="text-body-sm text-on-surface-variant">{formatHace(pago.fecha)}</span>
        </span>
        <span className="block truncate text-label-lg">{a.clientaNombre}</span>
        <span className="block truncate text-body-sm text-on-surface-variant">
          {l.nombre}
          {a.lineas.length > 1 && ` y ${a.lineas.length - 1} más`} · {sucursal}
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <Badge tono="warning" icono={<Icono className="h-3.5 w-3.5" aria-hidden />}>
            {METODO_PAGO[pago.metodo]}
          </Badge>
          {pago.metodo === "transferencia" && (
            <Badge tono={pago.tieneComprobante ? "info" : "neutral"}>
              {pago.tieneComprobante ? "Con comprobante" : "Sin comprobante"}
            </Badge>
          )}
          <span className="tabular text-label-lg">{formatMXN(pago.monto)}</span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-outline" aria-hidden />
    </button>
  );
}

function DetallePago({ apartado: a, onCerrar }: { apartado: Apartado; onCerrar: () => void }) {
  const pago = pendienteDe(a);
  const confirmar = useConfirmarPago();
  const rechazar = useRechazarPago();
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  if (!pago) return null;
  const monto = formatMXN(pago.monto);
  const sucursal = a.entrega === "temixco" ? "Temixco" : "La Azteca";
  const motivoValido = motivo.trim().length >= 3;

  function alConfirmar() {
    if (!pago) return;
    confirmar.mutate(
      { apartadoId: a.id, abonoId: pago.id },
      {
        onSuccess: (r) => {
          onCerrar();
          toast.success(r.estado === "liquidado" ? `Pago confirmado · ${a.folio} pagado` : `Pago de ${monto} confirmado`);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  function alRechazar() {
    if (!pago) return;
    rechazar.mutate(
      { apartadoId: a.id, abonoId: pago.id, motivo: motivo.trim() },
      {
        onSuccess: () => {
          onCerrar();
          toast.success("Pago rechazado. La clienta verá el motivo.");
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <Drawer
      open
      onClose={onCerrar}
      title={`Confirmar pago ${a.folio}`}
      descripcion={`${a.clientaNombre} · ${monto}`}
      pie={
        rechazando ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setRechazando(false)} disabled={rechazar.isPending}>
              Volver
            </Button>
            <Button variant="danger" fullWidth disabled={!motivoValido} loading={rechazar.isPending} onClick={alRechazar}>
              Rechazar pago
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <DeslizarConfirmar
              etiqueta={`Desliza para confirmar ${monto}`}
              cargando={confirmar.isPending}
              onConfirmar={alConfirmar}
            />
            <Button variant="ghost" onClick={() => setRechazando(true)} disabled={confirmar.isPending} className="text-error">
              No encontré el pago
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-warning-container px-3 py-2.5 text-body-sm text-warning">
          {INSTRUCCION[pago.metodo](monto)}
        </p>

        {pago.metodo === "transferencia" &&
          (pago.tieneComprobante ? (
            <ComprobanteVisor apartadoId={a.id} abonoId={pago.id} />
          ) : (
            <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
              Aún no sube su comprobante. Puedes confirmar si ya viste el depósito en tu banca.
            </p>
          ))}

        <section className="flex flex-col gap-3">
          {a.lineas.map((l) => (
            <div key={l.varianteId} className="flex gap-3">
              <PrendaImagen silueta={l.silueta} hex={l.colorHex} alt="" className="w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="text-label-lg">{l.nombre}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {l.colorNombre} · Talla {l.talla}
                  {l.cantidad > 1 && ` · ${l.cantidad} piezas`}
                </p>
                <p className="tabular text-body-md font-semibold">{formatMXN(l.precio * l.cantidad)}</p>
              </div>
            </div>
          ))}
        </section>

        <dl className="tabular flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-3 text-body-md">
          <div className="flex justify-between text-on-surface-variant">
            <dt>Total del pedido</dt>
            <dd>{formatMXN(a.total)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Pago a confirmar ({METODO_PAGO[pago.metodo].toLowerCase()})</dt>
            <dd>{monto}</dd>
          </div>
          {a.saldo - pago.monto > 0 && (
            <div className="flex justify-between text-on-surface-variant">
              <dt>Quedará por pagar</dt>
              <dd>{formatMXN(a.saldo - pago.monto)}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-col gap-1.5 text-body-sm text-on-surface-variant">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {a.clientaNombre} · {a.clientaTelefono}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            Recoge en {sucursal}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            {textoVencimiento(a.venceEl)} · {formatFecha(a.venceEl)}
          </p>
        </div>

        {rechazando && (
          <Textarea
            label="¿Por qué rechazas el pago?"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. No llegó a la cuenta"
            maxLength={200}
            autoFocus
          />
        )}
      </div>
    </Drawer>
  );
}
