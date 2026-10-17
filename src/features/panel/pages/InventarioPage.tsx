import { useCallback, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { FotoPrenda } from "@/components/FotoPrenda";
import { fotoDeColor } from "@/lib/fotoPrenda";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Badge, Chip, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { STOCK_BAJO } from "@/lib/enums";
import { useCategorias, useProductos } from "@/features/catalogo/hooks";
import { useRegistrarFab } from "../fab";
import { NuevoProductoDrawer } from "../components/NuevoProductoDrawer";

export default function InventarioPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // La cajera también usa el inventario (/caja); los enlaces respetan su base.
  const base = pathname.startsWith("/caja") ? "/caja" : "/app";
  const categoria = params.get("categoria") ?? undefined;
  const soloInactivos = params.get("categoria") === "inactivos";
  const nuevo = params.get("nuevo") === "1";
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const timer = useRef<number>();
  const productos = useProductos({
    texto: busqueda || undefined,
    categoria: soloInactivos ? undefined : categoria,
    incluirInactivos: true,
  });
  const categorias = useCategorias();

  function param(k: string, v?: string) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (v) n.set(k, v);
      else n.delete(k);
      return n;
    }, { replace: true });
  }

  const abrirNuevo = useCallback(() => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("nuevo", "1");
      return n;
    }, { replace: true });
  }, [setParams]);
  useRegistrarFab("Nuevo", Plus, abrirNuevo);

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  const lista = (productos.data ?? []).filter((p) => (soloInactivos ? !p.activo : p.activo));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-marca text-headline-lg">Inventario</h1>
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
        <Chip activo={soloInactivos} onClick={() => param("categoria", "inactivos")}>
          Inactivos
        </Chip>
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
          titulo={soloInactivos ? "No tienes prendas inactivas" : busqueda || categoria ? "Sin resultados" : "Tu inventario está vacío"}
          texto={
            soloInactivos
              ? "Las prendas que ocultes de la tienda aparecerán aquí."
              : busqueda || categoria
                ? "Prueba con otra búsqueda."
                : "Agrega tu primera prenda."
          }
        />
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2" style={{ opacity: productos.isPlaceholderData ? 0.6 : 1 }}>
          {lista.map((p) => (
            <li key={p.id}>
              <Link
                to={`${base}/inventario/${p.id}`}
                className="flex gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="relative shrink-0">
                  <FotoPrenda
                    hex={p.colores[0].hex}
                    url={fotoDeColor(p.imagenes, p.colores[0].id)}
                    alt=""
                    className={cn("w-20 rounded-xl", !p.activo && "opacity-50 grayscale")}
                  />
                  {!p.activo && (
                    <span className="absolute left-1 top-1 rounded-full bg-tinta/85 px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-primary backdrop-blur">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate font-marca text-headline-sm leading-tight text-on-surface">{p.nombre}</p>

                  {/* Colores reales (swatches), no "N colores" en texto. */}
                  <div className="mt-1.5 flex items-center gap-1">
                    {p.colores.slice(0, 5).map((c) => (
                      <span
                        key={c.id}
                        className="h-4 w-4 shrink-0 rounded-full border border-on-surface/10"
                        style={{ backgroundColor: c.hex }}
                        title={c.nombre}
                      />
                    ))}
                    {p.colores.length > 5 && (
                      <span className="text-body-sm text-on-surface-variant">+{p.colores.length - 5}</span>
                    )}
                  </div>

                  {p.activo && (p.disponibleTotal === 0 || p.disponibleTotal <= STOCK_BAJO || p.nuevo || p.reabastecido) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.disponibleTotal === 0 ? (
                        <Badge tono="danger">Agotado</Badge>
                      ) : p.disponibleTotal <= STOCK_BAJO ? (
                        <Badge tono="warning">Stock bajo</Badge>
                      ) : null}
                      {p.nuevo && <Badge tono="primary">Nuevo</Badge>}
                      {p.reabastecido && <Badge tono="success">De vuelta</Badge>}
                    </div>
                  )}

                  <div className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
                    <span className="tabular text-label-lg text-on-surface">{formatMXN(p.precio)}</span>
                    <span className="tabular text-body-sm text-on-surface-variant">{p.disponibleTotal} disp.</span>
                  </div>
                </div>
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
