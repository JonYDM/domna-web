import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Banknote, ChevronLeft, PackageCheck, Phone, Wallet } from "lucide-react";
import type { Apartado, EstadoEntrega, MetodoPago } from "@/types/api";
import { BotonWhatsApp } from "@/components/molecules/BotonWhatsApp";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Chip, Drawer, Input, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { METODO_PAGO } from "@/lib/enums";
import { formatFecha, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { accionPrincipal, siguienteEntrega, type AccionPrincipal } from "@/lib/accionPrincipalPedido";
import { useConfig } from "@/features/catalogo/hooks";
import { useApartado, useAvanzarEntrega, useCancelarApartado, useRegistrarAbono } from "@/features/apartados/hooks";
import { DetalleApartado } from "@/features/apartados/components/DetalleApartado";
import { useRegistrarFabSi } from "../fab";

const ICONO_ACCION = { "confirmar-pago": Wallet, abonar: Banknote, entrega: PackageCheck } as const;

export default function ApartadoDuenaPage() {
  const { id = "" } = useParams();
  const apartado = useApartado(id);
  const config = useConfig();
  const navigate = useNavigate();
  const [abonando, setAbonando] = useState(false);
  const [confirmandoEntrega, setConfirmandoEntrega] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const cancelar = useCancelarApartado();
  const entrega = useAvanzarEntrega();

  // La acción que más se necesita en este pedido flota al alcance del pulgar (en móvil); no hay que bajar
  // hasta el final de la página para cobrar o entregar.
  const principal = apartado.data ? accionPrincipal(apartado.data) : null;
  useRegistrarFabSi(
    principal && {
      label: principal.label,
      icono: ICONO_ACCION[principal.tipo],
      onClick: () => {
        if (principal.tipo === "confirmar-pago") navigate("/app/pagos");
        else if (principal.tipo === "abonar") setAbonando(true);
        else setConfirmandoEntrega(true);
      },
    },
  );

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
  const siguiente = siguienteEntrega(a);
  // En móvil el botón principal ya flota abajo; en el panel de la derecha solo se repite en pantallas anchas.
  const esPrincipal = (tipo: AccionPrincipal["tipo"]) => principal?.tipo === tipo;
  const nombreSucursal = (id: string) => config.data?.sucursales.find((s) => s.id === id)?.nombre ?? id;
  const telefono = a.clientaTelefono.replace(/\D/g, "");
  const mensaje =
    `¡Hola ${a.clientaNombre.split(" ")[0]}! Te escribimos de ${config.data?.nombre ?? "la boutique"}. Tu apartado ${a.folio} (${a.lineas[0].nombre}) tiene un saldo de ${formatMXN(a.saldo)} y vence el ${formatFecha(a.venceEl)}. 💕`;

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div>
          <Link
            to={`/app/apartados?tipo=${a.modalidad === "compra" ? "compras" : "apartados"}`}
            className="-ml-2 mb-2 inline-flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Pedidos
          </Link>
          <h1 className="tabular font-marca text-headline-lg">
            {a.modalidad === "compra" ? "Compra" : "Apartado"} {a.folio}
          </h1>
          {/* Quién es la clienta, con el teléfono a un toque y, si todavía debe, el recordatorio por WhatsApp. */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4">
            <span className="text-label-lg">{a.clientaNombre}</span>
            <a
              href={`tel:+52${telefono}`}
              className="inline-flex h-11 items-center gap-1.5 text-body-sm text-on-surface-variant hover:underline"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {a.clientaTelefono}
            </a>
            {activo && <BotonWhatsApp telefono={a.clientaTelefono} mensaje={mensaje} />}
          </div>
        </div>
        <DetalleApartado apartado={a} config={config.data} vista="duena" />
      </div>

      <aside className="flex flex-col gap-4 lg:pt-[122px]">
        <div className="flex flex-col gap-2">
          {activo && (a.porConfirmar ?? 0) > 0 && (
            <ButtonLink to="/app/pagos" size="lg" className={cn(esPrincipal("confirmar-pago") && "max-md:hidden")}>
              <Wallet className="h-5 w-5" aria-hidden />
              Confirmar el pago
            </ButtonLink>
          )}
          {activo && (a.porConfirmar ?? 0) === 0 && (
            <Button size="lg" onClick={() => setAbonando(true)} className={cn(esPrincipal("abonar") && "max-md:hidden")}>
              <Wallet className="h-5 w-5" aria-hidden />
              Registrar abono
            </Button>
          )}
          {siguiente && (
            <Button
              variant="tinta"
              className={cn(esPrincipal("entrega") && "max-md:hidden")}
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
      {principal?.tipo === "entrega" && (
        <ConfirmarEntregaDrawer
          apartado={a}
          siguiente={principal.siguiente}
          accion={principal.label}
          destino={nombreSucursal(a.entrega)}
          open={confirmandoEntrega}
          onClose={() => setConfirmandoEntrega(false)}
        />
      )}
    </div>
  );
}

const AYUDA_ENTREGA: Partial<Record<EstadoEntrega, (cliente: string, destino: string) => string>> = {
  en_traslado: (_c, destino) => `Márcalo cuando la pieza salga hacia ${destino}.`,
  listo: (_c, destino) => `Márcalo cuando la pieza llegue a ${destino}.`,
  entregado: (cliente) => `Hazlo cuando ${cliente} se lleve su pedido. Después ya no se puede cambiar.`,
};

/** Confirma el avance de la entrega desde el botón flotante: ahí es fácil tocar sin querer, y no hay marcha atrás. */
function ConfirmarEntregaDrawer({
  apartado: a,
  siguiente,
  accion,
  destino,
  open,
  onClose,
}: {
  apartado: Apartado;
  siguiente: EstadoEntrega;
  accion: string;
  destino: string;
  open: boolean;
  onClose: () => void;
}) {
  const entrega = useAvanzarEntrega();
  const piezas = a.lineas.reduce((n, l) => n + l.cantidad, 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={accion}
      descripcion={`${a.folio} · ${a.clientaNombre}`}
      pie={
        <Button
          size="lg"
          fullWidth
          loading={entrega.isPending}
          onClick={() =>
            entrega.mutate(
              { id: a.id, siguiente },
              {
                onSuccess: () => {
                  onClose();
                  toast.success("Entrega actualizada");
                },
                onError: (e) => toast.error(mensajeError(e)),
              },
            )
          }
        >
          {accion}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-body-md text-on-surface-variant">
          {AYUDA_ENTREGA[siguiente]?.(a.clientaNombre.split(" ")[0], destino)}
        </p>
        <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm">
          {a.lineas[0]?.nombre}
          {piezas > 1 ? ` y ${piezas - 1} más` : ""}
        </p>
      </div>
    </Drawer>
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
