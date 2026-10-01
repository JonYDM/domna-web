import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  activo?: boolean;
  icono?: ReactNode;
  contador?: number;
}

/** Chip de filtro: neutro por defecto, el activo en tinta (moda: negro elegante). */
export function Chip({ activo = false, icono, contador, children, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-label-lg transition-colors active:scale-[0.97]",
        activo
          ? "border-tinta bg-tinta text-on-primary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
        className,
      )}
      {...props}
    >
      {icono}
      {children}
      {contador !== undefined && (
        <span
          className={cn(
            "tabular ml-0.5 rounded-full px-1.5 text-label-sm",
            activo ? "bg-on-primary/20" : "bg-surface-container text-on-surface-variant",
          )}
        >
          {contador}
        </span>
      )}
    </button>
  );
}
