import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowLeft, Check, ImagePlus, Pipette, Sun, Thermometer } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { ajustarColor, nombreDeHex, promedioColor } from "@/lib/colorMuestra";

/** Foto disponible para tomar color (la vista previa ya optimizada de las fotos que se están subiendo). */
export interface FotoParaColor {
  preview: string;
}

const LADO_MUESTRA = 900; // px del lado mayor del lienzo del que se lee el color
const PASO_TECLA = 0.02; // 2 % del ancho/alto por flecha

/**
 * Vista completa (un sub-paso del formulario) para elegir el color de una prenda desde su foto:
 * 1) tocar la prenda (se promedian los píxeles de alrededor), 2) corregir la luz si la foto sale
 * fría o cálida, 3) usar el color. Nada sale del navegador. También con teclado.
 */
export function ColorDeFoto({
  fotos,
  onUsar,
  onVolver,
}: {
  fotos: FotoParaColor[];
  onUsar: (hex: string, nombreSugerido: string) => void;
  onVolver: () => void;
}) {
  const [fuente, setFuente] = useState<string | null>(fotos[0]?.preview ?? null);
  const [propia, setPropia] = useState<string | null>(null);
  const [punto, setPunto] = useState<{ x: number; y: number } | null>(null);
  const [muestra, setMuestra] = useState<string | null>(null);
  const [calidez, setCalidez] = useState(0);
  const [claridad, setClaridad] = useState(0);
  const [presionando, setPresionando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrada = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const imagen = useRef<HTMLImageElement>(null);
  const pixeles = useRef<ImageData | null>(null);

  // Libera la foto que subió el usuario al cambiarla o al salir de la vista.
  useEffect(() => () => { if (propia) URL.revokeObjectURL(propia); }, [propia]);

  const final = muestra ? ajustarColor(muestra, calidez, claridad) : null;
  const sugerido = final ? nombreDeHex(final) : "";
  const ajustado = !!muestra && (calidez !== 0 || claridad !== 0);

  function reiniciarPunto() {
    setPunto(null);
    setMuestra(null);
    pixeles.current = null;
  }

  function cambiarFoto(src: string) {
    setFuente(src);
    setCalidez(0); // la corrección de luz es de cada foto
    setClaridad(0);
    reiniciarPunto();
  }

  function alElegirArchivo(archivo: File | undefined) {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("Elige una foto.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(archivo);
    setPropia(url);
    cambiarFoto(url);
    if (entrada.current) entrada.current.value = "";
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
    else if (e.key === "Enter" && final) onUsar(final, sugerido);
    else if (e.key === "Escape") onVolver();
    else return;
    e.preventDefault();
  }

  const miniaturas = [...fotos.map((f) => f.preview), ...(propia ? [propia] : [])];

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onVolver}
        className="-ml-2 inline-flex h-11 w-fit items-center gap-1.5 rounded-full pl-2 pr-4 text-label-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
        Volver al color
      </button>

      <input ref={entrada} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Elegir una foto" onChange={(e) => alElegirArchivo(e.target.files?.[0])} />

      {miniaturas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos disponibles">
          {miniaturas.map((src, i) => (
            <button
              key={`${i}-${src.slice(-24)}`}
              type="button"
              aria-pressed={fuente === src}
              aria-label={`Usar la foto ${i + 1}`}
              onClick={() => cambiarFoto(src)}
              className={cn("h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2", fuente === src ? "border-tinta" : "border-transparent")}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {fuente ? (
        <>
          <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Pipette className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Toca la prenda. Mantén presionado y arrastra para afinar.
          </p>
          <div className="flex justify-center rounded-2xl bg-surface-container-low p-2">
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
              className="relative inline-block max-w-full cursor-crosshair touch-none select-none overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <img
                ref={imagen}
                src={fuente}
                alt=""
                draggable={false}
                onLoad={alCargar}
                className="block h-auto max-h-[52dvh] w-auto max-w-full"
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
                        backgroundColor: final ?? muestra,
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 text-on-surface-variant hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-8 w-8" aria-hidden />
          <span className="text-label-lg">Elegir una foto de la prenda</span>
          <span className="text-body-sm">Desde tu galería o con la cámara</span>
        </button>
      )}

      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}

      {muestra && (
        <section aria-label="Corregir la luz de la foto" className="flex flex-col gap-3 rounded-2xl border border-outline-variant p-3">
          <p className="text-body-sm text-on-surface-variant">
            ¿La foto se ve más fría o más amarilla que la prenda? Corrígelo aquí.
          </p>
          <Control
            icono={<Thermometer className="h-4 w-4" aria-hidden />}
            etiqueta="Calidez"
            izquierda="Más fría"
            derecha="Más cálida"
            valor={calidez}
            onChange={setCalidez}
            min={-50}
            max={50}
          />
          <Control
            icono={<Sun className="h-4 w-4" aria-hidden />}
            etiqueta="Claridad"
            izquierda="Más oscura"
            derecha="Más clara"
            valor={claridad}
            onChange={setClaridad}
            min={-30}
            max={30}
          />
          {ajustado && (
            <button
              type="button"
              onClick={() => {
                setCalidez(0);
                setClaridad(0);
              }}
              className="inline-flex h-10 w-fit items-center rounded-full px-3 text-label-lg text-primary-strong hover:bg-primary-soft"
            >
              Quitar correcciones
            </button>
          )}
        </section>
      )}

      <p className="sr-only" aria-live="polite">
        {final ? `Color ${final}, parecido a ${sugerido}` : ""}
      </p>

      {/* Pie fijo de la vista: siempre a la mano aunque la foto sea alta. */}
      <div className="sticky bottom-0 -mx-5 flex flex-col gap-3 border-t border-outline-variant/60 bg-surface-container-lowest px-5 pb-1 pt-3">
        <div className="flex items-center gap-3">
          {ajustado && muestra ? (
            <span className="flex shrink-0 overflow-hidden rounded-full border border-outline-variant" aria-hidden title="Foto / corregido">
              <span className="h-11 w-6" style={{ backgroundColor: muestra }} />
              <span className="h-11 w-6" style={{ backgroundColor: final ?? muestra }} />
            </span>
          ) : (
            <span
              className={cn("h-11 w-11 shrink-0 rounded-full border", final && esClaro(final) ? "border-outline-variant" : "border-transparent bg-surface-container")}
              style={final ? { backgroundColor: final } : undefined}
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="tabular text-label-lg">{final ?? "Sin elegir"}</p>
            <p className="truncate text-body-sm text-on-surface-variant">
              {final ? `Parecido a: ${sugerido}${ajustado ? " · corregido" : ""}` : "Toca la prenda en la foto."}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => entrada.current?.click()}>
            <ImagePlus className="h-4 w-4" aria-hidden />
            {fuente ? "Otra foto" : "Elegir foto"}
          </Button>
        </div>
        <Button type="button" variant="tinta" size="lg" fullWidth disabled={!final} onClick={() => final && onUsar(final, sugerido)}>
          <Check className="h-5 w-5" aria-hidden />
          Usar este color
        </Button>
      </div>
    </div>
  );
}

function Control({
  icono,
  etiqueta,
  izquierda,
  derecha,
  valor,
  onChange,
  min,
  max,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  izquierda: string;
  derecha: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const id = `ajuste-${etiqueta.toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-label-md text-on-surface-variant">
        {icono}
        {etiqueta}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valor === 0 ? "Sin corrección" : valor > 0 ? `${derecha} ${valor}` : `${izquierda} ${-valor}`}
        className="h-11 w-full cursor-pointer accent-[rgb(var(--marca-strong))]"
      />
      <div className="flex justify-between text-body-sm text-on-surface-variant" aria-hidden>
        <span>{izquierda}</span>
        <span>{derecha}</span>
      </div>
    </div>
  );
}
