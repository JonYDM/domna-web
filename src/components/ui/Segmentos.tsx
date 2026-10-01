import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Segmento<T extends string> {
  id: T;
  label: string;
  icono?: LucideIcon;
  /** Pendientes (p. ej. apartados activos). Se muestra si es > 0. */
  contador?: number;
}

interface SegmentosProps<T extends string> {
  segmentos: Segmento<T>[];
  activo: T;
  onChange: (id: T) => void;
  "aria-label": string;
  className?: string;
}

/** Control segmentado (pestañas) para separar vistas de primer nivel: Apartados | Compras. */
export function Segmentos<T extends string>({ segmentos, activo, onChange, className, ...props }: SegmentosProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      className={cn("flex gap-1 rounded-2xl bg-surface-container p-1", className)}
    >
      {segmentos.map(({ id, label, icono: Icono, contador }) => {
        const sel = id === activo;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sel}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex h-11 min-w-0 flex-auto items-center justify-center gap-1.5 rounded-xl px-2.5 text-label-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              sel ? "bg-surface-container-lowest text-on-surface shadow-soft" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {Icono && (
              <Icono className={cn("h-4 w-4 shrink-0", segmentos.length > 2 && "hidden sm:block")} aria-hidden />
            )}
            <span className="truncate">{label}</span>
            {!!contador && (
              <span
                className={cn(
                  "tabular grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold",
                  sel ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant",
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
