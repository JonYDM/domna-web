import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ColorCatalogo } from "@/types/api";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, Skeleton } from "@/components/ui";
import { esClaro } from "@/lib/color";
import { cn } from "@/lib/cn";
import { FAMILIAS_COLOR } from "@/lib/enums";
import { mensajeError } from "@/lib/errores";
import { useColores } from "@/features/catalogo/hooks";
import { ColorDrawer } from "../components/ColorDrawer";

/** Colores del catálogo de la boutique, agrupados como los verá la clienta en el filtro. */
export default function ColoresPage() {
  const colores = useColores();
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<ColorCatalogo | "nuevo" | null>(null);

  const grupos = useMemo(() => {
    const t = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    const lista = (colores.data ?? []).filter(
      (c) => !t || c.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(t),
    );
    return FAMILIAS_COLOR.map((f) => ({ ...f, colores: lista.filter((c) => c.familia === f.id) })).filter((g) => g.colores.length);
  }, [colores.data, texto]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-marca text-headline-lg">Colores</h1>
          <p className="text-body-sm text-on-surface-variant">{colores.data?.length ?? 0} en tu catálogo</p>
        </div>
        <Button size="sm" onClick={() => setEditando("nuevo")}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo
        </Button>
      </div>

      <BarraBusqueda valor={texto} onChange={setTexto} placeholder="Buscar color" />

      {colores.isError ? (
        <EmptyState expresion="triste" titulo="Algo salió mal" texto={mensajeError(colores.error)} />
      ) : colores.isPending ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <EmptyState
          expresion="curiosa"
          titulo={texto ? "Sin resultados" : "Sin colores"}
          texto={texto ? `No hay colores que coincidan con "${texto}".` : "Agrega los colores que manejas."}
        />
      ) : (
        grupos.map((g) => (
          <section key={g.id} aria-label={g.nombre}>
            <h2 className="mb-2 flex items-center gap-2 text-label-md uppercase text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full border border-on-surface/15" style={{ backgroundColor: g.hex }} aria-hidden />
              {g.nombre} · {g.colores.length}
            </h2>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {g.colores.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setEditando(c)}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl bg-surface-container-lowest p-3 text-center shadow-soft hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <span
                      className={cn("h-11 w-11 rounded-full border", esClaro(c.hex) ? "border-outline-variant" : "border-transparent")}
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                    <span className="line-clamp-2 text-label-md">{c.nombre}</span>
                    <span className="tabular -mt-1 text-[11px] text-on-surface-variant">{c.hex}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {editando && (
        <ColorDrawer
          key={editando === "nuevo" ? "nuevo" : editando.id}
          color={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
