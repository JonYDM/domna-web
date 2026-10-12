import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Tono del estado: define el ícono neutro que acompaña el mensaje. */
export type ExpresionEstado = "triste" | "curiosa" | "feliz" | "enamorada" | "dormida" | "guino";

const ICONO: Record<ExpresionEstado, LucideIcon> = {
  triste: AlertCircle,
  curiosa: Search,
  feliz: CheckCircle2,
  enamorada: CheckCircle2,
  guino: CheckCircle2,
  dormida: Clock,
};

interface EmptyStateProps {
  titulo: string;
  texto?: string;
  expresion?: ExpresionEstado;
  accion?: ReactNode;
  className?: string;
}

/** Estado vacío o de error: ícono neutro, título y texto. Sin mascota (marca blanca). */
export function EmptyState({ titulo, texto, expresion = "curiosa", accion, className }: EmptyStateProps) {
  const Icono = ICONO[expresion];
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-container text-on-surface-variant">
        <Icono className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-5 font-marca text-headline-md text-on-surface">{titulo}</h2>
      {texto && <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{texto}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
