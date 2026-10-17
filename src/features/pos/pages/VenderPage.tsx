import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Minus, Plus, ScanLine, Search, ShoppingCart, Trash2, User, Users } from "lucide-react";
import type { Apartado, MetodoPago, SucursalId } from "@/types/api";
import { FotoPrenda } from "@/components/FotoPrenda";
import { fotoDeColor } from "@/lib/fotoPrenda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Badge, Button, ButtonLink, Chip, Drawer, Segmentos, Skeleton } from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { METODO_PAGO } from "@/lib/enums";
import { useSesion } from "@/features/auth/sesion";
import { useCategorias, useProductos } from "@/features/catalogo/hooks";
import { useClientas } from "@/features/panel/hooks";
import { ElegirVarianteDrawer, type SeleccionVariante } from "../ElegirVarianteDrawer";
import { EscanerCodigo } from "../EscanerCodigo";
import { useBuscarPorCodigo, useVenderFisico } from "../hooks";

interface LineaCarritoUI extends SeleccionVariante {
  cantidad: number;
}

const PUBLICO_ID = "c-publico";
const METODOS: MetodoPago[] = ["efectivo", "tarjeta", "transferencia"];

export default function VenderPage() {
  const { sesion } = useSesion();
  const sucursal: SucursalId = sesion?.sucursal ?? "temixco";
  const vender = useVenderFisico();
  const buscarCodigo = useBuscarPorCodigo();
  const categorias = useCategorias();

  const [carrito, setCarrito] = useState<LineaCarritoUI[]>([]);
  const [productoAbierto, setProductoAbierto] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [exito, setExito] = useState<Apartado | null>(null);

  // Cliente: público general o una clienta registrada.
  const [tipoCliente, setTipoCliente] = useState<"publico" | "clienta">("publico");
  const [clientaId, setClientaId] = useState<string | null>(null);
  const [clientaNombre, setClientaNombre] = useState<string>("");

  // Búsqueda y filtro de productos.
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const timer = useRef<number>();
  const productos = useProductos({ texto: busqueda || undefined, categoria });

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  const total = useMemo(() => carrito.reduce((n, l) => n + l.precio * l.cantidad, 0), [carrito]);
  const piezas = useMemo(() => carrito.reduce((n, l) => n + l.cantidad, 0), [carrito]);

  function agregar(sel: SeleccionVariante) {
    setCarrito((c) => {
      const i = c.findIndex((l) => l.varianteId === sel.varianteId);
      if (i >= 0) {
        const copia = [...c];
        copia[i] = { ...copia[i], cantidad: copia[i].cantidad + 1 };
        return copia;
      }
      return [...c, { ...sel, cantidad: 1 }];
    });
    setProductoAbierto(null);
    toast.success(`${sel.nombre} agregado`);
  }

  /** Código escaneado o escrito: busca la variante y la agrega al carrito. */
  function onCodigo(codigo: string) {
    buscarCodigo.mutate(codigo, {
      onSuccess: (r) => {
        if (r.disponible < 1) {
          toast.error(`${r.nombre} está agotado.`);
          return;
        }
        agregar({
          varianteId: r.varianteId,
          productoId: r.productoId,
          nombre: r.nombre,
          precio: r.precio,
          talla: r.talla,
          colorNombre: r.colorNombre,
          colorHex: r.colorHex,
        });
        setEscaneando(false);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  function cambiarCantidad(varianteId: string, delta: number) {
    setCarrito((c) =>
      c
        .map((l) => (l.varianteId === varianteId ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0),
    );
  }

  function cobrar() {
    if (!carrito.length) return;
    const destino = tipoCliente === "clienta" && clientaId ? clientaId : PUBLICO_ID;
    vender.mutate(
      {
        clientaId: destino,
        lineas: carrito.map((l) => ({ varianteId: l.varianteId, cantidad: l.cantidad })),
        sucursal,
        metodo,
      },
      {
        onSuccess: (venta) => {
          setExito(venta);
          setCarrito([]);
          setCarritoAbierto(false);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  function nuevaVenta() {
    setExito(null);
    setTipoCliente("publico");
    setClientaId(null);
    setClientaNombre("");
    setTexto("");
    setBusqueda("");
    setCategoria(undefined);
    setMetodo("efectivo");
  }

  // ── Pantalla de éxito ──
  if (exito) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-8 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-success-container text-success">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </span>
        <div>
          <h1 className="font-marca text-headline-lg">¡Venta cobrada!</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Folio <strong className="text-on-surface">{exito.folio}</strong> ·{" "}
            {exito.clientaId === PUBLICO_ID ? "Público general" : exito.clientaNombre}
          </p>
        </div>
        <div className="w-full rounded-2xl bg-surface-container-lowest p-4 text-left shadow-soft">
          <ul className="flex flex-col gap-2">
            {exito.lineas.map((l) => (
              <li key={l.varianteId} className="flex items-center justify-between gap-3 text-body-md">
                <span className="min-w-0 truncate">
                  {l.cantidad}× {l.nombre} · {l.talla}
                </span>
                <span className="tabular shrink-0">{formatMXN(l.precio * l.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-outline-variant/50 pt-3 text-label-lg">
            <span>Total cobrado</span>
            <span className="tabular">{formatMXN(exito.total)}</span>
          </div>
        </div>
        <div className="flex w-full gap-2">
          <ButtonLink to="/caja" variant="outline" fullWidth>
            Ir al corte
          </ButtonLink>
          <Button fullWidth onClick={nuevaVenta}>
            <Plus className="h-5 w-5" aria-hidden />
            Nueva venta
          </Button>
        </div>
      </div>
    );
  }

  const lista = productos.data ?? [];

  const clienteProps = {
    tipo: tipoCliente,
    clientaNombre,
    onPublico: () => {
      setTipoCliente("publico");
      setClientaId(null);
      setClientaNombre("");
    },
    onClienta: (id: string, nombre: string) => {
      setTipoCliente("clienta");
      setClientaId(id);
      setClientaNombre(nombre);
    },
  };

  const resumenCarrito = (
    <ResumenCarrito
      carrito={carrito}
      metodo={metodo}
      onMetodo={setMetodo}
      total={total}
      cobrando={vender.isPending}
      onCambiar={cambiarCantidad}
      onCobrar={cobrar}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
      {/* Columna izquierda: barra sticky (buscar + escanear + categorías) y lista */}
      <div className="flex flex-col gap-3">
        <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 border-b border-outline-variant/50 bg-surface px-4 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3">
              <Search className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
              <input
                value={texto}
                onChange={(e) => onTexto(e.target.value)}
                placeholder="Buscar prenda o color"
                className="h-full w-full bg-transparent text-body-md outline-none"
              />
            </div>
            <Button variant="tinta" onClick={() => setEscaneando(true)} aria-label="Escanear código de barras">
              <ScanLine className="h-5 w-5" aria-hidden />
              <span className="hidden sm:inline">Escanear</span>
            </Button>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Categorías">
            <Chip activo={!categoria} onClick={() => setCategoria(undefined)}>
              Todo
            </Chip>
            {categorias.data?.map((c) => (
              <Chip key={c.id} activo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                {c.nombre}
              </Chip>
            ))}
          </div>
        </div>

        {productos.isPending ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState expresion="curiosa" titulo="Sin resultados" texto="Prueba con otra búsqueda o categoría." />
        ) : (
          <ul className="grid grid-cols-2 gap-2 pb-28 md:grid-cols-3 lg:pb-2">
            {lista.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setProductoAbierto(p.id)}
                  disabled={p.disponibleTotal < 1}
                  className="flex h-full w-full flex-col rounded-2xl bg-surface-container-lowest p-2 text-left shadow-soft transition-shadow hover:shadow-lift disabled:opacity-50"
                >
                  <FotoPrenda hex={p.colores[0].hex} url={fotoDeColor(p.imagenes, p.colores[0].id)} alt="" className="aspect-square w-full rounded-xl" />
                  <p className="mt-1.5 line-clamp-2 text-body-sm font-medium">{p.nombre}</p>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="tabular text-label-md">{formatMXN(p.precio)}</span>
                    {p.disponibleTotal < 1 ? (
                      <Badge tono="danger">Agotado</Badge>
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-primary-on-soft">
                        <Plus className="h-4 w-4" aria-hidden />
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Carrito: aside fijo en escritorio */}
      <aside className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-4">
        <ClienteSelector {...clienteProps} />
        {resumenCarrito}
      </aside>

      {/* Botón flotante del carrito (móvil): siempre visible, con contador de piezas. */}
      <button
        type="button"
        onClick={() => setCarritoAbierto(true)}
        aria-label={`Abrir carrito${piezas ? `, ${piezas} ${piezas === 1 ? "pieza" : "piezas"}` : " (vacío)"}`}
        className={`fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary-strong text-on-primary shadow-lift transition-all active:scale-95 lg:hidden ${
          carrito.length > 0 ? "bottom-36" : "bottom-20"
        }`}
      >
        <ShoppingCart className="h-6 w-6" aria-hidden />
        {piezas > 0 && (
          <span className="tabular absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1 text-label-sm font-bold text-on-primary ring-2 ring-surface">
            {piezas}
          </span>
        )}
      </button>

      {/* Barra inferior fija (móvil): acceso rápido a cobrar cuando hay piezas. */}
      {carrito.length > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/60 bg-surface-container-lowest p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setCarritoAbierto(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-primary-strong px-4 py-3 text-on-primary"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" aria-hidden />
              <span className="tabular text-label-lg">{piezas} {piezas === 1 ? "pieza" : "piezas"}</span>
            </span>
            <span className="tabular text-label-lg">Cobrar · {formatMXN(total)}</span>
          </button>
        </div>
      )}

      {/* Carrito en Drawer (móvil) */}
      <Drawer open={carritoAbierto} onClose={() => setCarritoAbierto(false)} title="Carrito" descripcion={`${piezas} ${piezas === 1 ? "pieza" : "piezas"}`}>
        <div className="flex flex-col gap-4">
          <ClienteSelector {...clienteProps} />
          {resumenCarrito}
        </div>
      </Drawer>

      <ElegirVarianteDrawer
        productoId={productoAbierto}
        sucursal={sucursal}
        onAgregar={agregar}
        onClose={() => setProductoAbierto(null)}
      />

      <EscanerCodigo
        open={escaneando}
        onClose={() => setEscaneando(false)}
        onCodigo={onCodigo}
        titulo="Escanear prenda"
      />
    </div>
  );
}

/** Líneas del carrito + método de pago + total + cobrar. Reutilizado en aside y en drawer. */
function ResumenCarrito({
  carrito,
  metodo,
  onMetodo,
  total,
  cobrando,
  onCambiar,
  onCobrar,
}: {
  carrito: LineaCarritoUI[];
  metodo: MetodoPago;
  onMetodo: (m: MetodoPago) => void;
  total: number;
  cobrando: boolean;
  onCambiar: (varianteId: string, delta: number) => void;
  onCobrar: () => void;
}) {
  return (
    <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-on-surface-variant" aria-hidden />
        <h2 className="text-label-lg">Carrito</h2>
      </div>

      {carrito.length === 0 ? (
        <p className="py-4 text-center text-body-md text-on-surface-variant">Agrega o escanea prendas.</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-outline-variant/50">
            {carrito.map((l) => (
              <li key={l.varianteId} className="flex items-center gap-2 py-2.5">
                <span className="h-8 w-8 shrink-0 rounded-lg border border-on-surface/10" style={{ backgroundColor: l.colorHex }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-md">{l.nombre}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {l.talla} · {l.colorNombre} · {formatMXN(l.precio)}
                  </p>
                </div>
                <div className="flex items-center rounded-lg border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => onCambiar(l.varianteId, -1)}
                    className="grid h-8 w-8 place-items-center text-on-surface-variant"
                    aria-label={`Quitar uno de ${l.nombre}`}
                  >
                    {l.cantidad === 1 ? <Trash2 className="h-4 w-4" aria-hidden /> : <Minus className="h-4 w-4" aria-hidden />}
                  </button>
                  <span className="tabular w-6 text-center text-label-md">{l.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => onCambiar(l.varianteId, 1)}
                    className="grid h-8 w-8 place-items-center text-on-surface-variant"
                    aria-label={`Agregar uno de ${l.nombre}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <p className="mb-1.5 text-label-md text-on-surface-variant">Método de pago</p>
            <Segmentos
              aria-label="Método de pago"
              activo={metodo}
              onChange={onMetodo}
              segmentos={METODOS.map((m) => ({ id: m, label: METODO_PAGO[m] }))}
            />
          </div>
          <div className="my-3 flex items-center justify-between text-headline-sm">
            <span className="text-label-lg text-on-surface-variant">Total</span>
            <span className="tabular">{formatMXN(total)}</span>
          </div>
          <Button size="lg" fullWidth loading={cobrando} onClick={onCobrar}>
            Cobrar {formatMXN(total)}
          </Button>
        </>
      )}
    </section>
  );
}

/** Selector de cliente: público general (default) o buscar una clienta registrada. */
function ClienteSelector({
  tipo,
  clientaNombre,
  onPublico,
  onClienta,
}: {
  tipo: "publico" | "clienta";
  clientaNombre: string;
  onPublico: () => void;
  onClienta: (id: string, nombre: string) => void;
}) {
  // Pestaña activa propia del selector: así el tab responde al tacto aunque aún no se elija clienta.
  const [tab, setTab] = useState<"publico" | "clienta">(tipo);
  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const timer = useRef<number>();
  const clientas = useClientas("todas", busqueda);

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  return (
    <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
      <h2 className="mb-2 text-label-lg">Cliente</h2>
      <Segmentos
        aria-label="Tipo de cliente"
        activo={tab}
        onChange={(t) => {
          setTab(t);
          if (t === "publico") {
            onPublico();
            setBuscando(false);
            setTexto("");
            setBusqueda("");
          } else {
            // Al cambiar a "Clienta": si aún no hay una elegida, abre el buscador de inmediato.
            setBuscando(!clientaNombre);
          }
        }}
        segmentos={[
          { id: "publico", label: "Público general", icono: Users },
          { id: "clienta", label: "Clienta", icono: User },
        ]}
      />

      {tab === "clienta" && (
        <div className="mt-3 flex flex-col gap-2">
          {clientaNombre && !buscando ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2">
              <span className="min-w-0 truncate text-body-md">{clientaNombre}</span>
              <button type="button" onClick={() => setBuscando(true)} className="shrink-0 text-label-md text-primary-strong hover:underline">
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant px-3">
                <Search className="h-4 w-4 text-on-surface-variant" aria-hidden />
                <input
                  value={texto}
                  onChange={(e) => onTexto(e.target.value)}
                  placeholder="Nombre o teléfono"
                  className="h-10 w-full bg-transparent text-body-md outline-none"
                  autoFocus
                />
              </div>
              {busqueda && (
                <ul className="max-h-48 overflow-y-auto rounded-xl border border-outline-variant">
                  {(clientas.data ?? []).slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onClienta(c.id, `${c.nombre} ${c.apellidos}`.trim());
                          setBuscando(false);
                          setTexto("");
                          setBusqueda("");
                        }}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-surface-container-low"
                      >
                        <span className="text-body-md">{c.nombre} {c.apellidos}</span>
                        <span className="text-body-sm text-on-surface-variant">{c.telefono}</span>
                      </button>
                    </li>
                  ))}
                  {clientas.data?.length === 0 && (
                    <li className="px-3 py-2 text-body-sm text-on-surface-variant">Sin coincidencias.</li>
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
