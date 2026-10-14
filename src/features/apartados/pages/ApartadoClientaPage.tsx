import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ButtonLink, Skeleton } from "@/components/ui";
import { formatFecha, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useConfig } from "@/features/catalogo/hooks";
import { useApartado } from "../hooks";
import { DetalleApartado } from "../components/DetalleApartado";
import { PagoTransferencia } from "../components/PagoTransferencia";

export default function ApartadoClientaPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const nuevo = params.get("nuevo") === "1";
  const apartado = useApartado(id);
  const config = useConfig();

  if (apartado.isPending) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }
  if (apartado.isError) {
    return (
      <EmptyState
        expresion="triste"
        titulo="No encontramos ese apartado"
        texto={mensajeError(apartado.error)}
        accion={<ButtonLink to="/tienda/apartados">Mis apartados</ButtonLink>}
      />
    );
  }

  const a = apartado.data;
  const compra = a.modalidad === "compra";
  const pendiente = a.abonos.find((x) => x.estado === "pendiente");
  const volver = `/tienda/apartados?tipo=${compra ? "compras" : "apartados"}`;
  const sucursal = config.data?.sucursales.find((s) => s.id === a.entrega)?.nombre ?? "la boutique";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      {nuevo ? (
        <section className="relative flex flex-col items-center overflow-hidden rounded-3xl bg-primary-soft px-5 pb-6 pt-8 text-center">
          <div className="anim-pop">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-surface-container-lowest text-success shadow-soft">
              <CheckCircle2 className="h-10 w-10" aria-hidden />
            </span>
          </div>
          <h1 className="anim-sube mt-4 font-marca text-headline-lg" style={{ animationDelay: "250ms" }}>
            {pendiente ? "¡Pedido recibido!" : compra ? "¡Es tuya!" : "¡Apartado listo!"}
          </h1>
          <p className="anim-sube mt-1 text-body-md text-on-surface-variant" style={{ animationDelay: "350ms" }}>
            {pendiente ? (
              <>
                {pendiente.metodo === "transferencia" ? "Haz tu transferencia de " : "Paga "}
                <strong className="text-on-surface">{formatMXN(pendiente.monto)}</strong>
                {pendiente.metodo === "transferencia" ? (
                  <> antes del </>
                ) : (
                  <>
                    {" "}en <strong className="text-on-surface">{sucursal}</strong> antes del{" "}
                  </>
                )}
                <strong className="text-on-surface">{formatFecha(a.venceEl)}</strong>
              </>
            ) : compra ? (
              <>
                Recógela en <strong className="text-on-surface">{sucursal}</strong>{" "}
                {a.requiereTraslado ? `desde el ${formatFecha(a.listoEstimado)}` : "hoy mismo"}
              </>
            ) : (
              <>
                Te la guardamos hasta el <strong className="text-on-surface">{formatFecha(a.venceEl)}</strong>
              </>
            )}
          </p>
          <div
            className="anim-sube mt-4 rounded-2xl bg-surface-container-lowest px-5 py-3 shadow-soft"
            style={{ animationDelay: "450ms" }}
          >
            <p className="text-label-sm uppercase text-on-surface-variant">Tu folio</p>
            <p className="tabular font-marca text-headline-md tracking-wide">{a.folio}</p>
          </div>
          <p className="mt-4 max-w-xs text-body-sm text-on-surface-variant">
            {pendiente
              ? "Tu pedido queda reservado. Se confirma cuando la tienda reciba tu pago; menciona tu folio."
              : a.saldo > 0
                ? `Para abonar los ${formatMXN(a.saldo)} restantes, paga en tienda o por transferencia y menciona tu folio.`
                : "Muestra tu folio al recogerla."}
          </p>
        </section>
      ) : (
        <div>
          <Link
            to={volver}
            className="-ml-2 mb-2 inline-flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Mis pedidos
          </Link>
          <h1 className="tabular font-marca text-headline-lg">
            {compra ? "Compra" : "Apartado"} {a.folio}
          </h1>
        </div>
      )}

      <PagoTransferencia apartado={a} />

      <DetalleApartado apartado={a} config={config.data} />

      {nuevo && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink to={volver} variant="tinta" fullWidth>
            Ver mis pedidos
          </ButtonLink>
          <ButtonLink to="/tienda" variant="outline" fullWidth>
            Seguir viendo
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
