import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Chip } from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { useClienta, useMisApartados } from "../hooks";
import { ApartadoCard } from "../components/ApartadoCard";
import { ApartadoCardSkeleton } from "../components/ApartadoCardSkeleton";

export default function MisApartadosPage() {
  const { sesion, entrar } = useSesion();
  const clientaId = sesion?.rol === "clienta" ? sesion.clientaId : undefined;
  const apartados = useMisApartados(clientaId);
  const clienta = useClienta(clientaId);
  const [vista, setVista] = useState<"activos" | "historial">("activos");

  if (!clientaId) {
    return (
      <EmptyState
        expresion="feliz"
        titulo="Tus apartados viven aquí"
        texto="Entra como clienta para ver lo que apartaste."
        accion={<Button onClick={() => entrar("clienta")}>Entrar como clienta</Button>}
      />
    );
  }

  const lista = apartados.data ?? [];
  const activos = lista.filter((a) => a.estado === "activo");
  const historial = lista.filter((a) => a.estado !== "activo");
  const mostrados = vista === "activos" ? activos : historial;
  const saldoTotal = activos.reduce((n, a) => n + a.saldo, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-marca text-headline-lg">Mis apartados</h1>
        {activos.length > 0 && (
          <p className="tabular text-body-md text-on-surface-variant">
            {activos.length} {activos.length === 1 ? "activo" : "activos"} · saldo {formatMXN(saldoTotal)}
          </p>
        )}
      </div>

      {!!clienta.data?.penalizacionPendiente && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-warning-container p-3.5 text-body-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Tienes un cargo de {formatMXN(clienta.data.penalizacionPendiente)} por un apartado que venció. Se sumará a tu
          siguiente apartado.
        </p>
      )}

      <div className="flex gap-2">
        <Chip activo={vista === "activos"} onClick={() => setVista("activos")} contador={activos.length}>
          Activos
        </Chip>
        <Chip activo={vista === "historial"} onClick={() => setVista("historial")} contador={historial.length}>
          Historial
        </Chip>
      </div>

      {apartados.isError ? (
        <EmptyState
          expresion="triste"
          titulo="Algo salió mal"
          texto={mensajeError(apartados.error)}
          accion={<Button onClick={() => apartados.refetch()}>Reintentar</Button>}
        />
      ) : apartados.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          <ApartadoCardSkeleton />
          <ApartadoCardSkeleton />
        </div>
      ) : mostrados.length === 0 ? (
        <EmptyState
          expresion={vista === "activos" ? "enamorada" : "dormida"}
          titulo={vista === "activos" ? "Aún no apartas nada" : "Sin historial todavía"}
          texto={vista === "activos" ? "Esa prenda que te encantó te está esperando." : undefined}
          accion={vista === "activos" ? <ButtonLink to="/tienda">Ver catálogo</ButtonLink> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {mostrados.map((a) => (
            <ApartadoCard key={a.id} apartado={a} to={`/tienda/apartados/${a.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
