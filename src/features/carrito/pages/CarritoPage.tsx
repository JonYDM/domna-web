import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import type { MetodoPago, ModalidadApartado, SucursalId } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Badge, Button, ButtonLink, Chip, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { METODO_PAGO } from "@/lib/enums";
import { formatFecha, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { useConfig } from "@/features/catalogo/hooks";
import { useCotizacion, useCrearApartado } from "@/features/apartados/hooks";
import { useCarrito } from "../carrito";

export default function CarritoPage() {
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const location = useLocation();
  const config = useConfig();
  const { lineas, piezas, soloContado, cambiarCantidad, quitar, limpiar } = useCarrito();

  const esClienta = sesion?.rol === "clienta";
  // Si hay ofertas (solo contado) en el carrito, se fuerza "comprar".
  const [modalidad, setModalidad] = useState<ModalidadApartado>("compra");
  const modalidadReal: ModalidadApartado = soloContado ? "compra" : modalidad;
  const compra = modalidadReal === "compra";
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");
  const [entrega, setEntrega] = useState<SucursalId>("temixco");

  const input = useMemo(
    () =>
      lineas.length
        ? {
            lineas: lineas.map((l) => ({ varianteId: l.varianteId, cantidad: l.cantidad })),
            modalidad: modalidadReal,
            entrega,
            metodoAnticipo: metodo,
          }
        : null,
    [lineas, modalidadReal, entrega, metodo],
  );

  const cot = useCotizacion(esClienta ? sesion.clientaId : undefined, input);
  const crear = useCrearApartado(sesion?.clientaId);
  const cfg = config.data;
  const c = cot.data;

  function confirmar() {
    if (!input) return;
    crear.mutate(input, {
      onSuccess: (a) => {
        limpiar();
        navigate(`/tienda/apartados/${a.id}?nuevo=1`);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  // ── Carrito vacío ──
  if (lineas.length === 0) {
    return (
      <EmptyState
        expresion="curiosa"
        titulo="Tu carrito está vacío"
        texto="Agrega prendas desde el catálogo y vuelve aquí para comprarlas o apartarlas juntas."
        accion={<ButtonLink to="/tienda">Ver catálogo</ButtonLink>}
      />
    );
  }

  return (
    <div className="pb-24 md:pb-0">
      <h1 className="mb-4 font-marca text-headline-lg">Tu carrito</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Líneas */}
        <ul className="flex flex-col gap-2">
          {lineas.map((l) => (
            <li key={l.varianteId} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-soft">
              <PrendaImagen silueta={l.silueta} hex={l.colorHex} alt="" className="w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg">{l.nombre}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {l.colorNombre} · Talla {l.talla}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="tabular text-body-md font-semibold">{formatMXN(l.precio)}</p>
                  {!l.permiteApartado && <Badge>Solo de contado</Badge>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => quitar(l.varianteId)}
                  className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
                  aria-label={`Quitar ${l.nombre}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
                <div className="flex items-center rounded-lg border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(l.varianteId, -1)}
                    className="grid h-8 w-8 place-items-center text-on-surface-variant"
                    aria-label={`Quitar uno de ${l.nombre}`}
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="tabular w-6 text-center text-label-md">{l.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(l.varianteId, 1)}
                    className="grid h-8 w-8 place-items-center text-on-surface-variant"
                    aria-label={`Agregar uno de ${l.nombre}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
          <button
            type="button"
            onClick={limpiar}
            className="mt-1 w-fit text-label-md text-on-surface-variant hover:text-error hover:underline"
          >
            Vaciar carrito
          </button>
        </ul>

        {/* Resumen y opciones del pedido */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          {!esClienta ? (
            <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <p className="text-body-md text-on-surface-variant">
                Entra a tu cuenta para comprar o apartar tu carrito. Lo guardamos mientras tanto.
              </p>
              <ButtonLink
                to={`/entrar?volver=${encodeURIComponent(location.pathname)}`}
                className="mt-4"
                size="lg"
                fullWidth
              >
                Entrar
              </ButtonLink>
            </section>
          ) : (
            <>
              <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
                <h2 className="mb-2 text-label-lg">¿Cómo quieres todo el pedido?</h2>
                {soloContado ? (
                  <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
                    Tu carrito trae una prenda en oferta, así que el pedido se compra de contado.
                  </p>
                ) : (
                  <div role="radiogroup" className="grid gap-2">
                    <OpcionRadio activo={modalidad === "compra"} onClick={() => setModalidad("compra")} titulo="Comprar de contado" detalle="Pagas el total y es tuyo" />
                    <OpcionRadio activo={modalidad === "anticipo"} onClick={() => setModalidad("anticipo")} titulo={`Apartar con ${cfg?.anticipoPct ?? 50}%`} detalle={`Te lo guardamos ${cfg?.vigenciaConAnticipoDias ?? 15} días`} extra={<Badge tono="primary">Popular</Badge>} />
                    <OpcionRadio activo={modalidad === "sin_anticipo"} onClick={() => setModalidad("sin_anticipo")} titulo="Apartar sin anticipo" detalle={`Te lo guardamos ${cfg?.vigenciaSinAnticipoDias ?? 2} días`} />
                  </div>
                )}
              </section>

              {modalidadReal !== "sin_anticipo" && (
                <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
                  <h2 className="mb-2 text-label-lg">{compra ? "Forma de pago" : "Pago del anticipo"}</h2>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(METODO_PAGO) as MetodoPago[]).map((m) => (
                      <Chip key={m} activo={metodo === m} onClick={() => setMetodo(m)}>
                        {METODO_PAGO[m]}
                      </Chip>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
                <h2 className="mb-2 text-label-lg">¿Dónde lo recoges?</h2>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  {cfg?.sucursales.map((s) => (
                    <OpcionRadio key={s.id} activo={entrega === s.id} onClick={() => setEntrega(s.id)} titulo={s.nombre.replace("Boutique ", "")} detalle="" />
                  ))}
                </div>
                {c?.requiereTraslado && (
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-info-container px-3 py-2.5 text-body-sm text-info">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    Algo viene de la otra sucursal: estará listo el {formatFecha(c.listoEstimado)}.
                  </p>
                )}
              </section>

              <section aria-label="Resumen" className="rounded-2xl bg-surface-container-low p-4">
                {!c ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <dl className={cn("tabular flex flex-col gap-2 text-body-md", cot.isFetching && "opacity-60")}>
                    <Fila t={`Prendas (${piezas})`} v={formatMXN(c.subtotal)} />
                    {c.penalizacion > 0 && (
                      <div className="flex items-start justify-between gap-2 text-warning">
                        <dt className="flex items-start gap-1.5">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          Cargo por apartado vencido
                        </dt>
                        <dd>{formatMXN(c.penalizacion)}</dd>
                      </div>
                    )}
                    <Fila t="Total" v={formatMXN(c.total)} fuerte />
                    <div className="my-1 border-t border-outline-variant/70" />
                    <Fila t="Pagas hoy" v={formatMXN(c.anticipo)} fuerte />
                    {!compra && (
                      <>
                        <Fila t="Restante" v={formatMXN(c.total - c.anticipo)} />
                        <Fila t="Te lo guardamos hasta" v={formatFecha(c.venceEl)} />
                      </>
                    )}
                  </dl>
                )}
              </section>

              <Button
                size="lg"
                fullWidth
                variant={compra ? "tinta" : "primary"}
                loading={crear.isPending}
                disabled={!c || !c.sucursalOrigen}
                onClick={confirmar}
              >
                {!c
                  ? "Calculando…"
                  : !c.sucursalOrigen
                    ? "Sin stock suficiente"
                    : compra
                      ? `Comprar y pagar ${formatMXN(c.anticipo)}`
                      : c.anticipo > 0
                        ? `Apartar y pagar ${formatMXN(c.anticipo)}`
                        : "Apartar sin anticipo"}
              </Button>

              {!compra && (
                <p className="text-body-sm text-on-surface-variant">
                  Si el apartado vence sin liquidarse, las prendas regresan a la tienda y se suma un cargo de{" "}
                  {formatMXN(cfg?.penalizacion ?? 30)} a tu siguiente compra o apartado.
                </p>
              )}
            </>
          )}
        </aside>
      </div>

      <div className="mt-6">
        <Link to="/tienda" className="inline-flex items-center gap-1.5 text-label-lg text-primary-strong hover:underline">
          <ShoppingBag className="h-4 w-4" aria-hidden />
          Seguir viendo el catálogo
        </Link>
      </div>
    </div>
  );
}

function Fila({ t, v, fuerte }: { t: string; v: string; fuerte?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-2", fuerte ? "font-semibold text-on-surface" : "text-on-surface-variant")}>
      <dt>{t}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function OpcionRadio({
  activo,
  onClick,
  titulo,
  detalle,
  extra,
}: {
  activo: boolean;
  onClick: () => void;
  titulo: string;
  detalle: string;
  extra?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
        activo ? "border-tinta bg-surface-container-low" : "border-outline-variant hover:border-outline",
      )}
    >
      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", activo ? "border-primary" : "border-outline")} aria-hidden>
        {activo && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label-lg">{titulo}</span>
        {detalle && <span className="block text-body-sm text-on-surface-variant">{detalle}</span>}
      </span>
      {extra}
    </button>
  );
}
