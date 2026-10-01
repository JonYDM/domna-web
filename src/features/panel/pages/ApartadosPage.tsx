import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Layers, ShoppingBag } from "lucide-react";
import type { FiltroEstadoApartado, TipoPedido } from "@/types/api";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, Chip, Segmentos } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useApartados } from "@/features/apartados/hooks";
import { ApartadoCard } from "@/features/apartados/components/ApartadoCard";
import { ApartadoCardSkeleton } from "@/features/apartados/components/ApartadoCardSkeleton";

type Vista = TipoPedido | "todo";
type Filtro = FiltroEstadoApartado | "todos";

/** Filtros por vista. El primero es el que abre por defecto. */
const FILTROS: Record<Vista, { id: Filtro; label: string }[]> = {
  apartados: [
    { id: "activo", label: "Activos" },
    { id: "por_vencer", label: "Por vencer" },
    { id: "por_entregar", label: "Por entregar" },
    { id: "liquidado", label: "Liquidados" },
    { id: "vencido", label: "Vencidos" },
    { id: "cancelado", label: "Cancelados" },
    { id: "todos", label: "Todos" },
  ],
  compras: [
    { id: "por_entregar", label: "Por entregar" },
    { id: "entregado", label: "Entregadas" },
    { id: "todos", label: "Todas" },
  ],
  todo: [
    { id: "todos", label: "Todos" },
    { id: "por_entregar", label: "Por entregar" },
    { id: "liquidado", label: "Pagados" },
    { id: "entregado", label: "Entregados" },
  ],
};

/** Pedidos de la dueña: pestañas Apartados | Compras | Todo y filtros por estado (todo en la URL). */
export default function ApartadosPage() {
  const [params, setParams] = useSearchParams();
  const vista = (["apartados", "compras", "todo"].includes(params.get("tipo") ?? "") ? params.get("tipo") : "apartados") as Vista;
  const filtros = FILTROS[vista];
  const pedido = params.get("estado") as Filtro | null;
  const estado = filtros.some((f) => f.id === pedido) ? pedido! : filtros[0].id;

  const [texto, setTexto] = useState(params.get("q") ?? "");
  const [busqueda, setBusqueda] = useState(texto);
  const timer = useRef<number>();

  const apartados = useApartados(
    estado === "todos" ? undefined : estado,
    busqueda || undefined,
    vista === "todo" ? undefined : vista,
  );
  // Contadores de pendientes en las pestañas (en el backend sería un endpoint de conteos).
  const activos = useApartados("activo", undefined, "apartados");
  const porEntregar = useApartados("por_entregar", undefined, "compras");

  function cambiar(cambios: Record<string, string | undefined>) {
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        for (const [k, v] of Object.entries(cambios)) {
          if (v) n.set(k, v);
          else n.delete(k);
        }
        return n;
      },
      { replace: true },
    );
  }

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  const lista = apartados.data ?? [];
  const nombreVista = vista === "apartados" ? "apartados" : vista === "compras" ? "compras" : "pedidos";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-marca text-headline-lg">Pedidos</h1>

      <Segmentos
        aria-label="Tipo de pedido"
        activo={vista}
        onChange={(v) => cambiar({ tipo: v, estado: undefined })}
        segmentos={[
          { id: "apartados", label: "Apartados", icono: ClipboardList, contador: activos.data?.length },
          { id: "compras", label: "Compras", icono: ShoppingBag, contador: porEntregar.data?.length },
          { id: "todo", label: "Todo", icono: Layers },
        ]}
      />

      <BarraBusqueda valor={texto} onChange={onTexto} placeholder="Folio, clienta o prenda" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Filtrar por estado">
        {filtros.map((f) => (
          <Chip key={f.id} activo={estado === f.id} onClick={() => cambiar({ estado: f.id })}>
            {f.label}
          </Chip>
        ))}
      </div>

      {apartados.isError ? (
        <EmptyState
          expresion="triste"
          titulo="Algo salió mal"
          texto={mensajeError(apartados.error)}
          accion={<Button onClick={() => apartados.refetch()}>Reintentar</Button>}
        />
      ) : apartados.isPending ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            <ApartadoCardSkeleton key={i} />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          expresion={busqueda ? "curiosa" : "dormida"}
          titulo={busqueda ? "Sin resultados" : "Nada por aquí"}
          texto={
            busqueda
              ? `No hay ${nombreVista} que coincidan con "${busqueda}".`
              : `No hay ${nombreVista} en este estado.`
          }
        />
      ) : (
        <div
          className="grid gap-3 transition-opacity md:grid-cols-2 lg:grid-cols-3"
          style={{ opacity: apartados.isPlaceholderData ? 0.6 : 1 }}
        >
          {lista.map((a) => (
            <ApartadoCard key={a.id} apartado={a} to={`/app/apartados/${a.id}`} mostrarClienta />
          ))}
        </div>
      )}
    </div>
  );
}
