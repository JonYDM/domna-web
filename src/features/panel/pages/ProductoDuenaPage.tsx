import { Link, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Pencil, QrCode, Store } from "lucide-react";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PrecioTag } from "@/components/molecules/PrecioTag";
import {
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
        <div className="relative mx-auto max-w-sm sm:max-w-none">
          <PrendaImagen
            silueta={p.silueta}
            hex={p.colores[0].hex}
            url={p.imagenes.find((i) => i.colorId === p.colores[0].id)?.url ?? p.imagenes[0]?.url}
            alt=""
            prioridad
            className={cn("w-full rounded-none sm:mx-auto sm:max-w-xs", !p.activo && "opacity-50 grayscale")}
          />
          {!p.activo && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-tinta/90 px-3 py-1 text-label-md text-on-primary backdrop-blur">
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
              Oculta de la tienda
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">{categoria}</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-marca text-headline-lg leading-tight">{p.nombre}</h1>
            {(p.nuevo || p.reabastecido || !p.permiteApartado) && (
              <span className="text-label-md text-primary">
                {p.nuevo ? "Nuevo" : p.reabastecido ? "De vuelta en stock" : "Solo de contado"}
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <PrecioTag precio={p.precio} precioAntes={p.precioAntes} />
          </div>

          {/* Acción primaria + secundarias (sin pastillas compitiendo todas con el mismo peso). */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-tinta text-label-lg text-on-primary hover:bg-tinta-hover sm:flex-none sm:px-6"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Editar
            </button>
            {p.activo && (
              <Link
                to={`/tienda/producto/${p.id}`}
                aria-label="Ver en tienda"
                title="Ver en tienda"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container"
              >
                <Store className="h-5 w-5" aria-hidden />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setImprimiendo(true)}
              aria-label="Imprimir códigos QR"
              title="Imprimir códigos QR"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container"
            >
              <QrCode className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={alternarVisible}
              disabled={estado.isPending}
              aria-label={p.activo ? "Ocultar de la tienda" : "Mostrar en la tienda"}
              title={p.activo ? "Ocultar de la tienda" : "Mostrar en la tienda"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            >
              {p.activo ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Resumen de existencias: fila tipográfica simple, sin cajas de métricas. */}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-outline-variant/50 px-4 py-3 sm:px-5">
          <Cifra valor={disponibles} etiqueta="disponibles" alerta={disponibles === 0} />
          <Cifra valor={apartadas} etiqueta="apartadas" />
          <Cifra valor={fisico} etiqueta="en tiendas" />
          {agotadas > 0 && <Cifra valor={agotadas} etiqueta={agotadas === 1 ? "talla agotada" : "tallas agotadas"} alerta />}
        </div>

        <div className="border-t border-outline-variant/50 px-4 py-3.5 sm:px-5">
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

/** Una cifra del resumen de existencias: número al peso, etiqueta discreta. */
function Cifra({ valor, etiqueta, alerta }: { valor: number; etiqueta: string; alerta?: boolean }) {
  return (
    <p className="text-body-sm">
      <span className={cn("tabular text-label-lg", alerta && valor > 0 && "text-error")}>{valor}</span>{" "}
      <span className="text-on-surface-variant">{etiqueta}</span>
    </p>
  );
}
