import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, Truck } from "lucide-react";
import type {
  ColorProducto,
  MetodoPago,
  ModalidadApartado,
  ProductoDetalle,
  SucursalId,
  VarianteDisponible,
} from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { Badge, Button, ButtonLink, Chip, Drawer, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { METODO_PAGO } from "@/lib/enums";
import { formatFecha, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { useConfig } from "@/features/catalogo/hooks";
import { useCotizacion, useCrearApartado } from "../hooks";

interface ComprarApartarDrawerProps {
  open: boolean;
  onClose: () => void;
  producto: ProductoDetalle;
  variante: VarianteDisponible;
  color: ColorProducto;
  /** Con qué opción abre (según el botón que tocó la clienta). */
  modalidadInicial: ModalidadApartado;
}

/**
 * Comprar de contado o apartar (con anticipo o sin él), sucursal de entrega y resumen de lo que
 * se paga hoy. Si la prenda no permite apartado (p. ej. oferta), solo ofrece la compra.
 */
export function ComprarApartarDrawer({
  open,
  onClose,
  producto,
  variante,
  color,
  modalidadInicial,
}: ComprarApartarDrawerProps) {
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const location = useLocation();
  const config = useConfig();
  const [modalidad, setModalidad] = useState<ModalidadApartado>(
    producto.permiteApartado ? modalidadInicial : "compra",
  );
  const [entrega, setEntrega] = useState<SucursalId>(
    variante.disponiblePorSucursal.temixco > 0 ? "temixco" : "azteca",
  );
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");

  const esClienta = sesion?.rol === "clienta";
  const compra = modalidad === "compra";
  const input = { varianteId: variante.id, cantidad: 1, modalidad, entrega, metodoAnticipo: metodo };
  const cot = useCotizacion(esClienta && open ? sesion.clientaId : undefined, input);
  const crear = useCrearApartado(sesion?.clientaId);

  function confirmar() {
    crear.mutate(input, {
      onSuccess: (a) => {
        onClose();
        navigate(`/tienda/apartados/${a.id}?nuevo=1`);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  const c = cot.data;
  const cfg = config.data;

  if (!esClienta) {
    return (
      <Drawer open={open} onClose={onClose} title="Entra para comprar o apartar">
        <p className="text-body-md text-on-surface-variant">
          Usa tu cuenta de Google o tu teléfono. Solo toma un momento y guardamos tus pedidos.
        </p>
        <ButtonLink
          to={`/entrar?volver=${encodeURIComponent(location.pathname + location.search)}`}
          className="mt-5"
          size="lg"
          fullWidth
        >
          Entrar
        </ButtonLink>
      </Drawer>
    );
  }

  const textoBoton = crear.isPending
    ? compra
      ? "Comprando…"
      : "Apartando…"
    : !c
      ? "Calculando…"
      : compra
        ? `Comprar y pagar ${formatMXN(c.anticipo)}`
        : c.anticipo > 0
          ? `Apartar y pagar ${formatMXN(c.anticipo)}`
          : "Apartar sin anticipo";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={compra ? "Comprar prenda" : "Apartar prenda"}
      pie={
        <Button
          size="lg"
          fullWidth
          variant={compra ? "tinta" : "primary"}
          loading={crear.isPending}
          disabled={!c || !c.sucursalOrigen}
          onClick={confirmar}
        >
          {textoBoton}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-3">
          <PrendaImagen silueta={producto.silueta} hex={color.hex} alt="" className="w-16 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="truncate text-label-lg">{producto.nombre}</p>
            <p className="text-body-sm text-on-surface-variant">
              {color.nombre} · Talla {variante.talla}
            </p>
            <p className="tabular mt-1 text-body-md font-semibold">{formatMXN(producto.precio)}</p>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-label-lg">¿Cómo la quieres?</legend>
          <div role="radiogroup" className="grid gap-2">
            <OpcionRadio
              activo={compra}
              onClick={() => setModalidad("compra")}
              titulo="Comprar de contado"
              detalle={`Pagas ${formatMXN(producto.precio)} y es tuya`}
            />
            {producto.permiteApartado ? (
              <>
                <OpcionRadio
                  activo={modalidad === "anticipo"}
                  onClick={() => setModalidad("anticipo")}
                  titulo={`Apartar con ${cfg?.anticipoPct ?? 50}%`}
                  detalle={`Te la guardamos ${cfg?.vigenciaConAnticipoDias ?? 15} días`}
                  extra={<Badge tono="primary">Popular</Badge>}
                />
                <OpcionRadio
                  activo={modalidad === "sin_anticipo"}
                  onClick={() => setModalidad("sin_anticipo")}
                  titulo="Apartar sin anticipo"
                  detalle={`Te la guardamos ${cfg?.vigenciaSinAnticipoDias ?? 2} días`}
                />
              </>
            ) : (
              <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
                Esta prenda está en oferta: solo se vende de contado.
              </p>
            )}
          </div>
        </fieldset>

        {modalidad !== "sin_anticipo" && (
          <fieldset>
            <legend className="mb-2 text-label-lg">{compra ? "Forma de pago" : "Pago del anticipo"}</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METODO_PAGO) as MetodoPago[]).map((m) => (
                <Chip key={m} activo={metodo === m} onClick={() => setMetodo(m)}>
                  {METODO_PAGO[m]}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-body-sm text-on-surface-variant">En la demo el pago se simula.</p>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-2 text-label-lg">¿Dónde la recoges?</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {cfg?.sucursales.map((s) => {
              const hay = variante.disponiblePorSucursal[s.id] > 0;
              return (
                <OpcionRadio
                  key={s.id}
                  activo={entrega === s.id}
                  onClick={() => setEntrega(s.id)}
                  titulo={s.nombre.replace("Boutique ", "")}
                  detalle={hay ? "Disponible ahí" : "Te la llevamos"}
                />
              );
            })}
          </div>
          {c?.requiereTraslado && (
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-info-container px-3 py-2.5 text-body-sm text-info">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              La traemos de la otra sucursal: estará lista el {formatFecha(c.listoEstimado)}.
            </p>
          )}
        </fieldset>

        <section aria-label="Resumen" className="rounded-2xl bg-surface-container-low p-4">
          {!c ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <dl className={cn("tabular flex flex-col gap-2 text-body-md", cot.isFetching && "opacity-60")}>
              <Fila t="Prenda" v={formatMXN(c.subtotal)} />
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
              {compra ? (
                <Fila t="Lista para recoger" v={c.requiereTraslado ? formatFecha(c.listoEstimado) : "Hoy mismo"} />
              ) : (
                <>
                  <Fila t="Restante" v={formatMXN(c.total - c.anticipo)} />
                  <Fila t="Te la guardamos hasta" v={formatFecha(c.venceEl)} />
                </>
              )}
            </dl>
          )}
        </section>

        {!compra && (
          <p className="text-body-sm text-on-surface-variant">
            Si el apartado vence sin liquidarse, la prenda regresa a la tienda y se suma un cargo de{" "}
            {formatMXN(cfg?.penalizacion ?? 30)} a tu siguiente compra o apartado.
          </p>
        )}
      </div>
    </Drawer>
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
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
          activo ? "border-primary" : "border-outline",
        )}
        aria-hidden
      >
        {activo && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label-lg">{titulo}</span>
        <span className="block text-body-sm text-on-surface-variant">{detalle}</span>
      </span>
      {extra}
    </button>
  );
}
