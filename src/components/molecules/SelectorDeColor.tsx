import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Check, Pipette } from "lucide-react";
import { Carrusel } from "@/components/molecules/Carrusel";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { hexAHsv, hsvAHex, normalizarHexTecleado, type Hsv } from "@/lib/colorHsv";
import { PALETA_REFERENCIA, nombreDeHex } from "@/lib/colorMuestra";

/** Tono con el que se muestra el selector mientras no hay color elegido (no cuenta como elegido). */
const HSV_INICIAL: Hsv = { h: 38, s: 0.18, v: 0.96 };

interface EyeDropperAPI {
  open: () => Promise<{ sRGBHex: string }>;
}
declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperAPI;
  }
}

/**
 * Selector de color: cuadro de saturación y brillo + barra de tono + paleta de colores de moda +
 * código editable (y gotero de pantalla donde el navegador lo ofrece). `hex` es "" mientras no se
 * ha elegido nada; solo se avisa por `onChange` cuando la persona realmente elige.
 * El estado interno es HSV para no perder el tono al pasar por grises o negros.
 */
export function SelectorDeColor({
  hex,
  onChange,
  onElegirNombre,
}: {
  hex: string;
  onChange: (hex: string) => void;
  /** Cuando se elige un color de la paleta, para que el formulario sugiera su nombre. */
  onElegirNombre?: (nombre: string) => void;
}) {
  const valido = /^#[0-9A-Fa-f]{6}$/.test(hex);
  const [hsv, setHsv] = useState<Hsv>(() => (valido ? hexAHsv(hex)! : HSV_INICIAL));
  const [texto, setTexto] = useState(hex);
  const [arrastrando, setArrastrando] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const hexPropio = useRef(hex);

  // Si el color cambia desde fuera (paleta, foto, nombre conocido), el selector lo sigue.
  useEffect(() => {
    if (hex.toUpperCase() === hexPropio.current.toUpperCase()) return;
    hexPropio.current = hex;
    setTexto(hex);
    const nuevo = hexAHsv(hex);
    if (nuevo) setHsv((actual) => (nuevo.s === 0 || nuevo.v === 0 ? { ...nuevo, h: actual.h } : nuevo));
  }, [hex]);

  function elegir(nuevo: Hsv) {
    setHsv(nuevo);
    const h = hsvAHex(nuevo);
    hexPropio.current = h;
    setTexto(h);
    onChange(h);
  }

  function desdePuntero(e: PointerEvent<HTMLDivElement>) {
    const r = area.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return;
    elegir({
      ...hsv,
      s: Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1),
      v: 1 - Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1),
    });
  }

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    const paso = e.shiftKey ? 0.1 : 0.02;
    if (e.key === "ArrowLeft") elegir({ ...hsv, s: Math.max(hsv.s - paso, 0) });
    else if (e.key === "ArrowRight") elegir({ ...hsv, s: Math.min(hsv.s + paso, 1) });
    else if (e.key === "ArrowUp") elegir({ ...hsv, v: Math.min(hsv.v + paso, 1) });
    else if (e.key === "ArrowDown") elegir({ ...hsv, v: Math.max(hsv.v - paso, 0) });
    else return;
    e.preventDefault();
  }

  function alEscribir(valor: string) {
    const limpio = valor.toUpperCase().replace(/[^#0-9A-F]/g, "").slice(0, 7);
    setTexto(limpio);
    const h = normalizarHexTecleado(limpio);
    if (h && (limpio.replace("#", "").length === 6 || limpio.replace("#", "").length === 3)) {
      const nuevo = hexAHsv(h)!;
      setHsv((actual) => (nuevo.s === 0 || nuevo.v === 0 ? { ...nuevo, h: actual.h } : nuevo));
      hexPropio.current = h;
      onChange(h);
    }
  }

  async function gotero() {
    if (!window.EyeDropper) return;
    try {
      const r = await new window.EyeDropper().open();
      alEscribir(r.sRGBHex);
    } catch {
      // La persona canceló con Escape: no es un error.
    }
  }

  const actual = hsvAHex(hsv);
  const mostrado = valido ? hex.toUpperCase() : actual;
  const nombre = valido ? nombreDeHex(hex) : "";
  const invalido = texto.replace("#", "").length > 0 && !normalizarHexTecleado(texto);
  const hayGotero = typeof window !== "undefined" && !!window.EyeDropper;
  const nombrePaleta = valido ? PALETA_REFERENCIA.find((c) => c.hex === hex.toUpperCase())?.nombre : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Vista previa grande: lo que se está eligiendo, con su nombre aproximado. */}
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full border-2 transition-colors",
            valido
              ? cn("shadow-soft", esClaro(mostrado) ? "border-outline-variant" : "border-transparent")
              : "border-dashed border-outline bg-surface-container-low text-on-surface-variant",
          )}
          style={valido ? { backgroundColor: mostrado } : undefined}
          aria-hidden
        >
          {!valido && <Pipette className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="tabular font-marca text-headline-sm">{valido ? mostrado : "Sin elegir"}</p>
          <p className="truncate text-body-sm text-on-surface-variant">
            {valido ? `Parecido a ${nombre}` : "Toca el cuadro, la paleta o una foto."}
          </p>
        </div>
      </div>

      {/* Saturación (→) y brillo (↑) */}
      <div
        ref={area}
        role="application"
        tabIndex={0}
        aria-roledescription="selector de saturación y brillo"
        aria-label="Color. Flechas izquierda y derecha cambian la intensidad; arriba y abajo, lo claro u oscuro."
        aria-valuetext={`Intensidad ${Math.round(hsv.s * 100)} %, brillo ${Math.round(hsv.v * 100)} %`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setArrastrando(true);
          desdePuntero(e);
        }}
        onPointerMove={(e) => arrastrando && desdePuntero(e)}
        onPointerUp={() => setArrastrando(false)}
        onPointerCancel={() => setArrastrando(false)}
        onKeyDown={alTeclear}
        className="relative h-44 w-full cursor-crosshair touch-none select-none overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        style={{ backgroundColor: `hsl(${Math.round(hsv.h)} 100% 50%)` }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #fff, rgba(255,255,255,0))" }} aria-hidden />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #000, rgba(0,0,0,0))" }} aria-hidden />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.4),0_3px_8px_rgba(0,0,0,0.3)] transition-transform",
            arrastrando && "scale-125",
            !valido && "opacity-50",
          )}
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: actual }}
        />
      </div>

      {/* Tono */}
      <div>
        <label htmlFor="tono-color" className="sr-only">
          Tono del color
        </label>
        <input
          id="tono-color"
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsv.h)}
          onChange={(e) => elegir({ ...hsv, h: Number(e.target.value) })}
          aria-valuetext={`Tono ${Math.round(hsv.h)} grados`}
          className="slider-tono"
          style={{ "--tono-actual": `hsl(${Math.round(hsv.h)} 100% 50%)` } as CSSProperties}
        />
      </div>

      {/* Paleta de colores de moda */}
      <fieldset>
        <legend className="mb-1 flex w-full items-baseline justify-between text-label-md text-on-surface-variant">
          <span>Colores de moda</span>
          {nombrePaleta && <span className="text-on-surface">{nombrePaleta}</span>}
        </legend>
        <Carrusel etiqueta="Colores de moda" filas={2}>
          {PALETA_REFERENCIA.map((c) => {
            const activo = valido && hex.toUpperCase() === c.hex;
            return (
              <button
                key={c.nombre}
                type="button"
                aria-label={c.nombre}
                aria-pressed={activo}
                title={c.nombre}
                onClick={() => {
                  alEscribir(c.hex);
                  onElegirNombre?.(c.nombre);
                }}
                className="grid h-11 w-11 snap-start place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border transition-transform",
                    esClaro(c.hex) ? "border-outline-variant" : "border-transparent",
                    activo && "scale-110 ring-2 ring-tinta ring-offset-2",
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {activo && <Check className={cn("h-4 w-4", esClaro(c.hex) ? "text-on-surface" : "text-white")} aria-hidden />}
                </span>
              </button>
            );
          })}
        </Carrusel>
      </fieldset>

      {/* Código */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="codigo-color" className="mb-1.5 block text-label-md text-on-surface-variant">
            Código
          </label>
          <input
            id="codigo-color"
            value={texto}
            onChange={(e) => alEscribir(e.target.value)}
            placeholder="#F5F0E1"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            aria-invalid={invalido}
            aria-describedby={invalido ? "codigo-color-error" : undefined}
            className={cn(
              "tabular h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-body-lg outline-none transition-colors focus:border-primary",
              invalido ? "border-error" : "border-outline-variant",
            )}
          />
        </div>
        {hayGotero && (
          <button
            type="button"
            onClick={gotero}
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-outline-variant px-4 text-label-lg hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <Pipette className="h-4 w-4" aria-hidden />
            Gotero
          </button>
        )}
      </div>
      {invalido && (
        <p id="codigo-color-error" className="-mt-2 text-body-sm text-error">
          Escribe 6 dígitos, por ejemplo #F5F0E1.
        </p>
      )}
    </div>
  );
}
