import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { hexAHsv, hsvAHex, type Hsv } from "@/lib/colorHsv";

/** Tono con el que se muestra el selector mientras no hay color elegido (no cuenta como elegido). */
const HSV_INICIAL: Hsv = { h: 38, s: 0.18, v: 0.96 };

/**
 * Selector de color: cuadro de saturación y brillo + barra de tono. `hex` es "" mientras no se ha
 * elegido nada; solo se avisa por `onChange` cuando la persona realmente elige. El estado interno
 * es HSV para no perder el tono al pasar por grises o negros. Funciona con el teclado.
 */
export function SelectorDeColor({ hex, onChange }: { hex: string; onChange: (hex: string) => void }) {
  const valido = /^#[0-9A-Fa-f]{6}$/.test(hex);
  const [hsv, setHsv] = useState<Hsv>(() => (valido ? hexAHsv(hex)! : HSV_INICIAL));
  const [arrastrando, setArrastrando] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const hexPropio = useRef(hex);

  // Si el color cambia desde fuera (una foto, un nombre conocido), el selector lo sigue.
  useEffect(() => {
    if (hex.toUpperCase() === hexPropio.current.toUpperCase()) return;
    hexPropio.current = hex;
    const nuevo = hexAHsv(hex);
    if (nuevo) setHsv((actual) => (nuevo.s === 0 || nuevo.v === 0 ? { ...nuevo, h: actual.h } : nuevo));
  }, [hex]);

  function elegir(nuevo: Hsv) {
    setHsv(nuevo);
    const h = hsvAHex(nuevo);
    hexPropio.current = h;
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

  const actual = hsvAHex(hsv);

  return (
    <div className="flex flex-col gap-3">
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
        className="relative h-52 w-full cursor-crosshair touch-none select-none overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
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
    </div>
  );
}
