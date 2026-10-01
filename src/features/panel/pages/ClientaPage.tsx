import { Link, useParams } from "react-router-dom";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import {
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ButtonLink,
  Skeleton,
} from "@/components/ui";
import { formatFecha, formatHace, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useMisApartados } from "@/features/apartados/hooks";
import { ApartadoCard } from "@/features/apartados/components/ApartadoCard";
import { useClientaResumen } from "../hooks";
import { OrigenBadge } from "../components/OrigenBadge";

/** Ficha de una clienta: contacto, cómo llegó, números y sus pedidos. */
export default function ClientaPage() {
  const { id = "" } = useParams();
  const clienta = useClientaResumen(id);
  const pedidos = useMisApartados(id);

  if (clienta.isPending) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (clienta.isError) {
    return (
      <EmptyState
        expresion="triste"
        titulo="No encontramos a esa clienta"
        texto={mensajeError(clienta.error)}
        accion={<ButtonLink to="/app/clientas">Ver clientas</ButtonLink>}
      />
    );
  }

  const c = clienta.data;
  const tel = c.telefono.replace(/\D/g, "");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/app/clientas" />}>Clientas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage>{c.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Avatar nombre={c.nombre} className="h-14 w-14 text-headline-sm" />
          <div className="min-w-0">
            <h1 className="truncate font-marca text-headline-md">{c.nombre}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <OrigenBadge origen={c.origen} />
              <span className="text-body-sm text-on-surface-variant">Desde el {formatFecha(c.creada)}</span>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-2 text-body-md">
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" aria-hidden />
            {c.telefono || <span className="text-on-surface-variant">Aún no captura su WhatsApp</span>}
          </li>
          {c.email && (
            <li className="flex min-w-0 items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{c.email}</span>
            </li>
          )}
          <li className="text-body-sm text-on-surface-variant">
            {c.ultimoAcceso ? `Último acceso a la app: ${formatHace(c.ultimoAcceso).toLowerCase()}` : "Nunca ha entrado a la app"}
          </li>
        </ul>
        {tel && (
          <a
            href={`https://wa.me/52${tel}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-success-container px-3.5 text-label-lg text-success hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Escribirle por WhatsApp
          </a>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato titulo="Comprado" valor={formatMXN(c.totalComprado)} />
        <Dato titulo="Por pagar" valor={formatMXN(c.saldoPendiente)} />
        <Dato titulo="Apartados activos" valor={String(c.apartadosActivos)} />
        <Dato titulo="Cargo pendiente" valor={formatMXN(c.penalizacionPendiente)} alerta={c.penalizacionPendiente > 0} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-label-lg">Pedidos ({c.pedidos})</h2>
        {pedidos.isPending ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : !pedidos.data?.length ? (
          <EmptyState expresion="dormida" titulo="Sin pedidos todavía" texto="Cuando compre o aparte, aparecerá aquí." className="py-6" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pedidos.data.map((a) => (
              <ApartadoCard key={a.id} apartado={a} to={`/app/apartados/${a.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Dato({ titulo, valor, alerta }: { titulo: string; valor: string; alerta?: boolean }) {
  return (
    <div className={alerta ? "rounded-2xl bg-warning-container p-3.5" : "rounded-2xl bg-surface-container-lowest p-3.5 shadow-soft"}>
      <p className={alerta ? "text-label-md text-warning" : "text-label-md text-on-surface-variant"}>{titulo}</p>
      <p className="tabular mt-0.5 text-headline-sm">{valor}</p>
    </div>
  );
}
