import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Check, ImagePlus, Pipette, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { nombreDeHex, promedioColor } from "@/lib/colorMuestra";

/** Foto disponible para tomar color (la vista previa ya optimizada de las fotos que se están subiendo). */
export interface FotoParaColor {
  preview: string;
}

const LADO_MUESTRA = 900; // px del lado mayor del lienzo del que se lee el color
const PASO_TECLA = 0.02; // 2 % del ancho/alto por flecha

/**
 * Elegir el color de la prenda tocando su foto (como un gotero). Se promedian los píxeles de
 * alrededor para no quedarse con un reflejo. Funciona con una foto que ya se está subiendo o con
 * una nueva del teléfono; nada sale del navegador. También con teclado: flechas y Enter.
 */
export function ColorDeFoto({
  fotos,
  onUsar,
  onCerrar,
}: {
  fotos: FotoParaColor[];
  onUsar: (hex: string, nombreSugerido: string) => void;
  onCerrar: () => void;
}) {
  const [fuente, setFuente] = useState<string | null>(fotos[0]?.preview ?? null);
  const [propia, setPropia] = useState<string | null>(null);
  const [punto, setPunto] = useState<{ x: number; y: number } | null>(null);
  const [muestra, setMuestra] = useState<string | null>(null);
  const [presionando, setPresionando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrada = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const imagen = useRef<HTMLImageElement>(null);
  const pixeles = useRef<ImageData | null>(null);

  // Libera la foto que subió el usuario al cambiarla o al cerrar.
  useEffect(() => () => { if (propia) URL.revokeObjectURL(propia); }, [propia]);

  function alElegirArchivo(archivo: File | undefined) {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("Elige una foto.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(archivo);
    setPropia(url);
    setFuente(url);
    reiniciar();
    if (entrada.current) entrada.current.value = "";
  }

  function reiniciar() {
    setPunto(null);
    setMuestra(null);
    pixeles.current = null;
  }

  /** Lee los píxeles una sola vez al cargar la foto; después cada toque solo promedia. */
  function alCargar() {
    const img = imagen.current;
    if (!img || !img.naturalWidth) return;
    const escala = Math.min(1, LADO_MUESTRA / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const lienzo = document.createElement("canvas");
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setError("Tu navegador no permite leer el color de la foto.");
      return;
    }
    try {
      ctx.drawImage(img, 0, 0, w, h);
      pixeles.current = ctx.getImageData(0, 0, w, h);
      setError(null);
    } catch {
      pixeles.current = null;
      setError("No se pudo leer esa foto. Prueba con otra.");
    }
  }

  function muestrear(fx: number, fy: number) {
    const d = pixeles.current;
    if (!d) return;
    const x = Math.min(Math.max(fx, 0), 1);
    const y = Math.min(Math.max(fy, 0), 1);
    setPunto({ x, y });
    setMuestra(promedioColor(d.data, d.width, d.height, x * (d.width - 1), y * (d.height - 1), 4));
  }

  function desdePuntero(e: PointerEvent<HTMLDivElement>) {
    const r = contenedor.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return;
    muestrear((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }

  function alPresionar(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPresionando(true);
    desdePuntero(e);
  }

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    const paso = e.shiftKey ? PASO_TECLA * 5 : PASO_TECLA;
    const base = punto ?? { x: 0.5, y: 0.5 };
    if (e.key === "ArrowLeft") muestrear(base.x - paso, base.y);
    else if (e.key === "ArrowRight") muestrear(base.x + paso, base.y);
    else if (e.key === "ArrowUp") muestrear(base.x, base.y - paso);
    else if (e.key === "ArrowDown") muestrear(base.x, base.y + paso);
    else if (e.key === "Enter" && muestra) onUsar(muestra, nombreDeHex(muestra));
    else if (e.key === "Escape") onCerrar();
    else return;
    e.preventDefault();
  }

  const sugerido = muestra ? nombreDeHex(muestra) : "";
  const miniaturas = [...fotos.map((f) => f.preview), ...(propia ? [propia] : [])];

  return (
    <section aria-label="Tomar el color de una foto" className="flex flex-col gap-3 rounded-2xl border border-outline-variant p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-label-lg">
          <Pipette className="h-4 w-4 text-primary" aria-hidden />
          Toca la prenda en la foto
        </p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar selector de color de la foto"
          className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <input ref={entrada} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Elegir una foto" onChange={(e) => alElegirArchivo(e.target.files?.[0])} />

      {miniaturas.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos disponibles">
          {miniaturas.map((src, i) => (
            <button
              key={`${i}-${src.slice(-24)}`}
              type="button"
              aria-pressed={fuente === src}
              aria-label={`Usar la foto ${i + 1}`}
              onClick={() => {
                setFuente(src);
                reiniciar();
              }}
              className={cn(
                "h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2",
                fuente === src ? "border-tinta" : "border-transparent",
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {fuente ? (
        <div className="flex justify-center rounded-xl bg-surface-container-low p-2">
          <div
            ref={contenedor}
            role="application"
            tabIndex={0}
            aria-label="Foto de la prenda. Toca para elegir el color, o usa las flechas y Enter."
            onPointerDown={alPresionar}
            onPointerMove={(e) => presionando && desdePuntero(e)}
            onPointerUp={() => setPresionando(false)}
            onPointerCancel={() => setPresionando(false)}
            onKeyDown={alTeclear}
            className="relative inline-block max-w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <img
              ref={imagen}
              src={fuente}
              alt=""
              draggable={false}
              onLoad={alCargar}
              className="block h-auto max-h-[46dvh] w-auto max-w-full"
            />
            {punto && muestra && (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.65)]"
                  style={{ left: `${punto.x * 100}%`, top: `${punto.y * 100}%` }}
                />
                {presionando && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute h-14 w-14 -translate-x-1/2 rounded-full border-[3px] border-white shadow-lift"
                    style={{
                      left: `${Math.min(Math.max(punto.x, 0.1), 0.9) * 100}%`,
                      top: `calc(${punto.y * 100}% - 64px)`,
                      backgroundColor: muestra,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-surface-container-low px-3 py-6 text-center text-body-sm text-on-surface-variant">
          Elige una foto de la prenda para tomar su color.
        </p>
      )}

      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}

      <p className="sr-only" aria-live="polite">
        {muestra ? `Color ${muestra}, ${sugerido}` : ""}
      </p>

      <div className="flex items-center gap-3">
        <span
          className={cn("h-11 w-11 shrink-0 rounded-full border", muestra && esClaro(muestra) ? "border-outline-variant" : "border-transparent bg-surface-container")}
          style={muestra ? { backgroundColor: muestra } : undefined}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="tabular text-label-lg">{muestra ?? "Sin elegir"}</p>
          <p className="truncate text-body-sm text-on-surface-variant">
            {muestra ? `Parecido a: ${sugerido}` : "Mantén presionado y arrastra para afinar."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => entrada.current?.click()}>
          <ImagePlus className="h-4 w-4" aria-hidden />
          {fotos.length > 0 || propia ? "Otra foto" : "Elegir foto"}
        </Button>
        <Button type="button" variant="tinta" size="sm" className="flex-1" disabled={!muestra} onClick={() => muestra && onUsar(muestra, sugerido)}>
          <Check className="h-4 w-4" aria-hidden />
          Usar este color
        </Button>
      </div>
    </section>
  );
}
