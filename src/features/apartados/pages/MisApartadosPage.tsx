import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Chip } from "@/components/ui";
import { enCurso } from "@/lib/enums";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { useClienta, useMisApartados } from "../hooks";
import { ApartadoCard } from "../components/ApartadoCard";
import { ApartadoCardSkeleton } from "../components/ApartadoCardSkeleton";
import { AvisoUrgente } from "@/features/avisos/components/AvisoUrgente";

/** Compras y apartados de la clienta: "En curso" (por pagar o por recoger) e "Historial". */
export default function MisApartadosPage() {
  const { sesion, entrar } = useSesion();
  const clientaId = sesion?.rol === "clienta" ? sesion.clientaId : undefined;
  const apartados = useMisApartados(clientaId);
  const clienta = useClienta(clientaId);
  const [vista, setVista] = useState<"curso" | "historial">("curso");

  if (!clientaId) {
    return (
      <EmptyState
        expresion="feliz"
        titulo="Tus pedidos viven aquí"
        texto="Entra como clienta para ver lo que compraste o apartaste."
        accion={<Button onClick={() => entrar("clienta")}>Entrar como clienta</Button>}
      />
    );
  }

  const lista = apartados.data ?? [];
  const curso = lista.filter(enCurso);
  const historial = lista.filter((a) => !enCurso(a));
  const mostrados = vista === "curso" ? curso : historial;
  const activos = curso.filter((a) => a.estado === "activo");
  const saldoTotal = activos.reduce((n, a) => n + a.saldo, 0);
  const porRecoger = curso.length - activos.length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-marca text-headline-lg">Mis pedidos</h1>
        {curso.length > 0 && (
          <p className="tabular text-body-md text-on-surface-variant">
            {[
              activos.length ? `${activos.length} ${activos.length === 1 ? "apartado" : "apartados"} · saldo ${formatMXN(saldoTotal)}` : "",
              porRecoger ? `${porRecoger} por recoger` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      {!!clienta.data?.penalizacionPendiente && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-warning-container p-3.5 text-body-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Tienes un cargo de {formatMXN(clienta.data.penalizacionPendiente)} por un apartado que venció. Se sumará a tu
          siguiente compra o apartado.
        </p>
      )}

      <AvisoUrgente />

      <div className="flex gap-2">
        <Chip activo={vista === "curso"} onClick={() => setVista("curso")} contador={curso.length}>
          En curso
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
          expresion={vista === "curso" ? "enamorada" : "dormida"}
          titulo={vista === "curso" ? "Aún no tienes pedidos" : "Sin historial todavía"}
          texto={vista === "curso" ? "Esa prenda que te encantó te está esperando." : undefined}
          accion={vista === "curso" ? <ButtonLink to="/tienda">Ver catálogo</ButtonLink> : undefined}
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
