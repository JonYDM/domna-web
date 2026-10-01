import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ClipboardList, ShoppingBag } from "lucide-react";
import type { TipoPedido } from "@/types/api";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Chip, Segmentos } from "@/components/ui";
import { enCurso } from "@/lib/enums";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { AvisoUrgente } from "@/features/avisos/components/AvisoUrgente";
import { useClienta, useMisApartados } from "../hooks";
import { ApartadoCard } from "../components/ApartadoCard";
import { ApartadoCardSkeleton } from "../components/ApartadoCardSkeleton";

type Etapa = "curso" | "historial";

/** Textos por pestaña: los apartados se pagan; las compras se recogen. */
const TEXTOS: Record<TipoPedido, { curso: string; historial: string; vacio: string; vacioTexto: string }> = {
  apartados: {
    curso: "En curso",
    historial: "Historial",
    vacio: "No tienes apartados",
    vacioTexto: "Aparta con el 50% y te la guardamos 15 días.",
  },
  compras: {
    curso: "Por recoger",
    historial: "Entregadas",
    vacio: "No tienes compras por recoger",
    vacioTexto: "Lo que compres de contado aparecerá aquí hasta que lo recojas.",
  },
};

/** Pedidos de la clienta: pestañas Apartados | Compras y, en cada una, En curso / Historial. */
export default function MisApartadosPage() {
  const { sesion, entrar } = useSesion();
  const clientaId = sesion?.rol === "clienta" ? sesion.clientaId : undefined;
  const apartados = useMisApartados(clientaId);
  const clienta = useClienta(clientaId);
  const [params, setParams] = useSearchParams();
  const tipo: TipoPedido = params.get("tipo") === "compras" ? "compras" : "apartados";
  const etapa: Etapa = params.get("etapa") === "historial" ? "historial" : "curso";

  function cambiar(cambios: { tipo?: TipoPedido; etapa?: Etapa }) {
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (cambios.tipo) {
          n.set("tipo", cambios.tipo);
          n.delete("etapa");
        }
        if (cambios.etapa) n.set("etapa", cambios.etapa);
        return n;
      },
      { replace: true },
    );
  }

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
  const delTipo = lista.filter((a) => (tipo === "compras") === (a.modalidad === "compra"));
  const curso = delTipo.filter(enCurso);
  const historial = delTipo.filter((a) => !enCurso(a));
  const mostrados = etapa === "curso" ? curso : historial;

  // Resumen y contadores de pendientes por pestaña.
  const activos = lista.filter((a) => a.modalidad !== "compra" && a.estado === "activo");
  const comprasPorRecoger = lista.filter((a) => a.modalidad === "compra" && enCurso(a)).length;
  const saldoTotal = activos.reduce((n, a) => n + a.saldo, 0);
  const t = TEXTOS[tipo];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-marca text-headline-lg">Mis pedidos</h1>
        {(activos.length > 0 || comprasPorRecoger > 0) && (
          <p className="tabular text-body-md text-on-surface-variant">
            {[
              activos.length ? `${activos.length} ${activos.length === 1 ? "apartado" : "apartados"} · saldo ${formatMXN(saldoTotal)}` : "",
              comprasPorRecoger ? `${comprasPorRecoger} ${comprasPorRecoger === 1 ? "compra" : "compras"} por recoger` : "",
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

      <Segmentos
        aria-label="Tipo de pedido"
        activo={tipo}
        onChange={(v) => cambiar({ tipo: v })}
        segmentos={[
          { id: "apartados", label: "Apartados", icono: ClipboardList, contador: activos.length },
          { id: "compras", label: "Compras", icono: ShoppingBag, contador: comprasPorRecoger },
        ]}
      />

      <div className="flex gap-2">
        <Chip activo={etapa === "curso"} onClick={() => cambiar({ etapa: "curso" })} contador={curso.length}>
          {t.curso}
        </Chip>
        <Chip activo={etapa === "historial"} onClick={() => cambiar({ etapa: "historial" })} contador={historial.length}>
          {t.historial}
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
          expresion={etapa === "curso" ? "enamorada" : "dormida"}
          titulo={etapa === "curso" ? t.vacio : "Sin historial todavía"}
          texto={etapa === "curso" ? t.vacioTexto : undefined}
          accion={etapa === "curso" ? <ButtonLink to="/tienda">Ver catálogo</ButtonLink> : undefined}
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
