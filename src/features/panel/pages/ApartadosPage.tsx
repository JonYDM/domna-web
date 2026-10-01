import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { FiltroEstadoApartado } from "@/types/api";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, Chip } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useApartados } from "@/features/apartados/hooks";
import { ApartadoCard } from "@/features/apartados/components/ApartadoCard";
import { ApartadoCardSkeleton } from "@/features/apartados/components/ApartadoCardSkeleton";

const FILTROS: { id: FiltroEstadoApartado | "todos"; label: string }[] = [
  { id: "activo", label: "Activos" },
  { id: "por_vencer", label: "Por vencer" },
  { id: "liquidado", label: "Liquidados" },
  { id: "vencido", label: "Vencidos" },
  { id: "cancelado", label: "Cancelados" },
  { id: "todos", label: "Todos" },
];

export default function ApartadosPage() {
  const [params, setParams] = useSearchParams();
  const estado = (params.get("estado") ?? "activo") as FiltroEstadoApartado | "todos";
  const [texto, setTexto] = useState(params.get("q") ?? "");
  const [busqueda, setBusqueda] = useState(texto);
  const timer = useRef<number>();

  const apartados = useApartados(estado === "todos" ? undefined : estado, busqueda || undefined);

  function cambiarEstado(e: string) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("estado", e);
      return n;
    }, { replace: true });
  }

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  const lista = apartados.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-marca text-headline-lg">Apartados</h1>
      <BarraBusqueda valor={texto} onChange={onTexto} placeholder="Buscar por folio, clienta o prenda" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <Chip key={f.id} activo={estado === f.id} onClick={() => cambiarEstado(f.id)}>
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
          texto={busqueda ? `No hay apartados que coincidan con "${busqueda}".` : "No hay apartados en este estado."}
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
