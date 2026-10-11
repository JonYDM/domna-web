import { useEffect } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/cn";

interface PinPadProps {
  /** Valor actual del PIN (solo dígitos). */
  value: string;
  onChange: (value: string) => void;
  /** Largo del PIN (default 6). */
  longitud?: number;
  /** Se dispara al completar el largo (p. ej. para enviar automáticamente). */
  onComplete?: (value: string) => void;
  /** Marca los puntos en rojo de error (PIN incorrecto). */
  error?: boolean;
  autoFocusTeclado?: boolean;
}

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

/**
 * Teclado numérico con glassmorphism para capturar un PIN. Muestra los puntos llenándose en vivo.
 * Teclas de vidrio (backdrop-blur) sobre el fondo de marca; feedback de presión al tocar.
 * Acepta también el teclado físico (dígitos y Backspace).
 */
export function PinPad({ value, onChange, longitud = 6, onComplete, error, autoFocusTeclado = true }: PinPadProps) {
  function escribir(d: string) {
    if (value.length >= longitud) return;
    const nuevo = value + d;
    onChange(nuevo);
    if (nuevo.length === longitud) onComplete?.(nuevo);
  }

  function borrar() {
    if (value.length > 0) onChange(value.slice(0, -1));
  }

  // Teclado físico (desktop / teclado externo).
  useEffect(() => {
    if (!autoFocusTeclado) return;
    function onKey(e: KeyboardEvent) {
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        escribir(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        borrar();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, autoFocusTeclado]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Puntos: se van llenando. */}
      <div className="flex items-center gap-3.5" role="status" aria-label={`${value.length} de ${longitud} dígitos`}>
        {Array.from({ length: longitud }).map((_, i) => {
          const lleno = i < value.length;
          return (
            <span
              key={i}
              className={cn(
                "h-3.5 w-3.5 rounded-full border transition-all duration-200 ease-out-expo",
                lleno
                  ? error
                    ? "scale-100 border-error bg-error anim-pop"
                    : "scale-100 border-primary bg-primary anim-pop"
                  : "scale-90 border-outline-variant bg-transparent",
              )}
            />
          );
        })}
      </div>

      {/* Keypad de vidrio. */}
      <div className="grid grid-cols-3 gap-3">
        {TECLAS.map((t, i) => {
          if (t === "") return <span key={i} aria-hidden />;
          const esBorrar = t === "del";
          return (
            <button
              key={i}
              type="button"
              onClick={() => (esBorrar ? borrar() : escribir(t))}
              aria-label={esBorrar ? "Borrar" : `Número ${t}`}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl font-marca text-[26px] text-on-surface",
                "border border-white/60 bg-white/55 shadow-soft backdrop-blur-md",
                "transition-all duration-150 ease-out-expo active:scale-90 active:bg-white/80",
                "hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                esBorrar && "text-on-surface-variant",
              )}
            >
              {esBorrar ? <Delete className="h-6 w-6" aria-hidden /> : t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
