import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell, ChevronLeft, MessageCircle, Phone, Wallet } from "lucide-react";
import type { Apartado, MetodoPago } from "@/types/api";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Chip, Drawer, Input, Skeleton } from "@/components/ui";
import { METODO_PAGO, SIGUIENTE_ENTREGA } from "@/lib/enums";
import { formatFecha, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { diasHasta } from "@/lib/reloj";
import { useConfig } from "@/features/catalogo/hooks";
import { useApartado, useAvanzarEntrega, useCancelarApartado, useRegistrarAbono } from "@/features/apartados/hooks";
import { DetalleApartado } from "@/features/apartados/components/DetalleApartado";

export default function ApartadoDuenaPage() {
  const { id = "" } = useParams();
  const apartado = useApartado(id);
  const config = useConfig();
  const [abonando, setAbonando] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const cancelar = useCancelarApartado();
  const entrega = useAvanzarEntrega();

  if (apartado.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }
  if (apartado.isError) {
    return (
      <EmptyState
        expresion="triste"
        titulo="No encontramos ese apartado"
        texto={mensajeError(apartado.error)}
        accion={<ButtonLink to="/app/apartados">Ver apartados</ButtonLink>}
      />
    );
  }

  const a = apartado.data;
  const activo = a.estado === "activo";
  const siguiente = SIGUIENTE_ENTREGA[a.estadoEntrega];
  // Solo se entrega lo liquidado; los traslados se pueden mover desde que está apartado.
  const puedeEntrega =
    siguiente && a.estado !== "cancelado" && a.estado !== "vencido" && (siguiente.estado !== "entregado" || a.estado === "liquidado");
  const telefono = a.clientaTelefono.replace(/\D/g, "");
  const mensaje = encodeURIComponent(
    `¡Hola ${a.clientaNombre.split(" ")[0]}! Te escribimos de ${config.data?.nombre ?? "la boutique"}. Tu apartado ${a.folio} (${a.lineas[0].nombre}) tiene un saldo de ${formatMXN(a.saldo)} y vence el ${formatFecha(a.venceEl)}. 💕`,
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div>
          <Link
            to="/app/apartados"
            className="-ml-2 mb-2 inline-flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Pedidos
          </Link>
          <h1 className="tabular font-marca text-headline-lg">
            {a.modalidad === "compra" ? "Compra" : "Apartado"} {a.folio}
          </h1>
        </div>
        <DetalleApartado apartado={a} config={config.data} />
      </div>

      <aside className="flex flex-col gap-4 lg:pt-[76px]">
        <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
          <p className="text-label-sm uppercase text-on-surface-variant">Clienta</p>
          <p className="mt-1 text-label-lg">{a.clientaNombre}</p>
          <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {a.clientaTelefono}
          </p>
          {activo && (
            <>
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {diasHasta(a.venceEl) <= 3
                  ? "La clienta ya ve el aviso de vencimiento en su app."
                  : `Le avisaremos en su app 3 días antes de que venza (${formatFecha(a.venceEl)}).`}
              </p>
              <a
                href={`https://wa.me/52${telefono}?text=${mensaje}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl px-1 text-label-lg text-success hover:underline"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Escribirle por WhatsApp (opcional)
              </a>
            </>
          )}
        </section>

        <div className="flex flex-col gap-2">
          {activo && (
            <Button size="lg" onClick={() => setAbonando(true)}>
              <Wallet className="h-5 w-5" aria-hidden />
              Registrar abono
            </Button>
          )}
          {puedeEntrega && (
            <Button
              variant="tinta"
              loading={entrega.isPending}
              onClick={() =>
                entrega.mutate(
                  { id: a.id, siguiente: siguiente.estado },
                  { onSuccess: () => toast.success("Entrega actualizada"), onError: (e) => toast.error(mensajeError(e)) },
                )
              }
            >
              {siguiente.accion}
            </Button>
          )}
          {activo &&
            (confirmarCancelar ? (
              <div className="flex flex-col gap-2 rounded-2xl bg-error-container p-3">
                <p className="text-body-sm text-error">
                  La prenda regresa al inventario. El anticipo no se devuelve. ¿Cancelar el apartado?
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmarCancelar(false)}>
                    No
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    loading={cancelar.isPending}
                    onClick={() =>
                      cancelar.mutate(a.id, {
                        onSuccess: () => {
                          setConfirmarCancelar(false);
                          toast.success("Apartado cancelado");
                        },
                        onError: (e) => toast.error(mensajeError(e)),
                      })
                    }
                  >
                    Sí, cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmarCancelar(true)} className="text-error">
                Cancelar apartado
              </Button>
            ))}
        </div>
      </aside>

      {activo && <AbonoDrawer key={a.pagado} apartado={a} open={abonando} onClose={() => setAbonando(false)} />}
    </div>
  );
}

function AbonoDrawer({ apartado: a, open, onClose }: { apartado: Apartado; open: boolean; onClose: () => void }) {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const abonar = useRegistrarAbono();
  const n = Number(monto);
  const valido = n > 0 && n <= a.saldo;
  const liquida = n === a.saldo;

  function guardar() {
    abonar.mutate(
      { apartadoId: a.id, monto: n, metodo },
      {
        onSuccess: (r) => {
          onClose();
          toast.success(r.estado === "liquidado" ? `¡${a.folio} liquidado! 🎉` : `Abono de ${formatMXN(n)} registrado`);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar abono"
      descripcion={`${a.folio} · saldo ${formatMXN(a.saldo)}`}
      pie={
        <Button size="lg" fullWidth disabled={!valido} loading={abonar.isPending} onClick={guardar}>
          {liquida ? `Liquidar ${formatMXN(n)}` : valido ? `Registrar ${formatMXN(n)}` : "Registrar abono"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Monto"
          type="number"
          inputMode="decimal"
          min={1}
          max={a.saldo}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0"
          icono={<span className="text-body-lg">$</span>}
          error={monto && !valido ? `Debe ser entre $1 y ${formatMXN(a.saldo)}` : undefined}
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          <Chip activo={liquida} onClick={() => setMonto(String(a.saldo))}>
            Todo ({formatMXN(a.saldo)})
          </Chip>
          {[100, 200, 300].filter((x) => x < a.saldo).map((x) => (
            <Chip key={x} activo={n === x} onClick={() => setMonto(String(x))}>
              {formatMXN(x)}
            </Chip>
          ))}
        </div>
        <fieldset>
          <legend className="mb-2 text-label-lg">Método</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(METODO_PAGO) as MetodoPago[]).map((m) => (
              <Chip key={m} activo={metodo === m} onClick={() => setMetodo(m)}>
                {METODO_PAGO[m]}
              </Chip>
            ))}
          </div>
        </fieldset>
        {a.modalidad === "sin_anticipo" && !liquida && (
          <p className="rounded-xl bg-info-container px-3 py-2.5 text-body-sm text-info">
            Al abonar, el apartado pasa a la vigencia completa de 15 días.
          </p>
        )}
      </div>
    </Drawer>
  );
}
