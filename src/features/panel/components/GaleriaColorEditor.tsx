import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { ProductoDetalle } from "@/types/api";
import { mensajeError } from "@/lib/errores";
import { procesarImagenProducto } from "@/lib/imagen";
import { subirImagenProducto } from "@/api/imagenes";
import { MAX_FOTOS_POR_COLOR } from "./FotosPorColor";
import { useGaleriaProducto } from "../hooks";

/**
 * Editor de la galería por color (en el drawer de edición):
 * - Varias fotos: cada una con X para quitarla directo.
 * - Última foto del color: botones "Reemplazar" (sube otra, el color se queda) o "Quitar" (con
 *   confirmación: se deja de mostrar el color y se borra con sus variantes).
 * - Botón "+ Agregar fotos" por color (respeta el máximo).
 */
export function GaleriaColorEditor({ producto }: { producto: ProductoDetalle }) {
  const { quitarImagen, agregarImagenes, quitarColor } = useGaleriaProducto(producto.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendoEn, setSubiendoEn] = useState<string | null>(null); // colorId en subida
  const [reemplazando, setReemplazando] = useState<string | null>(null); // colorId cuya última foto se reemplaza
  const [confirmarColor, setConfirmarColor] = useState<string | null>(null); // colorId a quitar
  const [objetivoColor, setObjetivoColor] = useState<string | null>(null); // colorId objetivo del input file

  const ocupado = quitarImagen.isPending || agregarImagenes.isPending || quitarColor.isPending || !!subiendoEn;

  async function subirYAgregar(colorId: string, files: FileList, reemplazarUrl?: string) {
    setSubiendoEn(colorId);
    try {
      const procesadas = await Promise.all(Array.from(files).map((f) => procesarImagenProducto(f)));
      const urls: string[] = [];
      for (const img of procesadas) {
        const url = await subirImagenProducto(producto.id, img);
        if (url) urls.push(url);
      }
      if (urls.length === 0) throw new Error("No se pudo subir la foto.");
      await agregarImagenes.mutateAsync({ colorId, urls });
      // Si era un reemplazo de la última foto, quitamos la vieja después de subir la nueva.
      if (reemplazarUrl) await quitarImagen.mutateAsync(reemplazarUrl);
      toast.success(reemplazarUrl ? "Foto reemplazada" : "Fotos agregadas");
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setSubiendoEn(null);
      setReemplazando(null);
      setObjetivoColor(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0 || !objetivoColor) return;
    subirYAgregar(objetivoColor, files, reemplazando ?? undefined);
  }

  function pedirFotos(colorId: string, reemplazarUrl?: string) {
    setObjetivoColor(colorId);
    setReemplazando(reemplazarUrl ?? null);
    inputRef.current?.click();
  }

  async function borrarFoto(colorId: string, url: string, esUltima: boolean) {
    if (esUltima) {
      setConfirmarColor(colorId); // dispara la confirmación de quitar el color
      return;
    }
    try {
      await quitarImagen.mutateAsync(url);
      toast.success("Foto quitada");
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  async function confirmarQuitarColor(colorId: string) {
    try {
      await quitarColor.mutateAsync(colorId);
      toast.success("Color quitado de la prenda");
    } catch (e) {
      toast.error(mensajeError(e)); // p. ej. 409 por apartados o único color
    } finally {
      setConfirmarColor(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />

      {producto.colores.map((c) => {
        const fotos = producto.imagenes.filter((i) => i.colorId === c.id);
        const unica = fotos.length === 1;
        const subiendo = subiendoEn === c.id;
        const confirmando = confirmarColor === c.id;

        return (
          <div key={c.id} className="rounded-xl border border-outline-variant/70 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full border border-on-surface/10" style={{ backgroundColor: c.hex }} aria-hidden />
              <span className="text-body-sm">{c.nombre}</span>
              <span className="text-body-sm text-on-surface-variant">· {fotos.length}/{MAX_FOTOS_POR_COLOR}</span>
            </div>

            {confirmando ? (
              <div className="rounded-lg bg-warning-container p-3">
                <p className="text-body-sm text-on-surface">
                  Es la última foto de <strong>{c.nombre}</strong>. Si la quitas, este color se dejará de mostrar en la tienda y se borrará de la prenda.
                </p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setConfirmarColor(null)} className="h-9 rounded-full border border-outline-variant px-3 text-label-md">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => pedirFotos(c.id, fotos[0]?.url)} className="h-9 rounded-full bg-tinta px-3 text-label-md text-on-primary">
                    Mejor reemplazar
                  </button>
                  <button type="button" onClick={() => confirmarQuitarColor(c.id)} disabled={ocupado} className="h-9 rounded-full bg-error px-3 text-label-md text-white disabled:opacity-50">
                    Quitar color
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fotos.map((f, i) => (
                  <div key={i} className="relative h-20 w-[60px] overflow-hidden rounded-md ring-1 ring-black/5">
                    <img src={f.url} alt={`${c.nombre} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => borrarFoto(c.id, f.url, unica)}
                      disabled={ocupado}
                      aria-label={`Quitar foto ${i + 1} de ${c.nombre}`}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-soft disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}

                {unica && (
                  <button
                    type="button"
                    onClick={() => pedirFotos(c.id, fotos[0]?.url)}
                    disabled={ocupado}
                    className="h-20 rounded-md border border-outline-variant px-3 text-label-md text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    Reemplazar
                  </button>
                )}

                {fotos.length < MAX_FOTOS_POR_COLOR && (
                  <button
                    type="button"
                    onClick={() => pedirFotos(c.id)}
                    disabled={ocupado}
                    className="grid h-20 w-[60px] place-items-center rounded-md border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-50"
                    aria-label={`Agregar fotos de ${c.nombre}`}
                  >
                    {subiendo ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
                  </button>
                )}

                {fotos.length === 0 && <span className="self-center text-body-sm text-on-surface-variant">Sin fotos</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
