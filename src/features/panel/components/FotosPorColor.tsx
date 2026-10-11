import { useRef, useState } from "react";
import { ImagePlus, Loader2, Scissors, X } from "lucide-react";
import { procesarImagenProducto, quitarFondoYProcesar, type ImagenProcesada } from "@/lib/imagen";
import { cn } from "@/lib/cn";

export const MAX_FOTOS_POR_COLOR = 5;

interface ColorInfo {
  nombre: string;
  hex: string;
}

/**
 * Carga de fotos POR COLOR (modelo tipo Zara): por cada color del producto, hasta 5 fotos.
 * Cada foto se optimiza a WebP; opcionalmente se le quita el fondo. En la tienda, la galería
 * mostrará las fotos del color que elija la clienta.
 *
 * `fotos[i]` = arreglo de fotos del color de índice i. El wizard es dueño del estado.
 */
export function FotosPorColor({
  colores,
  fotos,
  onChange,
}: {
  colores: ColorInfo[];
  fotos: ImagenProcesada[][];
  onChange: (fotos: ImagenProcesada[][]) => void;
}) {
  if (colores.length === 0) {
    return (
      <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
        Elige al menos un color para subir sus fotos.
      </p>
    );
  }

  function setColor(i: number, lista: ImagenProcesada[]) {
    const copia = colores.map((_, idx) => fotos[idx] ?? []);
    copia[i] = lista;
    onChange(copia);
  }

  return (
    <div className="flex flex-col gap-4">
      {colores.map((c, i) => (
        <FilaColor key={`${c.nombre}-${i}`} color={c} fotos={fotos[i] ?? []} onChange={(l) => setColor(i, l)} />
      ))}
    </div>
  );
}

function FilaColor({
  color,
  fotos,
  onChange,
}: {
  color: ColorInfo;
  fotos: ImagenProcesada[];
  onChange: (fotos: ImagenProcesada[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [recortando, setRecortando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lleno = fotos.length >= MAX_FOTOS_POR_COLOR;

  async function agregar(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setProcesando(true);
    try {
      const cupo = MAX_FOTOS_POR_COLOR - fotos.length;
      const elegidos = Array.from(files).slice(0, cupo);
      const nuevas = await Promise.all(elegidos.map((f) => procesarImagenProducto(f)));
      onChange([...fotos, ...nuevas]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la imagen.");
    } finally {
      setProcesando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function quitarFondo(idx: number) {
    const original = fotos[idx]?.originalFile;
    if (!original) return;
    setRecortando(idx);
    try {
      const recortada = await quitarFondoYProcesar(original);
      const copia = [...fotos];
      copia[idx] = recortada;
      onChange(copia);
    } catch {
      setError("No se pudo quitar el fondo de una foto.");
    } finally {
      setRecortando(null);
    }
  }

  function quitar(idx: number) {
    onChange(fotos.filter((_, n) => n !== idx));
  }

  return (
    <div className="rounded-2xl border border-outline-variant/70 p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="h-5 w-5 rounded-full border border-on-surface/10" style={{ backgroundColor: color.hex }} aria-hidden />
        <span className="text-label-lg">{color.nombre}</span>
        <span className="text-body-sm text-on-surface-variant">· {fotos.length}/{MAX_FOTOS_POR_COLOR}</span>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => agregar(e.target.files)} />

      <div className="flex flex-wrap gap-2">
        {fotos.map((f, idx) => (
          <div key={idx} className="relative h-24 w-[72px] overflow-hidden rounded-lg" style={{ background: f.fondoDegradado }}>
            <img src={f.preview} alt={`${color.nombre} ${idx + 1}`} className="h-full w-full object-contain" />
            {recortando === idx && (
              <div className="absolute inset-0 grid place-items-center bg-surface/70">
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              </div>
            )}
            {/* Quitar fondo (si aún no está recortada) */}
            {!f.transparente && recortando === null && (
              <button
                type="button"
                onClick={() => quitarFondo(idx)}
                title="Quitar fondo"
                aria-label={`Quitar fondo de ${color.nombre} ${idx + 1}`}
                className="absolute bottom-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-soft"
              >
                <Scissors className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => quitar(idx)}
              aria-label={`Quitar foto ${idx + 1} de ${color.nombre}`}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-soft"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}

        {!lleno && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={procesando}
            className={cn(
              "grid h-24 w-[72px] place-items-center rounded-lg border border-dashed border-outline-variant text-on-surface-variant",
              "transition-colors hover:border-primary hover:text-primary disabled:opacity-60",
            )}
            aria-label={`Agregar foto de ${color.nombre}`}
          >
            {procesando ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-1.5 text-body-sm text-error">{error}</p>}
    </div>
  );
}
