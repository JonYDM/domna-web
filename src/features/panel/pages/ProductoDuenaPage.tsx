import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Store } from "lucide-react";
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

/** Ficha de producto de la dueña: resumen, visibilidad, apartado y stock por variante. */
export default function ProductoDuenaPage() {
  const { id = "" } = useParams();
  const producto = useProducto(id, { incluirInactivo: true });
  const categorias = useCategorias();
  const estado = useCambiarEstadoProducto();
  const permite = useCambiarPermiteApartado();

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
        accion={<ButtonLink to="/app/inventario">Inventario</ButtonLink>}
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
            <BreadcrumbLink render={<Link to="/app/inventario" />}>Inventario</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`/app/inventario?categoria=${p.categoriaId}`} />}>{categoria}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage>{p.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="rounded-2xl bg-surface-container-lowest shadow-soft">
        <div className="flex gap-4 p-4">
          <PrendaImagen
            silueta={p.silueta}
            hex={p.colores[0].hex}
            alt=""
            className={cn("w-24 shrink-0 rounded-xl sm:w-28", !p.activo && "opacity-50 grayscale")}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="min-w-0">
              <p className="text-label-sm uppercase text-on-surface-variant">{categoria}</p>
              <h1 className="line-clamp-3 font-marca text-headline-sm sm:text-headline-md">{p.nombre}</h1>
            </div>
            <div className="flex items-center justify-between gap-2">
              <PrecioTag precio={p.precio} precioAntes={p.precioAntes} />
              {/* Acciones de ícono */}
              <div className="-mr-2 flex shrink-0">
                {p.activo && (
                  <Link
                    to={`/tienda/producto/${p.id}`}
                    title="Ver en la tienda"
                    aria-label="Ver en la tienda"
                    className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <Store className="h-5 w-5" aria-hidden />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={alternarVisible}
                  disabled={estado.isPending}
                  title={p.activo ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                  aria-label={p.activo ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                  aria-pressed={!p.activo}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition-colors disabled:opacity-50",
                    p.activo
                      ? "text-on-surface-variant hover:bg-warning-container hover:text-warning"
                      : "bg-warning-container text-warning hover:brightness-95",
                  )}
                >
                  {p.activo ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
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
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-outline-variant/50 border-t border-outline-variant/50 text-center">
          <Cifra titulo="Disponibles" valor={disponibles} tono={disponibles === 0 ? "error" : undefined} />
          <Cifra titulo="Apartadas" valor={apartadas} />
          <Cifra titulo="En tiendas" valor={fisico} detalle={agotadas ? `${agotadas} agotadas` : undefined} />
        </dl>

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
    </div>
  );
}

function Cifra({ titulo, valor, detalle, tono }: { titulo: string; valor: number; detalle?: string; tono?: "error" }) {
  return (
    <div className="px-2 py-3">
      <dt className="text-label-sm uppercase text-on-surface-variant">{titulo}</dt>
      <dd className={cn("tabular text-headline-md", tono === "error" && "text-error")}>{valor}</dd>
      {detalle && <dd className="text-[11px] text-on-surface-variant">{detalle}</dd>}
    </div>
  );
}
