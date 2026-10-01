import { useMemo, useState } from "react";
import { ImagePlus, Minus, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Silueta, SucursalId } from "@/types/api";
import { Button, Chip, Drawer, Input, Interruptor, Pasos, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { SILUETAS } from "@/lib/enums";
import { mensajeError } from "@/lib/errores";
import { useCategorias, useColores, useConfig } from "@/features/catalogo/hooks";
import { useCrearProducto, useGuardarColor } from "../hooks";
import { ResumenProducto } from "./ResumenProducto";
import { CamposColor } from "./ColorDrawer";

/** Alta de producto en pasos: datos → colores y tallas → stock (matriz) → precio y publicar. */
export function NuevoProductoDrawer({ open, onClose, onCreado }: { open: boolean; onClose: () => void; onCreado: (id: string) => void }) {
  const categorias = useCategorias();
  const catalogo = useColores();
  const config = useConfig();
  const crear = useCrearProducto();
  const nuevoColor = useGuardarColor();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaElegida, setCategoriaElegida] = useState<string | null>(null);
  const [silueta, setSilueta] = useState<Silueta>("vestido");
  const [colorIds, setColorIds] = useState<string[]>([]);
  /** null = todas las tallas de la categoría. */
  const [tallasElegidas, setTallasElegidas] = useState<string[] | null>(null);
  const [sucursal, setSucursal] = useState<SucursalId>("temixco");
  const [stock, setStock] = useState<Record<string, number[]>>({});
  const [precio, setPrecio] = useState("");
  const [permiteApartado, setPermiteApartado] = useState(true);
  const [formColor, setFormColor] = useState<{ nombre: string; hex: string } | null>(null);

  const categoria = categorias.data?.find((c) => c.id === categoriaElegida) ?? categorias.data?.[0];
  const categoriaId = categoria?.id ?? "";
  const tallas = useMemo(() => tallasElegidas ?? categoria?.tallas ?? [], [tallasElegidas, categoria]);
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
    () => tallas.reduce((n, t) => n + colores.reduce((m, _, ci) => m + (stock[t]?.[ci] ?? 0), 0), 0),
    [tallas, colores, stock],
  );

  function toggleColor(id: string) {
    setColorIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    setStock({});
  }

  function toggleTalla(t: string) {
    if (!categoria) return;
    const base = tallas.includes(t) ? tallas.filter((x) => x !== t) : categoria.tallas.filter((x) => x === t || tallas.includes(x));
    if (base.length === 0) return toast.error("Deja al menos una talla.");
    setTallasElegidas(base);
    setStock({});
  }

  function crearColorRapido() {
    if (!formColor) return;
    nuevoColor.mutate(
      { id: null, input: formColor },
      {
        onSuccess: (c) => {
          setColorIds((ids) => [...ids, c.id]);
          setFormColor(null);
          setStock({});
          toast.success(`“${c.nombre}” agregado a tus colores`);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  function setCelda(t: string, ci: number, v: number) {
    setStock((s) => {
      const fila = [...(s[t] ?? colores.map(() => 0))];
      fila[ci] = Math.max(0, Math.min(99, v));
      return { ...s, [t]: fila };
    });
  }

  function publicar() {
    crear.mutate(
      {
        nombre,
        descripcion,
        categoriaId,
        silueta,
        precio: Number(precio),
        colores,
        tallas,
        stock,
        sucursal,
        permiteApartado,
      },
      {
        onSuccess: (p) => {
          toast.success("¡Prenda publicada!");
          onCreado(p.id);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }


  return (
    <Drawer open={open} onClose={onClose} title="Nuevo producto">
      <Pasos
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
                    setStock({});
                  }}
                  opciones={(categorias.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
                />
                <Select
                  label="Tipo de prenda (para la ilustración)"
                  value={silueta}
                  onChange={(e) => setSilueta(e.target.value as Silueta)}
                  opciones={SILUETAS.map((s) => ({ value: s.id, label: s.nombre }))}
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
                  <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                    {(catalogo.data ?? []).map((c) => {
                      const activo = colorIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => toggleColor(c.id)}
                          className={cn(
                            "flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-body-sm",
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
                  </div>

                  {formColor ? (
                    <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-outline-variant p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-label-lg">Nuevo color</p>
                        <button
                          type="button"
                          onClick={() => setFormColor(null)}
                          aria-label="Cancelar nuevo color"
                          className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <CamposColor
                        nombre={formColor.nombre}
                        hex={formColor.hex}
                        onNombre={(nombre) => setFormColor({ ...formColor, nombre })}
                        onHex={(hex) => setFormColor({ ...formColor, hex })}
                      />
                      <Button
                        variant="tinta"
                        size="sm"
                        loading={nuevoColor.isPending}
                        disabled={formColor.nombre.trim().length < 2 || !/^#[0-9A-F]{6}$/i.test(formColor.hex)}
                        onClick={crearColorRapido}
                      >
                        Agregar y usar
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFormColor({ nombre: "", hex: "#A7D7C5" })}
                      className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-label-lg text-primary-strong hover:bg-primary-soft"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      ¿No está? Crear color
                    </button>
                  )}
                </fieldset>
                <fieldset>
                  <legend className="mb-1 text-label-lg">Tallas</legend>
                  <p className="mb-2 text-body-sm text-on-surface-variant">
                    De la categoría <strong className="text-on-surface">{categoria?.nombre}</strong>. Apaga las que no tenga esta prenda.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(categoria?.tallas ?? []).map((t) => (
                      <Chip key={t} activo={tallas.includes(t)} onClick={() => toggleTalla(t)} className="min-w-12 justify-center">
                        {t}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              </div>
            ),
          },
          {
            titulo: "Stock",
            valido: totalPiezas > 0,
            contenido: (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {(["temixco", "azteca"] as const).map((s) => (
                    <Chip key={s} activo={sucursal === s} onClick={() => setSucursal(s)}>
                      {s === "temixco" ? "Temixco" : "La Azteca"}
                    </Chip>
                  ))}
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
                            const v = stock[t]?.[ci] ?? 0;
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
                  silueta={silueta}
                  precio={Number(precio)}
                  colores={colores}
                  tallas={tallas}
                  stock={stock}
                  totalPiezas={totalPiezas}
                  sucursal={sucursal}
                  permiteApartado={permiteApartado}
                  anticipoPct={config.data?.anticipoPct ?? 50}
                />
                <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                  <ImagePlus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Las fotos reales se suben en la siguiente versión; mientras tanto se muestra la ilustración en cada color.
                </p>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
