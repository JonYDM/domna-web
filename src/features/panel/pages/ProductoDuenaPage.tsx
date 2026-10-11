import { Link, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Pencil, QrCode, Store } from "lucide-react";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PrecioTag } from "@/components/molecules/PrecioTag";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ButtonLink,
  Interruptor,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { mensajeError } from "@/lib/errores";
import { useCategorias, useProducto } from "@/features/catalogo/hooks";
import { useCambiarEstadoProducto, useCambiarPermiteApartado } from "../hooks";
import { EditorStock } from "../components/EditorStock";
import { EditarProductoDrawer } from "../components/EditarProductoDrawer";
import { EtiquetasQR } from "../components/EtiquetasQR";

/** Ficha de producto de la dueña: resumen, visibilidad, apartado y stock por variante. */
export default function ProductoDuenaPage() {
  const { id = "" } = useParams();
  const { pathname } = useLocation();
  // La cajera también abre fichas desde /caja; los enlaces respetan su base.
  const base = pathname.startsWith("/caja") ? "/caja" : "/app";
  const producto = useProducto(id, { incluirInactivo: true });
  const categorias = useCategorias();
  const estado = useCambiarEstadoProducto();
  const permite = useCambiarPermiteApartado();
  const [editando, setEditando] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);

  if (producto.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }
  if (producto.isError) {
    return (
      <EmptyState
        expresion="triste"
        titulo="No encontramos esa prenda"
        texto={mensajeError(producto.error)}
        accion={<ButtonLink to={`${base}/inventario`}>Inventario</ButtonLink>}
      />
    );
  }

  const p = producto.data;
  const categoria = categorias.data?.find((c) => c.id === p.categoriaId)?.nombre ?? "Categoría";
  const disponibles = p.variantes.reduce((n, v) => n + v.disponible, 0);
  const apartadas = p.variantes.reduce((n, v) => n + v.reservadoPorSucursal.temixco + v.reservadoPorSucursal.azteca, 0);
  const fisico = p.variantes.reduce((n, v) => n + v.stock.temixco + v.stock.azteca, 0);
  const agotadas = p.variantes.filter((v) => v.disponible === 0).length;

  function alternarVisible() {
    estado.mutate(
      { id: p.id, activo: !p.activo },
      {
        onSuccess: () => toast.success(p.activo ? "Prenda oculta de la tienda" : "Prenda visible en la tienda"),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`${base}/inventario`} />}>Inventario</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`${base}/inventario?categoria=${p.categoriaId}`} />}>{categoria}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage>{p.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft">
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <PrendaImagen
            silueta={p.silueta}
            hex={p.colores[0].hex}
            url={p.imagenes.find((i) => i.colorId === p.colores[0].id)?.url ?? p.imagenes[0]?.url}
            alt=""
            className={cn("w-32 shrink-0 rounded-xl sm:w-36", !p.activo && "opacity-50 grayscale")}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">{categoria}</p>
            <h1 className="mt-0.5 font-marca text-headline-md leading-tight">{p.nombre}</h1>
            <div className="mt-1.5">
              <PrecioTag precio={p.precio} precioAntes={p.precioAntes} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge
                tono={p.activo ? "success" : "warning"}
                icono={<span className={cn("h-1.5 w-1.5 rounded-full", p.activo ? "bg-success" : "bg-warning")} aria-hidden />}
              >
                {p.activo ? "Visible" : "Oculta"}
              </Badge>
              {p.nuevo && <Badge tono="primary">Nuevo</Badge>}
              {p.reabastecido && <Badge tono="success">De vuelta</Badge>}
              {!p.permiteApartado && <Badge>Solo de contado</Badge>}
            </div>

            {/* Acciones con etiqueta (no solo íconos sueltos). */}
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-tinta px-4 text-label-lg text-on-primary hover:bg-tinta-hover"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Editar
              </button>
              {p.activo && (
                <Link
                  to={`/tienda/producto/${p.id}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-outline-variant px-4 text-label-lg text-on-surface hover:bg-surface-container"
                >
                  <Store className="h-4 w-4" aria-hidden />
                  Ver en tienda
                </Link>
              )}
              <button
                type="button"
                onClick={() => setImprimiendo(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-outline-variant px-4 text-label-lg text-on-surface hover:bg-surface-container"
              >
                <QrCode className="h-4 w-4" aria-hidden />
                Códigos
              </button>
              <button
                type="button"
                onClick={alternarVisible}
                disabled={estado.isPending}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-outline-variant px-4 text-label-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              >
                {p.activo ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                {p.activo ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de existencias, sobrio (sin cajas de métricas con divisores). */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-outline-variant/50 px-4 py-3 text-body-sm">
          <span className={cn("tabular", disponibles === 0 && "text-error")}>
            <strong className="text-on-surface">{disponibles}</strong> <span className="text-on-surface-variant">disponibles</span>
          </span>
          <span className="tabular text-on-surface-variant"><strong className="text-on-surface">{apartadas}</strong> apartadas</span>
          <span className="tabular text-on-surface-variant"><strong className="text-on-surface">{fisico}</strong> en tiendas</span>
          {agotadas > 0 && <span className="tabular text-warning">{agotadas} agotadas</span>}
        </div>

        <div className="border-t border-outline-variant/50 p-4">
          <Interruptor
            checked={p.permiteApartado}
            disabled={permite.isPending}
            onChange={(v) =>
              permite.mutate(
                { id: p.id, permite: v },
                { onSuccess: () => toast.success(v ? "Ahora se puede apartar" : "Solo de contado") },
              )
            }
            label="Se puede apartar"
            descripcion={p.permiteApartado ? "La clienta puede comprarla o apartarla." : "Solo se vende de contado."}
          />
        </div>
      </section>

      <EditorStock key={p.id} producto={p} />

      <EditarProductoDrawer producto={p} open={editando} onClose={() => setEditando(false)} />

      {imprimiendo && <EtiquetasQR producto={p} onClose={() => setImprimiendo(false)} />}
    </div>
  );
}
