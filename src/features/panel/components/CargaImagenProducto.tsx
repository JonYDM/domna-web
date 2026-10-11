import { useRef, useState } from "react";
import { ImagePlus, Loader2, Scissors, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { procesarImagenProducto, quitarFondoYProcesar, type ImagenProcesada } from "@/lib/imagen";

/**
 * Carga de la foto del producto (Fase 1: procesa en el cliente, aún sin subir a R2).
 * Al elegir una imagen: la optimiza a WebP, saca el color dominante y genera un fondo degradado.
 * Opcional: "Quitar fondo" recorta la prenda con IA local (gratis, en el navegador) y la deja
 * flotando sobre su fondo a juego. Se puede revertir a la foto original.
 */
export function CargaImagenProducto({
  imagen,
  onImagen,
}: {
  imagen: ImagenProcesada | null;
  onImagen: (img: ImagenProcesada | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  /** File original (para quitar fondo / revertir sin re-elegir). */
  const [original, setOriginal] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [quitandoFondo, setQuitandoFondo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function elegir(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProcesando(true);
    try {
      const procesada = await procesarImagenProducto(file);
      setOriginal(file);
      onImagen(procesada);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la imagen.");
    } finally {
      setProcesando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function quitarFondo() {
    if (!original) return;
    setError(null);
    setQuitandoFondo(true);
    try {
      const recortada = await quitarFondoYProcesar(original);
      onImagen(recortada);
    } catch {
      setError("No se pudo quitar el fondo. Puedes dejar la foto original.");
    } finally {
      setQuitandoFondo(false);
    }
  }

  async function revertir() {
    if (!original) return;
    setError(null);
    setProcesando(true);
    try {
      onImagen(await procesarImagenProducto(original));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restaurar la foto.");
    } finally {
      setProcesando(false);
    }
  }

  function quitar() {
    setOriginal(null);
    onImagen(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => elegir(e.target.files?.[0])} />

      {imagen ? (
        <div className="flex flex-col gap-3">
          {/* Preview: la prenda (recortada o no) sobre su fondo degradado generado. */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl" style={{ background: imagen.fondoDegradado }}>
            <img src={imagen.preview} alt="Vista previa de la prenda" className="h-full w-full object-contain" />
            {quitandoFondo && (
              <div className="absolute inset-0 grid place-items-center bg-surface/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-on-surface">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
                  <span className="text-body-sm">Recortando la prenda…</span>
                  <span className="text-body-sm text-on-surface-variant">La primera vez tarda un poco más.</span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={quitar}
              aria-label="Quitar imagen"
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-soft backdrop-blur-sm transition-colors hover:bg-surface-container-lowest"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            {!quitandoFondo && (
              <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-on-surface/70 px-2.5 py-1 text-label-sm text-white backdrop-blur-sm">
                {imagen.transparente ? "Recortada" : "Optimizada"} · {imagen.pesoKb} KB
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {imagen.transparente ? (
              <Button type="button" variant="soft" size="sm" onClick={revertir} disabled={procesando || quitandoFondo}>
                <Undo2 className="h-4 w-4" aria-hidden />
                Volver a la original
              </Button>
            ) : (
              <Button type="button" variant="tinta" size="sm" onClick={quitarFondo} loading={quitandoFondo} disabled={procesando}>
                <Scissors className="h-4 w-4" aria-hidden />
                Quitar fondo
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={quitandoFondo}>
              Cambiar foto
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="soft"
          size="lg"
          fullWidth
          onClick={() => inputRef.current?.click()}
          loading={procesando}
        >
          <ImagePlus className="h-5 w-5" aria-hidden />
          {procesando ? "Optimizando…" : "Agregar foto"}
        </Button>
      )}

      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
