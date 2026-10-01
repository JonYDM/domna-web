import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Clock, MapPin, ShieldCheck, Truck } from "lucide-react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PrecioTag } from "@/components/molecules/PrecioTag";
import { SelectorColor } from "@/components/molecules/SelectorColor";
import { SelectorTalla } from "@/components/molecules/SelectorTalla";
import { StockBadge } from "@/components/molecules/StockBadge";
import { Button, ButtonLink, Skeleton } from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { ApartarDrawer } from "@/features/apartados/components/ApartarDrawer";
import { useCategorias, useConfig, useProducto } from "../hooks";
import { GaleriaProducto } from "../components/GaleriaProducto";

export default function ProductoPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const producto = useProducto(id);
  const config = useConfig();
  const categorias = useCategorias();

  const [colorElegido, setColorElegido] = useState<string | null>(params.get("color"));
  const [tallaElegida, setTallaElegida] = useState<string | null>(null);
  const [apartando, setApartando] = useState(false);

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
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/tienda"))}
        className="-ml-2 mb-3 inline-flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        Catálogo
      </button>

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
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                Apártala con <strong>{formatMXN(anticipo)}</strong> ({config.data?.anticipoPct}%) y te la guardamos{" "}
                {config.data?.vigenciaConAnticipoDias} días.
              </span>
            </li>
            <li className="flex gap-3 text-body-md">
              <Clock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>O sin anticipo: te la guardamos {config.data?.vigenciaSinAnticipoDias} días.</span>
            </li>
            <li className="flex gap-3 text-body-md">
              <Truck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>Recoge en Temixco o La Azteca. Si está en la otra sucursal, te la llevamos en 2 días hábiles.</span>
            </li>
          </ul>

          <div className="hidden md:block">
            <BotonApartar talla={talla} agotada={tallaAgotada} anticipo={anticipo} onClick={() => setApartando(true)} />
          </div>
        </div>
      </div>

      {/* CTA fijo abajo en móvil (sobre la nav inferior) */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-outline-variant/60 bg-surface-container-lowest px-4 py-3 md:hidden">
        <BotonApartar talla={talla} agotada={tallaAgotada} anticipo={anticipo} onClick={() => setApartando(true)} />
      </div>

      {variante && (
        <ApartarDrawer
          open={apartando}
          onClose={() => setApartando(false)}
          producto={p}
          variante={variante}
          color={color}
        />
      )}
    </div>
  );
}

function BotonApartar({
  talla,
  agotada,
  anticipo,
  onClick,
}: {
  talla: string | null;
  agotada: boolean;
  anticipo: number;
  onClick: () => void;
}) {
  return (
    <Button size="lg" fullWidth disabled={!talla || agotada} onClick={onClick}>
      {!talla ? "Elige tu talla" : agotada ? "Talla agotada" : `Apartar con ${formatMXN(anticipo)}`}
    </Button>
  );
}
