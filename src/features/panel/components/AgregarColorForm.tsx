import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ProductoDetalle, SucursalId } from "@/types/api";
import { Button, Chip, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { mensajeError } from "@/lib/errores";
import { useColores, useCategorias } from "@/features/catalogo/hooks";
import { subirFotosPorColor } from "@/api/imagenes";
import type { ImagenProcesada } from "@/lib/imagen";
import { useAgregarColor } from "../hooks";
import { FotosPorColor } from "./FotosPorColor";

/**
 * Agregar un color a un producto existente (modelo Zara): elige un color del catálogo, sube sus
 * fotos (máx 5), marca las tallas que llegan y su stock por sucursal. Sube las fotos a R2 y llama
 * al endpoint que crea las variantes nuevas.
 */
export function AgregarColorForm({ producto, onListo }: { producto: ProductoDetalle; onListo: () => void }) {
  const catalogo = useColores();
  const categorias = useCategorias();
  const agregar = useAgregarColor(producto.id);

  const yaUsados = new Set(producto.colores.map((c) => c.nombre.toLowerCase()));
  const disponibles = (catalogo.data ?? []).filter((c) => !yaUsados.has(c.nombre.toLowerCase()));
  const categoria = categorias.data?.find((c) => c.id === producto.categoriaId);
  const tallasCategoria = categoria?.tallas ?? producto.tallas;

  const [colorId, setColorId] = useState<string | null>(null);
  const [tallas, setTallas] = useState<string[]>([]);
  const [stock, setStock] = useState<Record<SucursalId, Record<string, number>>>({ temixco: {}, azteca: {} });
  const [fotos, setFotos] = useState<ImagenProcesada[][]>([[]]);
  const [subiendo, setSubiendo] = useState(false);

  const color = disponibles.find((c) => c.id === colorId) ?? null;
  const totalPiezas = useMemo(
    () => tallas.reduce((n, t) => n + (stock.temixco[t] ?? 0) + (stock.azteca[t] ?? 0), 0),
    [tallas, stock],
  );
  const valido = !!color && tallas.length > 0;

  function toggleTalla(t: string) {
    setTallas((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : tallasCategoria.filter((x) => x === t || prev.includes(x))));
  }

  function setCelda(suc: SucursalId, t: string, v: number) {
    setStock((s) => ({ ...s, [suc]: { ...s[suc], [t]: Math.max(0, Math.min(99, v)) } }));
  }

  async function guardar() {
    if (!color) return;
    setSubiendo(true);
    try {
      // Subir las fotos del color (una sola "columna" de color).
      const subidas = await subirFotosPorColor(producto.id, fotos);
      const urls = subidas.map((s) => s.url);
      // Stock al formato del backend: stock[suc][talla] = [cantidad].
      const stockApi: Record<SucursalId, Record<string, number[]>> = { temixco: {}, azteca: {} };
      for (const t of tallas) {
        stockApi.temixco[t] = [stock.temixco[t] ?? 0];
        stockApi.azteca[t] = [stock.azteca[t] ?? 0];
      }
      await agregar.mutateAsync({
        color: { nombre: color.nombre, hex: color.hex, familia: color.familia },
        tallas,
        stock: stockApi,
        fotos: urls,
      });
      toast.success(`Color ${color.nombre} agregado`);
      onListo();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Elegir color del catálogo (los que aún no usa la prenda). */}
      <fieldset>
        <legend className="mb-2 text-label-lg">Color</legend>
        {disponibles.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">Esta prenda ya usa todos tus colores del catálogo.</p>
        ) : (
          <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {disponibles.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={colorId === c.id}
                onClick={() => setColorId(c.id)}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-body-sm",
                  colorId === c.id ? "border-tinta bg-surface-container-low" : "border-outline-variant",
                )}
              >
                <span className={cn("h-5 w-5 shrink-0 rounded-full border", esClaro(c.hex) ? "border-outline-variant" : "border-transparent")} style={{ backgroundColor: c.hex }} aria-hidden />
                <span className="truncate">{c.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {color && (
        <>
          <fieldset>
            <legend className="mb-2 text-label-lg">Fotos de {color.nombre}</legend>
            <FotosPorColor colores={[{ nombre: color.nombre, hex: color.hex }]} fotos={fotos} onChange={setFotos} />
          </fieldset>

          <fieldset>
            <legend className="mb-1 text-label-lg">Tallas y stock</legend>
            <div className="mb-2 flex flex-wrap gap-2">
              {tallasCategoria.map((t) => (
                <Chip key={t} activo={tallas.includes(t)} onClick={() => toggleTalla(t)} className="min-w-12 justify-center">
                  {t}
                </Chip>
              ))}
            </div>
            {tallas.length > 0 && (
              <div className="flex flex-col gap-2">
                {tallas.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-10 text-label-lg">{t}</span>
                    {(["temixco", "azteca"] as const).map((suc) => (
                      <Input
                        key={suc}
                        label=""
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={String(stock[suc][t] ?? 0)}
                        onChange={(e) => setCelda(suc, t, Number(e.target.value))}
                        hint={suc === "temixco" ? "Temixco" : "La Azteca"}
                      />
                    ))}
                  </div>
                ))}
                <p className="tabular text-body-sm text-on-surface-variant">{totalPiezas} piezas en total</p>
              </div>
            )}
          </fieldset>

          <Button fullWidth disabled={!valido || subiendo} loading={subiendo || agregar.isPending} onClick={guardar}>
            Agregar color
          </Button>
        </>
      )}
    </div>
  );
}
