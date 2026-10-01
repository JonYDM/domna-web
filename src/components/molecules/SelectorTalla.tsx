import { cn } from "@/lib/cn";

interface SelectorTallaProps {
  tallas: string[];
  seleccionada: string | null;
  onChange: (talla: string) => void;
  /** Disponible por talla (para el color elegido). */
  disponible: Record<string, number>;
}

/** Tallas en botones; las agotadas se ven tachadas y no se pueden elegir. */
export function SelectorTalla({ tallas, seleccionada, onChange, disponible }: SelectorTallaProps) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-label-lg text-on-surface">Talla</legend>
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {tallas.map((t) => {
          const agotada = (disponible[t] ?? 0) <= 0;
          const activa = seleccionada === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={activa}
              aria-label={`Talla ${t}${agotada ? ", agotada" : ""}`}
              disabled={agotada}
              onClick={() => onChange(t)}
              className={cn(
                "relative h-12 min-w-[3.25rem] rounded-xl border px-3 text-label-lg transition-colors",
                activa
                  ? "border-tinta bg-tinta text-on-primary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline",
                agotada &&
                  "cursor-not-allowed border-dashed bg-surface-container-low text-outline line-through decoration-1",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
