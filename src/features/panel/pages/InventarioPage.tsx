import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Badge, Button, Chip, Skeleton } from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { STOCK_BAJO } from "@/lib/enums";
import { useCategorias, useProductos } from "@/features/catalogo/hooks";
import { NuevoProductoDrawer } from "../components/NuevoProductoDrawer";

export default function InventarioPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const categoria = params.get("categoria") ?? undefined;
  const nuevo = params.get("nuevo") === "1";
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const timer = useRef<number>();
  const productos = useProductos({ texto: busqueda || undefined, categoria, incluirInactivos: true });
  const categorias = useCategorias();

  function param(k: string, v?: string) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (v) n.set(k, v);
      else n.delete(k);
      return n;
    }, { replace: true });
  }

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  const lista = productos.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-marca text-headline-lg">Inventario</h1>
        <Button size="sm" onClick={() => param("nuevo", "1")}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo
        </Button>
      </div>
      <BarraBusqueda valor={texto} onChange={onTexto} placeholder="Buscar prenda o color" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Categorías">
        <Chip activo={!categoria} onClick={() => param("categoria")}>
          Todo
        </Chip>
        {categorias.data?.map((c) => (
          <Chip key={c.id} activo={categoria === c.id} onClick={() => param("categoria", c.id)}>
            {c.nombre}
          </Chip>
        ))}
      </div>

      {productos.isError ? (
        <EmptyState expresion="triste" titulo="Algo salió mal" texto={mensajeError(productos.error)} />
      ) : productos.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          expresion="curiosa"
          titulo={busqueda || categoria ? "Sin resultados" : "Tu inventario está vacío"}
          texto={busqueda || categoria ? "Prueba con otra búsqueda." : "Agrega tu primera prenda."}
        />
      ) : (
        <ul className="grid gap-2 md:grid-cols-2" style={{ opacity: productos.isPlaceholderData ? 0.6 : 1 }}>
          {lista.map((p) => (
            <li key={p.id}>
              <Link
                to={`/app/inventario/${p.id}`}
                className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-2.5 pr-3 shadow-soft hover:shadow-lift"
              >
                <PrendaImagen silueta={p.silueta} hex={p.colores[0].hex} alt="" className="w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label-lg">{p.nombre}</p>
                  <p className="tabular text-body-sm text-on-surface-variant">
                    {formatMXN(p.precio)} · {p.colores.length} {p.colores.length === 1 ? "color" : "colores"}
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    {!p.activo ? (
                      <Badge>Inactivo</Badge>
                    ) : p.disponibleTotal === 0 ? (
                      <Badge tono="danger">Agotado</Badge>
                    ) : p.disponibleTotal <= STOCK_BAJO ? (
                      <Badge tono="warning">Stock bajo</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular text-label-lg">{p.disponibleTotal}</p>
                  <p className="text-label-sm text-on-surface-variant">disp. de {p.stockFisicoTotal}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-outline" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nuevo && (
        <NuevoProductoDrawer
          open
          onClose={() => param("nuevo")}
          onCreado={(id) => navigate(`/app/inventario/${id}`, { replace: true })}
        />
      )}
    </div>
  );
}
