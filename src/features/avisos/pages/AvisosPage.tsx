import { CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Skeleton } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { useAvisos, useMarcarAvisosLeidos } from "../hooks";
import { AvisoItem } from "../components/AvisoItem";

/** Centro de avisos de la clienta: vencimientos, abonos, traslados y prendas listas. */
export default function AvisosPage() {
  const { sesion } = useSesion();
  const clientaId = sesion?.rol === "clienta" ? sesion.clientaId : undefined;
  const avisos = useAvisos(clientaId);
  const marcar = useMarcarAvisosLeidos(clientaId);

  if (!clientaId) {
    return (
      <EmptyState
        expresion="feliz"
        titulo="Tus avisos viven aquí"
        texto="Entra como clienta para ver tus recordatorios."
        accion={<ButtonLink to="/entrar?volver=/tienda/avisos">Entrar</ButtonLink>}
      />
    );
  }

  const lista = avisos.data ?? [];
  const sinLeer = lista.filter((a) => !a.leido);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-marca text-headline-lg">Avisos</h1>
          <p className="text-body-sm text-on-surface-variant">
            {sinLeer.length ? `${sinLeer.length} sin leer` : "Estás al día"}
          </p>
        </div>
        {sinLeer.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => marcar.mutate(sinLeer.map((a) => a.id))}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            Marcar todo como leído
          </Button>
        )}
      </div>

      {avisos.isError ? (
        <EmptyState
          expresion="triste"
          titulo="Algo salió mal"
          texto={mensajeError(avisos.error)}
          accion={<Button onClick={() => avisos.refetch()}>Reintentar</Button>}
        />
      ) : avisos.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          expresion="dormida"
          titulo="Sin avisos por ahora"
          texto="Aquí te avisaremos cuando un apartado esté por vencer o tu prenda esté lista."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((a) => (
            <li key={a.id}>
              <AvisoItem aviso={a} onAbrir={(id) => marcar.mutate([id])} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
