import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Clock, MapPin, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { ModalidadApartado } from "@/types/api";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PrecioTag } from "@/components/molecules/PrecioTag";
import { SelectorColor } from "@/components/molecules/SelectorColor";
import { SelectorTalla } from "@/components/molecules/SelectorTalla";
import { StockBadge } from "@/components/molecules/StockBadge";
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
  Skeleton,
} from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { ComprarApartarDrawer } from "@/features/apartados/components/ComprarApartarDrawer";
import { useCategorias, useConfig, useProducto } from "../hooks";
import { GaleriaProducto } from "../components/GaleriaProducto";

export default function ProductoPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const producto = useProducto(id);
  const config = useConfig();
  const categorias = useCategorias();

  const [colorElegido, setColorElegido] = useState<string | null>(params.get("color"));
  const [tallaElegida, setTallaElegida] = useState<string | null>(null);
  /** Drawer abierto con la opción elegida (null = cerrado). */
  const [accion, setAccion] = useState<ModalidadApartado | null>(null);

  const p = producto.data;

  // Derivados en render (nada de useEffect para derivar estado).
  const colorId = useMemo(() => {
    if (!p) return null;
    if (colorElegido && p.colores.some((c) => c.id === colorElegido)) return colorElegido;
    return (p.colores.find((c) => p.variantes.some((v) => v.colorId === c.id && v.disponible > 0)) ?? p.colores[0]).id;
  }, [p, colorElegido]);

  const dispPorTalla = useMemo(() => {
    const r: Record<string, number> = {};
    p?.variantes.filter((v) => v.colorId === colorId).forEach((v) => (r[v.talla] = v.disponible));
    return r;
  }, [p, colorId]);

  const coloresAgotados = useMemo(
    () => new Set(p?.colores.filter((c) => !p.variantes.some((v) => v.colorId === c.id && v.disponible > 0)).map((c) => c.id)),
    [p],
  );

  if (producto.isPending) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-[3/4] rounded-3xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (producto.isError || !p || !colorId) {
    return (
      <EmptyState
        expresion="triste"
        titulo="No encontramos esa prenda"
        texto={mensajeError(producto.error)}
        accion={<ButtonLink to="/tienda">Ver catálogo</ButtonLink>}
      />
    );
  }

  const color = p.colores.find((c) => c.id === colorId)!;
  // Si solo hay una talla (p. ej. "Única"), se elige sola.
  const talla = tallaElegida ?? (p.tallas.length === 1 && (dispPorTalla[p.tallas[0]] ?? 0) > 0 ? p.tallas[0] : null);
  const variante = talla ? p.variantes.find((v) => v.colorId === colorId && v.talla === talla) : undefined;
  const tallaAgotada = talla !== null && (variante?.disponible ?? 0) <= 0;
  const anticipo = Math.ceil((p.precio * (config.data?.anticipoPct ?? 50)) / 100);
  const categoria = categorias.data?.find((c) => c.id === p.categoriaId)?.nombre;
  const nombreSucursal = (s: "temixco" | "azteca") => (s === "temixco" ? "Temixco" : "La Azteca");

  return (
    <div className="pb-24 md:pb-0">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/tienda" />}>Catálogo</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`/tienda?categoria=${p.categoriaId}`} />}>{categoria ?? "Categoría"}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0 flex-1">
            <BreadcrumbPage>{p.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
        <GaleriaProducto
          key={colorId}
          silueta={p.silueta}
          hex={color.hex}
          nombre={p.nombre}
          colorNombre={color.nombre}
          urls={p.imagenes.filter((i) => !i.colorId || i.colorId === colorId).map((i) => i.url)}
        />

        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <p className="text-label-sm uppercase text-on-surface-variant">{categoria}</p>
            <h1 className="mt-1 font-marca text-headline-lg text-on-surface">{p.nombre}</h1>
            <div className="mt-2 flex items-center gap-3">
              <PrecioTag precio={p.precio} precioAntes={p.precioAntes} tamano="lg" />
              {variante && <StockBadge disponible={variante.disponible} />}
              {!p.permiteApartado && <Badge>Solo de contado</Badge>}
            </div>
          </div>

          <SelectorColor
            colores={p.colores}
            seleccionado={colorId}
            agotados={coloresAgotados}
            onChange={(c) => {
              setColorElegido(c);
              setTallaElegida(null);
            }}
          />

          <SelectorTalla tallas={p.tallas} seleccionada={talla} onChange={setTallaElegida} disponible={dispPorTalla} />

          {variante && variante.disponible > 0 && (
            <p className="-mt-2 flex items-center gap-2 text-body-sm text-on-surface-variant">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              {(["temixco", "azteca"] as const)
                .map((s) => `${nombreSucursal(s)}: ${variante.disponiblePorSucursal[s] > 0 ? variante.disponiblePorSucursal[s] : "sin piezas"}`)
                .join(" · ")}
            </p>
          )}

          <p className="text-body-md text-on-surface-variant">{p.descripcion}</p>

          <ul className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
            <li className="flex gap-3 text-body-md">
              <ShoppingBag className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                Cómprala de contado por <strong>{formatMXN(p.precio)}</strong> y recógela hoy.
              </span>
            </li>
            {p.permiteApartado ? (
              <>
                <li className="flex gap-3 text-body-md">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    O apártala con <strong>{formatMXN(anticipo)}</strong> ({config.data?.anticipoPct}%) y te la
                    guardamos {config.data?.vigenciaConAnticipoDias} días.
                  </span>
                </li>
                <li className="flex gap-3 text-body-md">
                  <Clock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>Sin anticipo: te la guardamos {config.data?.vigenciaSinAnticipoDias} días.</span>
                </li>
              </>
            ) : (
              <li className="flex gap-3 text-body-md text-on-surface-variant">
                <Clock className="h-5 w-5 shrink-0 text-outline" aria-hidden />
                <span>Las prendas en oferta no se apartan.</span>
              </li>
            )}
            <li className="flex gap-3 text-body-md">
              <Truck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>Recoge en Temixco o La Azteca. Si está en la otra sucursal, te la llevamos en 2 días hábiles.</span>
            </li>
          </ul>

          <div className="hidden md:block">
            <Acciones talla={talla} agotada={tallaAgotada} precio={p.precio} anticipo={anticipo} permiteApartado={p.permiteApartado} onAccion={setAccion} />
          </div>
        </div>
      </div>

      {/* CTA fijo abajo en móvil (sobre la nav inferior) */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-outline-variant/60 bg-surface-container-lowest px-4 py-3 md:hidden">
        <Acciones talla={talla} agotada={tallaAgotada} precio={p.precio} anticipo={anticipo} permiteApartado={p.permiteApartado} onAccion={setAccion} />
      </div>

      {variante && accion && (
        <ComprarApartarDrawer
          key={`${variante.id}-${accion}`}
          open
          onClose={() => setAccion(null)}
          producto={p}
          variante={variante}
          color={color}
          modalidadInicial={accion}
        />
      )}
    </div>
  );
}

function Acciones({
  talla,
  agotada,
  precio,
  anticipo,
  permiteApartado,
  onAccion,
}: {
  talla: string | null;
  agotada: boolean;
  precio: number;
  anticipo: number;
  permiteApartado: boolean;
  onAccion: (m: ModalidadApartado) => void;
}) {
  if (!talla || agotada) {
    return (
      <Button size="lg" fullWidth disabled>
        {!talla ? "Elige tu talla" : "Talla agotada"}
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="lg" variant="tinta" fullWidth className="px-3" onClick={() => onAccion("compra")}>
        Comprar · {formatMXN(precio)}
      </Button>
      {permiteApartado && (
        <Button size="lg" fullWidth className="px-3" onClick={() => onAccion("anticipo")}>
          Apartar · {formatMXN(anticipo)}
        </Button>
      )}
    </div>
  );
}
