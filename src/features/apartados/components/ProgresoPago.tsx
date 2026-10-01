import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";

/** Barra de avance del pago: pagado / total. */
export function ProgresoPago({ pagado, total, className }: { pagado: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((pagado / total) * 100)) : 0;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-container-high"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Pagado ${pct}%`}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="tabular flex justify-between text-body-sm text-on-surface-variant">
        <span>Pagado {formatMXN(pagado)}</span>
        <span>de {formatMXN(total)}</span>
      </div>
    </div>
  );
}
