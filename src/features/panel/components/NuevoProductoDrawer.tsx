import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Minus, Plus, QrCode, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { Silueta, SucursalId } from "@/types/api";
import { Button, Chip, Drawer, Input, Interruptor, Pasos, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { mensajeError } from "@/lib/errores";
import { formatHace } from "@/lib/format";
import { useSesion } from "@/features/auth/sesion";
import { useCategorias, useColores, useConfig } from "@/features/catalogo/hooks";
import { useCrearProducto, useGuardarColor } from "../hooks";
import { ResumenProducto } from "./ResumenProducto";
import { CamposColor } from "./ColorDrawer";
import { ColorDeFoto } from "./ColorDeFoto";
import { aplicarColorDeFoto } from "@/lib/colorMuestra";
import { FotosPorColor } from "./FotosPorColor";
import { Carrusel } from "@/components/molecules/Carrusel";
import { filtrarPorNombre } from "@/lib/buscarColor";
import type { ImagenProcesada } from "@/lib/imagen";
import { subirFotosPorColor } from "@/api/imagenes";
import {
  borrarBorrador,
  guardarBorrador,
  guardarFotosBorrador,
  leerBorrador,
  leerFotosBorrador,
  tieneContenido,
} from "../borradorProducto";

const STOCK_VACIO = { temixco: {}, azteca: {} };

/**
 * Alta de producto en pasos: datos → colores y tallas → stock (matriz) → precio y publicar.
 * Se guarda un borrador mientras la sesión siga abierta: si se cierra el formulario o la página se
 * recarga (p. ej. al volver de la cámara), se retoma donde se quedó, con sus fotos. Al cerrar sesión
 * (o si vence) el borrador se descarta.
 */
export function NuevoProductoDrawer({ open, onClose, onCreado }: { open: boolean; onClose: () => void; onCreado: (id: string) => void }) {
  const categorias = useCategorias();
  const catalogo = useColores();
  const config = useConfig();
  const crear = useCrearProducto();
  const nuevoColor = useGuardarColor();
  const { sesion } = useSesion();
  const usuario = sesion?.clientaId ?? sesion?.nombre ?? "anon";

  const [inicial] = useState(() => leerBorrador(usuario));
  const [retomado, setRetomado] = useState<string | null>(inicial?.guardado ?? null);
  const [claveReinicio, setClaveReinicio] = useState(0);
  const [paso, setPaso] = useState(inicial?.paso ?? 0);
  const publicado = useRef(false);
  const fotosLeidas = useRef(false);
  const catalogoValidado = useRef(false);

  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  /** Fotos por color (modelo Zara): fotosPorColor[indiceColor] = fotos de ese color. Máx 5 c/u. */
  const [fotosPorColor, setFotosPorColor] = useState<ImagenProcesada[][]>([]);
  const [categoriaElegida, setCategoriaElegida] = useState<string | null>(inicial?.categoriaElegida ?? null);
  const [silueta] = useState<Silueta>("vestido");
  const [colorIds, setColorIds] = useState<string[]>(inicial?.colorIds ?? []);
  /** null = todas las tallas de la categoría. */
  const [tallasElegidas, setTallasElegidas] = useState<string[] | null>(inicial?.tallasElegidas ?? null);
  const [sucursal, setSucursal] = useState<SucursalId>(inicial?.sucursal ?? "temixco");
  /** Stock independiente por sucursal: stock[sucursal][talla][colorIndex]. */
  const [stock, setStock] = useState<Record<SucursalId, Record<string, number[]>>>(inicial?.stock ?? STOCK_VACIO);
  const [precio, setPrecio] = useState(inicial?.precio ?? "");
  const [costo, setCosto] = useState(inicial?.costo ?? "");
  const [permiteApartado, setPermiteApartado] = useState(inicial?.permiteApartado ?? true);
  const [formColor, setFormColor] = useState<{ nombre: string; hex: string } | null>(null);
  /** "color" = crear un color; "colorFoto" = tomar su color de una foto. Ambas son pantallas completas dentro del formulario. */
  const [vista, setVista] = useState<"formulario" | "color" | "colorFoto">("formulario");
  const [busquedaColor, setBusquedaColor] = useState("");

  const hayFotos = fotosPorColor.some((f) => f && f.length > 0);
  const borrador = {
    paso,
    nombre,
    descripcion,
    categoriaElegida,
    colorIds,
    tallasElegidas,
    sucursal,
    stock,
    precio,
    costo,
    permiteApartado,
  };
  // Lo último en memoria, para guardarlo sin esperar si el formulario se cierra de golpe.
  const ultimo = useRef({ borrador, fotos: fotosPorColor, hayFotos });
  ultimo.current = { borrador, fotos: fotosPorColor, hayFotos };

  // Las fotos de un borrador viven en IndexedDB (son Blobs): se leen aparte, después de abrir.
  useEffect(() => {
    if (!inicial) {
      fotosLeidas.current = true;
      return;
    }
    let vivo = true;
    leerFotosBorrador(usuario).then((f) => {
      fotosLeidas.current = true;
      if (vivo && f) setFotosPorColor((actuales) => (actuales.some((l) => l?.length) ? actuales : f));
    });
    return () => {
      vivo = false;
    };
  }, [inicial, usuario]);

  // Guarda el borrador poco después de cada cambio.
  useEffect(() => {
    if (publicado.current || !tieneContenido(borrador, hayFotos)) return;
    const t = window.setTimeout(() => guardarBorrador(usuario, borrador), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `borrador` se arma de los mismos estados listados
  }, [paso, nombre, descripcion, categoriaElegida, colorIds, tallasElegidas, sucursal, stock, precio, costo, permiteApartado, hayFotos, usuario]);

  useEffect(() => {
    if (publicado.current || (!fotosLeidas.current && inicial)) return;
    const t = window.setTimeout(() => void guardarFotosBorrador(usuario, fotosPorColor), 800);
    return () => window.clearTimeout(t);
  }, [fotosPorColor, usuario, inicial]);

  // Al cerrarse el formulario (deslizar, tocar fuera, atrás) se guarda de inmediato lo último.
  useEffect(
    () => () => {
      if (publicado.current) return;
      const u = ultimo.current;
      if (!tieneContenido(u.borrador, u.hayFotos)) return;
      guardarBorrador(usuario, u.borrador);
      void guardarFotosBorrador(usuario, u.fotos);
    },
    [usuario],
  );

  // Si un color del borrador ya no existe en el catálogo, el stock por color quedaría desalineado: se limpia.
  useEffect(() => {
    if (catalogoValidado.current || !catalogo.data || colorIds.length === 0) return;
    catalogoValidado.current = true;
    const vigentes = colorIds.filter((id) => catalogo.data.some((c) => c.id === id));
    if (vigentes.length !== colorIds.length) {
      setColorIds(vigentes);
      setStock({ temixco: {}, azteca: {} });
      setFotosPorColor([]);
      toast("Algunos colores de tu borrador ya no existen; revisa el paso de colores.");
    }
  }, [catalogo.data, colorIds]);

  const categoria = categorias.data?.find((c) => c.id === categoriaElegida) ?? categorias.data?.[0];
  /** Colores del catálogo que se muestran: los que coinciden con la búsqueda, más los ya elegidos. */
  const resultadoColores = useMemo(
    () => filtrarPorNombre(catalogo.data ?? [], busquedaColor, new Set(colorIds)),
    [catalogo.data, busquedaColor, colorIds],
  );
  const categoriaId = categoria?.id ?? "";
  const tallas = useMemo(() => tallasElegidas ?? [], [tallasElegidas]);
  // Colores elegidos del catálogo (en el orden en que se eligieron).
  const colores = useMemo(
    () =>
      colorIds
        .map((id) => catalogo.data?.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map(({ nombre, hex, familia }) => ({ nombre, hex, familia })),
    [colorIds, catalogo.data],
  );
  const totalPiezas = useMemo(
    () =>
      tallas.reduce(
        (n, t) =>
          n +
          colores.reduce((m, _, ci) => m + (stock.temixco[t]?.[ci] ?? 0) + (stock.azteca[t]?.[ci] ?? 0), 0),
        0,
      ),
    [tallas, colores, stock],
  );

  function toggleColor(id: string) {
    setColorIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    setStock({ temixco: {}, azteca: {} });
  }

  function toggleTalla(t: string) {
    if (!categoria) return;
    const base = tallas.includes(t)
      ? tallas.filter((x) => x !== t)
      : categoria.tallas.filter((x) => x === t || tallas.includes(x));
    setTallasElegidas(base);
    setStock({ temixco: {}, azteca: {} });
  }

  function crearColorRapido() {
    if (!formColor) return;
    nuevoColor.mutate(
      { id: null, input: formColor },
      {
        onSuccess: (c) => {
          setColorIds((ids) => [...ids, c.id]);
          setFormColor(null);
          setVista("formulario");
          setStock({ temixco: {}, azteca: {} });
          toast.success(`“${c.nombre}” agregado a tus colores`);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  /** Fija el stock de una celda (talla×color) en la sucursal activa. */
  function setCelda(t: string, ci: number, v: number) {
    setStock((s) => {
      const porSuc = { ...(s[sucursal] ?? {}) };
      const fila = [...(porSuc[t] ?? colores.map(() => 0))];
      fila[ci] = Math.max(0, Math.min(99, v));
      porSuc[t] = fila;
      return { ...s, [sucursal]: porSuc };
    });
  }

  /** Fija el código de barras de una celda (talla×color). */
  async function publicar() {
    try {
      // Sube las fotos agrupadas por color a R2 (carpeta por id temporal) y arma imagenes[].
      let imagenes: { url: string; colorIndex: number; orden: number }[] | undefined;
      const hayFotos = fotosPorColor.some((f) => f && f.length > 0);
      if (hayFotos) {
        const idTemporal = `tmp-${Date.now().toString(36)}`;
        const subidas = await subirFotosPorColor(idTemporal, fotosPorColor);
        if (subidas.length > 0) imagenes = subidas;
      }
      const p = await crear.mutateAsync({
        nombre,
        descripcion,
        categoriaId,
        silueta,
        precio: Number(precio),
        costo: Number(costo) || 0,
        colores,
        tallas,
        stock,
        permiteApartado,
        imagenes,
      });
      toast.success("¡Prenda publicada!");
      publicado.current = true;
      await borrarBorrador(usuario);
      onCreado(p.id);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  /** Cierra sin perder nada: el borrador ya se guarda solo. */
  function cerrar() {
    if (!publicado.current && tieneContenido(borrador, hayFotos)) {
      toast.success("Guardamos tu borrador mientras tu sesión siga abierta.");
    }
    onClose();
  }

  async function empezarDeCero() {
    await borrarBorrador(usuario);
    setRetomado(null);
    setPaso(0);
    setNombre("");
    setDescripcion("");
    setFotosPorColor([]);
    setCategoriaElegida(null);
    setColorIds([]);
    setTallasElegidas(null);
    setSucursal("temixco");
    setStock({ temixco: {}, azteca: {} });
    setPrecio("");
    setCosto("");
    setPermiteApartado(true);
    setFormColor(null);
    setClaveReinicio((k) => k + 1);
    toast.success("Empezamos de cero");
  }


  return (
    <Drawer
      open={open}
      onClose={cerrar}
      title={vista === "colorFoto" ? "Color de la foto" : vista === "color" ? "Nuevo color" : "Nuevo producto"}
    >
      {vista === "colorFoto" && formColor && (
        <ColorDeFoto
          fotos={fotosPorColor.flat().map((f) => ({ preview: f.preview }))}
          onVolver={() => setVista("color")}
          onUsar={(hex, nombreSugerido) => {
            setFormColor((f) => (f ? aplicarColorDeFoto(f, hex, nombreSugerido) : f));
            setVista("color");
          }}
        />
      )}
      {formColor && (
        <div hidden={vista !== "color"} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setFormColor(null);
              setVista("formulario");
            }}
            className="-ml-2 inline-flex h-11 w-fit items-center gap-1.5 rounded-full pl-2 pr-4 text-label-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            Volver al producto
          </button>
          <CamposColor
            nombre={formColor.nombre}
            hex={formColor.hex}
            onTomarDeFoto={() => setVista("colorFoto")}
            onNombre={(nombre) => setFormColor((f) => (f ? { ...f, nombre } : f))}
            onHex={(hex) => setFormColor((f) => (f ? { ...f, hex } : f))}
          />
          <div className="sticky bottom-0 -mx-5 border-t border-outline-variant/60 bg-surface-container-lowest px-5 pb-1 pt-3">
            <Button
              size="lg"
              fullWidth
              loading={nuevoColor.isPending}
              disabled={formColor.nombre.trim().length < 2 || !/^#[0-9A-F]{6}$/i.test(formColor.hex)}
              onClick={crearColorRapido}
            >
              Agregar y usar
            </Button>
          </div>
        </div>
      )}
      {/* El formulario sigue montado (solo oculto) mientras se elige el color: así no pierde el paso ni lo escrito. */}
      <div hidden={vista !== "formulario"}>
      {retomado && (
        <div role="status" className="mb-4 flex items-center gap-3 rounded-xl bg-info-container px-3 py-2.5 text-body-sm text-info">
          <span className="flex-1">Retomamos tu borrador de {formatHace(retomado)}.</span>
          <Button type="button" variant="ghost" size="sm" onClick={empezarDeCero}>
            Empezar de cero
          </Button>
        </div>
      )}
      {crear.isPending && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-surface/85 backdrop-blur-sm">
          <span className="relative grid h-16 w-16 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
            <QrCode className="h-9 w-9 text-primary" aria-hidden />
          </span>
          <p className="font-marca text-headline-sm">Generando los códigos de tu producto</p>
          <p className="text-body-sm text-on-surface-variant">Creamos un QR único por talla y color…</p>
        </div>
      )}
      <Pasos
        key={claveReinicio}
        pasoInicial={claveReinicio === 0 ? (inicial?.paso ?? 0) : 0}
        onCambioPaso={setPaso}
        guardando={crear.isPending}
        textoFinal="Publicar"
        onFinalizar={publicar}
        pasos={[
          {
            titulo: "Datos",
            valido: nombre.trim().length >= 3,
            contenido: (
              <div className="flex flex-col gap-4">
                <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Vestido midi Lucía" autoFocus />
                <Select
                  label="Categoría"
                  value={categoriaId}
                  onChange={(e) => {
                    setCategoriaElegida(e.target.value);
                    setTallasElegidas(null);
                    setStock({ temixco: {}, azteca: {} });
                  }}
                  opciones={(categorias.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
                />
                <Textarea label="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Tela, corte, ocasión…" />
              </div>
            ),
          },
          {
            titulo: "Colores y tallas",
            valido: colores.length > 0 && tallas.length > 0,
            contenido: (
              <div className="flex flex-col gap-5">
                <fieldset>
                  <legend className="mb-2 text-label-lg">
                    Colores{" "}
                    {colores.length > 0 && <span className="font-normal text-on-surface-variant">· {colores.length} elegidos</span>}
                  </legend>
                  {(catalogo.data?.length ?? 0) > 8 && (
                    <div className="mb-2">
                      <Input
                        type="search"
                        aria-label="Buscar color"
                        placeholder="Buscar color…"
                        value={busquedaColor}
                        onChange={(e) => setBusquedaColor(e.target.value)}
                        icono={<Search className="h-4 w-4" aria-hidden />}
                        autoComplete="off"
                      />
                    </div>
                  )}
                  {busquedaColor.trim() && resultadoColores.coinciden === 0 && (
                    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2.5">
                      <p className="min-w-0 truncate text-body-sm text-on-surface-variant">
                        Ningún color se llama «{busquedaColor.trim()}».
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="tinta"
                        onClick={() => {
                          setFormColor({ nombre: busquedaColor.trim().slice(0, 24), hex: "" });
                          setBusquedaColor("");
                          setVista("color");
                        }}
                      >
                        Crear
                      </Button>
                    </div>
                  )}
                  {resultadoColores.visibles.length > 0 && (
                  <Carrusel etiqueta="Colores de tu catálogo" filas={2}>
                    {resultadoColores.visibles.map((c) => {
                      const activo = colorIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => toggleColor(c.id)}
                          className={cn(
                            "flex h-11 max-w-[10.5rem] snap-start items-center gap-2 rounded-xl border px-3 text-left text-body-sm",
                            activo ? "border-tinta bg-surface-container-low" : "border-outline-variant",
                          )}
                        >
                          <span
                            className={cn("h-5 w-5 shrink-0 rounded-full border", esClaro(c.hex) ? "border-outline-variant" : "border-transparent")}
                            style={{ backgroundColor: c.hex }}
                            aria-hidden
                          />
                          <span className="truncate">{c.nombre}</span>
                        </button>
                      );
                    })}
                  </Carrusel>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFormColor({ nombre: "", hex: "" });
                      setVista("color");
                    }}
                    className="mt-2 inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-label-lg text-primary-strong hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    ¿No está? Crear color
                  </button>
                </fieldset>
                <fieldset>
                  <legend className="mb-1 text-label-lg">Tallas</legend>
                  <p className="mb-2 text-body-sm text-on-surface-variant">
                    De la categoría <strong className="text-on-surface">{categoria?.nombre}</strong>. Elige las que tiene esta prenda.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(categoria?.tallas ?? []).map((t) => (
                      <Chip key={t} activo={tallas.includes(t)} onClick={() => toggleTalla(t)} className="min-w-12 justify-center">
                        {t}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-1 text-label-lg">Fotos por color</legend>
                  <p className="mb-2 text-body-sm text-on-surface-variant">
                    Hasta 5 por color. En la tienda, la galería cambia al elegir cada color.
                  </p>
                  <FotosPorColor colores={colores} fotos={fotosPorColor} onChange={setFotosPorColor} />
                </fieldset>
              </div>
            ),
          },
          {
            titulo: "Stock",
            valido: totalPiezas > 0,
            contenido: (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-1.5 text-label-md text-on-surface-variant">
                    Stock por sucursal (cada una se captura por separado)
                  </p>
                  <div className="flex gap-2">
                    {(["temixco", "azteca"] as const).map((s) => {
                      const piezasSuc = tallas.reduce(
                        (n, t) => n + colores.reduce((m, _, ci) => m + (stock[s][t]?.[ci] ?? 0), 0),
                        0,
                      );
                      return (
                        <Chip key={s} activo={sucursal === s} onClick={() => setSucursal(s)}>
                          {s === "temixco" ? "Temixco" : "La Azteca"}
                          {piezasSuc > 0 ? ` · ${piezasSuc}` : ""}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-1.5 text-body-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-label-md text-on-surface-variant">Talla</th>
                        {colores.map((c) => (
                          <th key={c.nombre} className="px-1 text-label-md font-semibold">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-3 w-3 rounded-full border border-on-surface/10" style={{ backgroundColor: c.hex }} aria-hidden />
                              {c.nombre}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tallas.map((t) => (
                        <tr key={t}>
                          <th scope="row" className="pr-2 text-left text-label-lg">
                            {t}
                          </th>
                          {colores.map((c, ci) => {
                            const v = stock[sucursal][t]?.[ci] ?? 0;
                            return (
                              <td key={c.nombre} className="px-1">
                                <div className="mx-auto flex w-fit items-center rounded-xl border border-outline-variant">
                                  <button
                                    type="button"
                                    className="grid h-10 w-9 place-items-center text-on-surface-variant disabled:opacity-30"
                                    onClick={() => setCelda(t, ci, v - 1)}
                                    disabled={v === 0}
                                    aria-label={`Quitar una pieza ${c.nombre} ${t}`}
                                  >
                                    <Minus className="h-4 w-4" aria-hidden />
                                  </button>
                                  <span className="tabular w-6 text-center text-label-lg">{v}</span>
                                  <button
                                    type="button"
                                    className="grid h-10 w-9 place-items-center text-on-surface-variant"
                                    onClick={() => setCelda(t, ci, v + 1)}
                                    aria-label={`Agregar una pieza ${c.nombre} ${t}`}
                                  >
                                    <Plus className="h-4 w-4" aria-hidden />
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="tabular text-body-sm text-on-surface-variant">{totalPiezas} piezas en total</p>

                <p className="flex items-start gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-body-sm text-primary-on-soft">
                  <QrCode className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Al publicar, generamos un código QR único para cada talla y color. Luego podrás imprimirlos y pegarlos en tus etiquetas para vender escaneando en caja.
                </p>
              </div>
            ),
          },
          {
            titulo: "Precio y publicar",
            valido: Number(precio) > 0,
            contenido: (
              <div className="flex flex-col gap-4">
                <Input
                  label="Precio"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  icono={<span className="text-body-lg">$</span>}
                  placeholder="589"
                  autoFocus
                />
                <Input
                  label="Costo (lo que te costó)"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  icono={<span className="text-body-lg">$</span>}
                  placeholder="320"
                  hint="Solo tú lo ves. Sirve para calcular tu ganancia real."
                />
                {Number(precio) > 0 && Number(costo) > 0 && Number(costo) <= Number(precio) && (
                  <p className="tabular text-body-sm text-on-surface-variant">
                    Ganancia por pieza: ${Number(precio) - Number(costo)}
                  </p>
                )}
                <Interruptor
                  checked={permiteApartado}
                  onChange={setPermiteApartado}
                  label="Se puede apartar"
                  descripcion="Apágalo para venderla solo de contado (p. ej. ofertas)."
                />
                <ResumenProducto
                  nombre={nombre}
                  descripcion={descripcion}
                  categoria={categorias.data?.find((c) => c.id === categoriaId)?.nombre ?? "—"}
                            precio={Number(precio)}
                  colores={colores}
                  tallas={tallas}
                  stock={stock}
                  totalPiezas={totalPiezas}
                  permiteApartado={permiteApartado}
                  anticipoPct={config.data?.anticipoPct ?? 50}
                  imagenPreview={fotosPorColor[0]?.[0]?.preview}
                  imagenFondo={fotosPorColor[0]?.[0]?.fondoDegradado}
                />
                <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                  <ImagePlus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {fotosPorColor.some((f) => f && f.length > 0)
                    ? "Tus fotos ya están optimizadas (WebP). Se suben al publicar; la galería cambiará al elegir cada color."
                    : "Sube fotos por color en el paso de colores; mientras tanto se muestra la ilustración."}
                </p>
              </div>
            ),
          },
        ]}
      />
      </div>
    </Drawer>
  );
}
