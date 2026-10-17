import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface Pestana<T extends string> {
  id: T;
  label: string;
  /** Pendientes (p. ej. apartados activos). Se muestra si es mayor a 0. */
  contador?: number;
}

interface PestanasProps<T extends string> {
  pestanas: Pestana<T>[];
  activo: T;
  onChange: (id: T) => void;
  "aria-label": string;
  className?: string;
}

/**
 * Pestañas de una sola línea: el texto y, debajo de la activa, una raya que la marca. Sin contenedor ni
 * fondo, para separar vistas de primer nivel sin cargar la pantalla. Se recorren con las flechas.
 */
export function Pestanas<T extends string>({ pestanas, activo, onChange, className, ...props }: PestanasProps<T>) {
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = pestanas.length - 1;
    const destino =
      e.key === "ArrowRight" ? (indice === ultimo ? 0 : indice + 1)
      : e.key === "ArrowLeft" ? (indice === 0 ? ultimo : indice - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? ultimo
      : null;
    if (destino === null) return;
    e.preventDefault();
    botones.current[destino]?.focus();
    onChange(pestanas[destino].id);
  }

  return (
    <div role="tablist" aria-label={props["aria-label"]} className={cn("flex border-b border-outline-variant/70", className)}>
      {pestanas.map(({ id, label, contador }, i) => {
        const sel = id === activo;
        return (
          <button
            key={id}
            ref={(el) => { botones.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={sel}
            tabIndex={sel ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => alTeclear(e, i)}
            className={cn(
              "relative flex h-12 min-w-0 flex-1 items-center justify-center gap-2 px-2 text-label-lg transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
              "after:absolute after:inset-x-4 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
              "after:origin-center after:transition-transform after:duration-200 motion-reduce:after:transition-none",
              sel ? "text-on-surface after:scale-x-100" : "text-on-surface-variant hover:text-on-surface after:scale-x-0",
            )}
          >
            <span className="truncate">{label}</span>
            {!!contador && (
              <span
                className={cn(
                  "tabular grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold",
                  sel ? "bg-primary-soft text-primary-on-soft" : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}