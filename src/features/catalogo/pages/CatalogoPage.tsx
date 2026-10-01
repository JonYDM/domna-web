import { useRef, useState } from "react";
import { RefreshCw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Domi } from "@/components/ilustraciones/Domi";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, Chip } from "@/components/ui";
import { FAMILIAS_COLOR, ORDEN_CATALOGO } from "@/lib/enums";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useSesion } from "@/features/auth/sesion";
import { useCategorias, useConfig, usePrefetchProducto, useProductos } from "../hooks";
import { useFiltrosUrl } from "../useFiltrosUrl";
import { ProductoCard } from "../components/ProductoCard";
import { ProductoCardSkeleton } from "../components/ProductoCardSkeleton";
import { FiltrosDrawer } from "../components/FiltrosDrawer";
import { CarruselProductos } from "../components/CarruselProductos";
import { AvisoUrgente } from "@/features/avisos/components/AvisoUrgente";

export default function CatalogoPage() {
  const { sesion } = useSesion();
  const { filtros, cambiar, limpiar, activosDrawer, hayFiltros } = useFiltrosUrl();
  const [texto, setTexto] = useState(filtros.texto ?? "");
  const timer = useRef<number>();
  const [abierto, setAbierto] = useState(false);

  // Debounce de 300 ms: la búsqueda se escribe en la URL al dejar de teclear.
  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => cambiar({ q: v.trim() || undefined }), 300);
  }

  function limpiarTodo() {
    window.clearTimeout(timer.current);
    setTexto("");
    limpiar();
  }

  const productos = useProductos(filtros);
  // Carruseles de la portada (solo sin filtros). Se invalidan con "productos" al subir stock.
  const nuevos = useProductos({ seccion: "nuevos" });
  const reabastecidos = useProductos({ seccion: "reabastecidos" });
  const categorias = useCategorias();
  const config = useConfig();
  const prefetch = usePrefetchProducto();

  const pills: { key: string; label: string; quitar: () => void }[] = [];
  if (filtros.talla) pills.push({ key: "talla", label: `Talla ${filtros.talla}`, quitar: () => cambiar({ talla: undefined }) });
  if (filtros.color)
    pills.push({
      key: "color",
      label: FAMILIAS_COLOR.find((c) => c.id === filtros.color)?.nombre ?? filtros.color,
      quitar: () => cambiar({ color: undefined }),
    });
  if (filtros.precioMax)
    pills.push({ key: "precio", label: `Hasta ${formatMXN(filtros.precioMax)}`, quitar: () => cambiar({ precioMax: undefined }) });
  if (filtros.orden) pills.push({ key: "orden", label: ORDEN_CATALOGO[filtros.orden], quitar: () => cambiar({ orden: undefined }) });
  if (filtros.seccion)
    pills.push({
      key: "seccion",
      label: filtros.seccion === "nuevos" ? "Recién llegados" : "De vuelta en stock",
      quitar: () => cambiar({ seccion: undefined }),
    });

  const lista = productos.data ?? [];
  const dias = config.data?.diasNovedad ?? 7;

  return (
    <div className="flex flex-col gap-4">
      <AvisoUrgente />
      {!hayFiltros && (
        <section className="lunares relative overflow-hidden rounded-3xl bg-primary-soft px-5 py-5">
          <p className="text-label-sm uppercase text-primary-on-soft">
            {sesion?.rol === "clienta" ? `Hola, ${sesion.nombre}` : config.data?.nombre}
          </p>
          <h1 className="mt-1 max-w-[15rem] font-marca text-headline-lg text-on-surface sm:max-w-md">
            Cómprala hoy o apártala
          </h1>
          <p className="mt-1.5 max-w-[11rem] text-body-md text-on-surface-variant sm:max-w-md">
            Con el {config.data?.anticipoPct ?? 50}% te la guardamos {config.data?.vigenciaConAnticipoDias ?? 15} días.
          </p>
          <Domi size={92} expresion="guino" className="absolute -bottom-2 right-2" />
        </section>
      )}

      <BarraBusqueda valor={texto} onChange={onTexto} placeholder="Buscar vestidos, blusas, colores…" />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Categorías">
        <Chip activo={!filtros.categoria} onClick={() => cambiar({ categoria: undefined })}>
          Todo
        </Chip>
        {categorias.data?.filter((c) => c.productos > 0).map((c) => (
          <Chip
            key={c.id}
            activo={filtros.categoria === c.id}
            onClick={() => cambiar({ categoria: filtros.categoria === c.id ? undefined : c.id })}
          >
            {c.nombre}
          </Chip>
        ))}
      </div>

      {!hayFiltros && (
        <>
          <CarruselProductos
            titulo="Recién llegados"
            subtitulo={`Lo que entró en los últimos ${dias} días`}
            icono={<Sparkles className="h-5 w-5 text-primary" aria-hidden />}
            productos={nuevos.data}
            cargando={nuevos.isPending}
            verTodo="?seccion=nuevos"
            onPrefetch={prefetch}
          />
          <CarruselProductos
            titulo="De vuelta en stock"
            subtitulo="Se habían agotado y ya regresaron"
            icono={<RefreshCw className="h-5 w-5 text-primary" aria-hidden />}
            productos={reabastecidos.data}
            cargando={reabastecidos.isPending}
            verTodo="?seccion=reabastecidos"
            onPrefetch={prefetch}
          />
          <h2 className="-mb-1 mt-2 font-marca text-headline-md text-on-surface">Todo el catálogo</h2>
        </>
      )}

      {filtros.seccion && (
        <h1 className="font-marca text-headline-lg text-on-surface">
          {filtros.seccion === "nuevos" ? "Recién llegados" : "De vuelta en stock"}
        </h1>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setAbierto(true)} className="rounded-full">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filtros
          {activosDrawer > 0 && (
            <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-tinta px-1 text-[11px] text-on-primary">
              {activosDrawer}
            </span>
          )}
        </Button>
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={p.quitar}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-container px-3 text-label-md text-on-surface hover:bg-surface-container-high"
            aria-label={`Quitar filtro ${p.label}`}
          >
            {p.label}
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ))}
        <span className="ml-auto text-body-sm text-on-surface-variant" aria-live="polite">
          {productos.data ? `${lista.length} ${lista.length === 1 ? "prenda" : "prendas"}` : ""}
        </span>
      </div>

      {productos.isError ? (
        <EmptyState
          expresion="triste"
          titulo="Algo salió mal"
          texto={mensajeError(productos.error)}
          accion={<Button onClick={() => productos.refetch()}>Reintentar</Button>}
        />
      ) : productos.isPending ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductoCardSkeleton key={i} />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          expresion="curiosa"
          titulo={hayFiltros ? "Sin resultados" : "Aún no hay prendas"}
          texto={
            hayFiltros
              ? "No encontramos prendas con esos filtros. Prueba con otra talla o color."
              : "La boutique está preparando su catálogo."
          }
          accion={
            hayFiltros ? (
              <Button variant="outline" onClick={limpiarTodo}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className="grid grid-cols-2 gap-x-3 gap-y-6 transition-opacity md:grid-cols-3 md:gap-x-5 lg:grid-cols-4"
          style={{ opacity: productos.isPlaceholderData ? 0.6 : 1 }}
        >
          {lista.map((p, i) => (
            <ProductoCard
              key={p.id}
              producto={p}
              colorId={filtros.color ? p.colores.find((c) => c.familia === filtros.color)?.id : undefined}
              onPrefetch={prefetch}
              prioridad={i < 4}
            />
          ))}
        </div>
      )}

      <FiltrosDrawer
        open={abierto}
        onClose={() => setAbierto(false)}
        filtros={filtros}
        cambiar={cambiar}
        total={productos.data?.length}
        tallas={[...new Set((categorias.data ?? []).filter((c) => c.productos > 0).flatMap((c) => c.tallas))]}
      />
    </div>
  );
}
