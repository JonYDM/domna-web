import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";

export function PrecioTag({
  precio,
  precioAntes,
  tamano = "md",
  className,
}: {
  precio: number;
  precioAntes?: number;
  tamano?: "sm" | "md" | "lg";
  className?: string;
}) {
  const oferta = precioAntes && precioAntes > precio;
  return (
    <span className={cn("tabular inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-semibold",
          oferta ? "text-primary-strong" : "text-on-surface",
          tamano === "sm" && "text-label-lg",
          tamano === "md" && "text-body-lg",
          tamano === "lg" && "text-headline-md",
        )}
      >
        {formatMXN(precio)}
      </span>
      {oferta && (
        <span className={cn("text-on-surface-variant line-through", tamano === "lg" ? "text-body-lg" : "text-body-sm")}>
          <span className="sr-only">Antes </span>
          {formatMXN(precioAntes)}
        </span>
      )}
    </span>
  );
}
