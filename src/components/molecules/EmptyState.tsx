import type { ReactNode } from "react";
import { Domi, type ExpresionDomi } from "@/components/ilustraciones/Domi";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  titulo: string;
  texto?: string;
  expresion?: ExpresionDomi;
  accion?: ReactNode;
  className?: string;
}

/** Estado vacío o de error con Domi. Domi acompaña, no compite. */
export function EmptyState({ titulo, texto, expresion = "curiosa", accion, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <Domi expresion={expresion} size={112} />
      <h2 className="mt-5 font-marca text-headline-md text-on-surface">{titulo}</h2>
      {texto && <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{texto}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
