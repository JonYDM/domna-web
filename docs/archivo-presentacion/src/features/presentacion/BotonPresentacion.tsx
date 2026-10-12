import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

/** Botón de info (arriba a la derecha) que abre la presentación "¿Qué es Domna?". */
export function BotonPresentacion({ className }: { className?: string }) {
  return (
    <Link
      to="/presentacion"
      aria-label="¿Qué es Domna? Ver presentación"
      title="¿Qué es Domna?"
      className={cn(
        "group inline-flex h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest pl-2 pr-3.5 text-label-lg text-on-surface shadow-soft transition-colors hover:border-primary hover:text-primary-strong",
        className,
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-primary-strong">
        <Info className="h-4 w-4" aria-hidden />
      </span>
      <span>¿Qué es Domna?</span>
    </Link>
  );
}
