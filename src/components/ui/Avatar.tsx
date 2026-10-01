import { cn } from "@/lib/cn";

const FONDOS = ["bg-primary-soft text-primary-on-soft", "bg-info-container text-info", "bg-success-container text-success", "bg-warning-container text-warning", "bg-surface-container-high text-on-surface"];

/** Avatar con iniciales; el color sale del nombre (estable). */
export function Avatar({ nombre, className }: { nombre: string; className?: string }) {
  const partes = nombre.trim().split(/\s+/);
  const iniciales = ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
  const i = [...nombre].reduce((n, ch) => n + ch.charCodeAt(0), 0) % FONDOS.length;
  return (
    <span
      className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-label-lg", FONDOS[i], className)}
      aria-hidden
    >
      {iniciales}
    </span>
  );
}
