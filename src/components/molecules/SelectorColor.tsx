import { Check } from "lucide-react";
import type { ColorProducto } from "@/types/api";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";

interface SelectorColorProps {
  colores: ColorProducto[];
  seleccionado: string;
  onChange: (colorId: string) => void;
  /** Colores sin ninguna talla disponible. */
  agotados?: Set<string>;
}

/** Swatches con nombre (accesible y para daltonismo): radio group. */
export function SelectorColor({ colores, seleccionado, onChange, agotados }: SelectorColorProps) {
  const actual = colores.find((c) => c.id === seleccionado);
  return (
    <fieldset>
      <legend className="mb-2.5 text-label-lg text-on-surface">
        Color: <span className="font-normal text-on-surface-variant">{actual?.nombre}</span>
      </legend>
      <div role="radiogroup" className="flex flex-wrap gap-3">
        {colores.map((c) => {
          const activo = c.id === seleccionado;
          const agotado = agotados?.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={`${c.nombre}${agotado ? " (agotado)" : ""}`}
              title={c.nombre}
              onClick={() => onChange(c.id)}
              className={cn(
                "relative grid h-11 w-11 place-items-center rounded-full ring-offset-2 ring-offset-surface-container-lowest transition-all",
                activo ? "ring-2 ring-on-surface" : "ring-1 ring-outline-variant hover:ring-outline",
                agotado && "opacity-40",
              )}
            >
              <span className="h-9 w-9 rounded-full border border-on-surface/10" style={{ backgroundColor: c.hex }} />
              {activo && (
                <Check
                  className={cn("absolute h-4 w-4", esClaro(c.hex) ? "text-on-surface" : "text-on-primary")}
                  strokeWidth={3}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Puntitos de color para las cards. */
export function Swatches({ colores, max = 4 }: { colores: ColorProducto[]; max?: number }) {
  const extra = colores.length - max;
  return (
    <div className="flex items-center gap-1" aria-label={`Colores: ${colores.map((c) => c.nombre).join(", ")}`}>
      {colores.slice(0, max).map((c) => (
        <span
          key={c.id}
          className="h-3.5 w-3.5 rounded-full border border-on-surface/15"
          style={{ backgroundColor: c.hex }}
          aria-hidden
        />
      ))}
      {extra > 0 && <span className="text-label-sm text-on-surface-variant">+{extra}</span>}
    </div>
  );
}
