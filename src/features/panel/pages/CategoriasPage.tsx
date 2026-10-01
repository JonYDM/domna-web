import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import type { Categoria } from "@/types/api";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, Skeleton } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useCategorias } from "@/features/catalogo/hooks";
import { CategoriaDrawer } from "../components/CategoriaDrawer";

/** Categorías de la boutique, cada una con su juego de tallas. */
export default function CategoriasPage() {
  const categorias = useCategorias();
  const [editando, setEditando] = useState<Categoria | "nueva" | null>(null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-marca text-headline-lg">Categorías</h1>
          <p className="text-body-sm text-on-surface-variant">Cada una propone sus tallas al dar de alta una prenda.</p>
        </div>
        <Button size="sm" onClick={() => setEditando("nueva")}>
          <Plus className="h-4 w-4" aria-hidden />
          Nueva
        </Button>
      </div>

      {categorias.isError ? (
        <EmptyState expresion="triste" titulo="Algo salió mal" texto={mensajeError(categorias.error)} />
      ) : categorias.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : categorias.data.length === 0 ? (
        <EmptyState expresion="curiosa" titulo="Sin categorías" texto="Crea la primera para empezar a subir prendas." />
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {categorias.data.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3.5 shadow-soft">
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg">{c.nombre}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.tallas.map((t) => (
                    <span key={t} className="tabular rounded-md bg-surface-container px-1.5 py-0.5 text-label-sm text-on-surface-variant">
                      {t}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/app/inventario?categoria=${c.id}`}
                  className="mt-1.5 inline-flex items-center gap-0.5 text-body-sm text-on-surface-variant hover:text-on-surface"
                >
                  {c.productos} {c.productos === 1 ? "prenda" : "prendas"}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setEditando(c)}
                aria-label={`Editar ${c.nombre}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <CategoriaDrawer
          key={editando === "nueva" ? "nueva" : editando.id}
          categoria={editando === "nueva" ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
