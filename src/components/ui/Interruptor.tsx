import { useId } from "react";
import { cn } from "@/lib/cn";

interface InterruptorProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  descripcion?: string;
  disabled?: boolean;
}

/** Switch accesible (role="switch") con etiqueta y descripción. */
export function Interruptor({ checked, onChange, label, descripcion, disabled }: InterruptorProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-label-lg text-on-surface">
          {label}
        </label>
        {descripcion && <p className="text-body-sm text-on-surface-variant">{descripcion}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50",
          checked ? "bg-primary-strong" : "bg-surface-container-high",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest shadow-xs transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
