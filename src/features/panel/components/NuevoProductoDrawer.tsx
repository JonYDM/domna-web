import { useMemo, useState } from "react";
import { ImagePlus, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { FamiliaColor, Silueta, SucursalId } from "@/types/api";
import { Chip, Drawer, Input, Interruptor, Pasos, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { FAMILIAS_COLOR, SILUETAS, TALLAS_NUMERICAS, TALLAS_ROPA, TALLA_UNICA } from "@/lib/enums";
import { mensajeError } from "@/lib/errores";
import { useCategorias, useConfig } from "@/features/catalogo/hooks";
import { useCrearProducto } from "../hooks";
import { ResumenProducto } from "./ResumenProducto";

const JUEGOS_TALLAS = [
  { id: "ropa", label: "CH · M · G · XG", tallas: TALLAS_ROPA },
  { id: "num", label: "3 · 5 · 7 · 9 · 11", tallas: TALLAS_NUMERICAS },
  { id: "unica", label: "Única", tallas: TALLA_UNICA },
];

interface ColorNuevo {
  nombre: string;
  hex: string;
  familia: FamiliaColor;
}

/** Alta de producto en pasos: datos → colores y tallas → stock (matriz) → precio y publicar. */
export function NuevoProductoDrawer({ open, onClose, onCreado }: { open: boolean; onClose: () => void; onCreado: (id: string) => void }) {
  const categorias = useCategorias();
  const config = useConfig();
  const crear = useCrearProducto();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("vestidos");
  const [silueta, setSilueta] = useState<Silueta>("vestido");
  const [colores, setColores] = useState<ColorNuevo[]>([]);
  const [juego, setJuego] = useState("ropa");
  const [sucursal, setSucursal] = useState<SucursalId>("temixco");
  const [stock, setStock] = useState<Record<string, number[]>>({});
  const [precio, setPrecio] = useState("");
  const [permiteApartado, setPermiteApartado] = useState(true);

  const tallas = JUEGOS_TALLAS.find((j) => j.id === juego)!.tallas;
  const totalPiezas = useMemo(
    () => tallas.reduce((n, t) => n + colores.reduce((m, _, ci) => m + (stock[t]?.[ci] ?? 0), 0), 0),
    [tallas, colores, stock],
  );

  function toggleColor(f: (typeof FAMILIAS_COLOR)[number]) {
    setColores((cs) =>
      cs.some((c) => c.familia === f.id) ? cs.filter((c) => c.familia !== f.id) : [...cs, { nombre: f.nombre, hex: f.hex, familia: f.id }],
    );
    setStock({});
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
                  onChange={(e) => setCategoriaId(e.target.value)}
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
            valido: colores.length > 0,
            contenido: (
              <div className="flex flex-col gap-5">
                <fieldset>
                  <legend className="mb-2 text-label-lg">Colores</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {FAMILIAS_COLOR.map((f) => {
                      const activo = colores.some((c) => c.familia === f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => toggleColor(f)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-body-sm",
                            activo ? "border-tinta bg-surface-container-low" : "border-outline-variant",
                          )}
                        >
                          <span className="h-5 w-5 rounded-full border border-on-surface/10" style={{ backgroundColor: f.hex }} aria-hidden />
                          {f.nombre}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-label-lg">Tallas</legend>
                  <div className="flex flex-wrap gap-2">
                    {JUEGOS_TALLAS.map((j) => (
                      <Chip
                        key={j.id}
                        activo={juego === j.id}
                        onClick={() => {
                          setJuego(j.id);
                          setStock({});
                        }}
                      >
                        {j.label}
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
                          <th key={c.familia} className="px-1 text-label-md font-semibold">
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
                              <td key={c.familia} className="px-1">
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
