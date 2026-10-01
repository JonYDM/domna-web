import { useRouteError } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui";
import { EmptyState } from "@/components/molecules/EmptyState";
import { mensajeError } from "@/lib/errores";

/** 404 y errores inesperados del router, con Domi. */
export function PaginaError({ tipo }: { tipo: "404" | "error" }) {
  return (
    <main className="lunares grid min-h-dvh place-items-center bg-surface">
      {tipo === "404" ? (
        <EmptyState
          expresion="curiosa"
          titulo="Esta página no existe"
          texto="Domi buscó por todos lados y no la encontró."
          accion={<ButtonLink to="/">Volver al inicio</ButtonLink>}
        />
      ) : (
        <ErrorInesperado />
      )}
    </main>
  );
}

function ErrorInesperado() {
  const error = useRouteError();
  return (
    <EmptyState
      expresion="triste"
      titulo="Algo salió mal"
      texto={mensajeError(error)}
      accion={<Button onClick={() => window.location.assign("/")}>Volver al inicio</Button>}
    />
  );
}
