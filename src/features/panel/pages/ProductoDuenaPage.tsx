import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ExternalLink, Minus, Plus } from "lucide-react";
import type { SucursalId } from "@/types/api";
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
  Button,
  ButtonLink,
  Interruptor,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { mensajeError } from "@/lib/errores";
import { useCategorias, useProducto } from "@/features/catalogo/hooks";
import { useAjustarStock, useCambiarEstadoProducto, useCambiarPermiteApartado } from "../hooks";

const SUCURSALES: { id: SucursalId; nombre: string }[] = [
  { id: "temixco", nombre: "Temixco" },
  { id: "azteca", nombre: "La Azteca" },
];

export default function ProductoDuenaPage() {
  const { id = "" } = useParams();
  const producto = useProducto(id, { incluirInactivo: true });
  const categorias = useCategorias();
  const estado = useCambiarEstadoProducto();
  const ajustar = useAjustarStock(id);
  const permite = useCambiarPermiteApartado();

  if (producto.isPending) return <Skeleton className="h-64 w-full rounded-2xl" />;
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

  function mover(varianteId: string, sucursal: SucursalId, delta: number) {
    ajustar.mutate({ varianteId, sucursal, delta }, { onError: (e) => toast.error(mensajeError(e)) });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/app/inventario" />}>Inventario</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`/app/inventario?categoria=${p.categoriaId}`} />}>
              {categorias.data?.find((c) => c.id === p.categoriaId)?.nombre ?? "Categoría"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage>{p.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <PrendaImagen silueta={p.silueta} hex={p.colores[0].hex} alt="" className="w-24 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="font-marca text-headline-md">{p.nombre}</h1>
          <PrecioTag precio={p.precio} precioAntes={p.precioAntes} />
          <div className="flex flex-wrap gap-1.5">
            <Badge tono={p.activo ? "success" : "neutral"}>{p.activo ? "Publicado" : "Inactivo"}</Badge>
            {p.nuevo && <Badge tono="primary">Nuevo</Badge>}
            {p.reabastecido && <Badge tono="success">De vuelta en stock</Badge>}
            {!p.permiteApartado && <Badge>Solo de contado</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={p.activo ? "warning" : "outline"}
              loading={estado.isPending}
              onClick={() =>
                estado.mutate(
                  { id: p.id, activo: !p.activo },
                  { onSuccess: () => toast.success(p.activo ? "Prenda oculta del catálogo" : "Prenda publicada") },
                )
              }
            >
              {p.activo ? "Desactivar" : "Reactivar"}
            </Button>
            {p.activo && (
              <ButtonLink to={`/tienda/producto/${p.id}`} size="sm" variant="ghost">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Ver en tienda
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
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
          descripcion={
            p.permiteApartado
              ? "La clienta puede comprarla o apartarla."
              : "Solo se vende de contado (no se aparta)."
          }
        />
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="text-label-lg">Stock por variante</h2>
        <p className="mb-3 text-body-sm text-on-surface-variant">
          Disponible = físico − apartado. No puedes bajar el físico por debajo de lo apartado. Si subes stock de
          una talla agotada, la prenda aparece 7 días en “De vuelta en stock” de la tienda.
        </p>
        <div className="flex flex-col gap-4">
          {p.colores.map((c) => (
            <div key={c.id}>
              <p className="mb-2 flex items-center gap-2 text-label-lg">
                <span className="h-4 w-4 rounded-full border border-on-surface/10" style={{ backgroundColor: c.hex }} aria-hidden />
                {c.nombre}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-body-sm">
                  <thead>
                    <tr className="text-label-md text-on-surface-variant">
                      <th className="py-1.5 text-left font-semibold">Talla</th>
                      {SUCURSALES.map((s) => (
                        <th key={s.id} className="py-1.5 font-semibold">
                          {s.nombre}
                        </th>
                      ))}
                      <th className="py-1.5 text-right font-semibold">Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.variantes
                      .filter((v) => v.colorId === c.id)
                      .map((v) => (
                        <tr key={v.id} className="border-t border-outline-variant/40">
                          <th scope="row" className="py-2 text-left text-label-lg">
                            {v.talla}
                          </th>
                          {SUCURSALES.map((s) => (
                            <td key={s.id} className="py-2">
                              <div className="mx-auto flex w-fit items-center rounded-xl border border-outline-variant">
                                <button
                                  type="button"
                                  onClick={() => mover(v.id, s.id, -1)}
                                  disabled={v.stock[s.id] === 0 || ajustar.isPending}
                                  className="grid h-9 w-9 place-items-center text-on-surface-variant disabled:opacity-30"
                                  aria-label={`Quitar una pieza ${v.talla} en ${s.nombre}`}
                                >
                                  <Minus className="h-4 w-4" aria-hidden />
                                </button>
                                <span className="tabular w-6 text-center text-label-lg">{v.stock[s.id]}</span>
                                <button
                                  type="button"
                                  onClick={() => mover(v.id, s.id, 1)}
                                  disabled={ajustar.isPending}
                                  className="grid h-9 w-9 place-items-center text-on-surface-variant disabled:opacity-30"
                                  aria-label={`Agregar una pieza ${v.talla} en ${s.nombre}`}
                                >
                                  <Plus className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            </td>
                          ))}
                          <td className="py-2 text-right">
                            <span
                              className={cn(
                                "tabular rounded-full px-2 py-0.5 text-label-md",
                                v.disponible === 0
                                  ? "bg-error-container text-error"
                                  : v.disponible <= 2
                                    ? "bg-warning-container text-warning"
                                    : "bg-success-container text-success",
                              )}
                            >
                              {v.disponible}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
