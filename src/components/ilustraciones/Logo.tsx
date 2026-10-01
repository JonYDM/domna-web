import { cn } from "@/lib/cn";

/** Wordmark "Domna" con el lunar rojo como punto. */
export function Logo({ className, conLema = false }: { className?: string; conLema?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-marca font-bold tracking-tight text-on-surface">
        Domna<span className="text-primary">.</span>
      </span>
      {conLema && (
        <span className="mt-1.5 text-[0.32em] font-normal tracking-[0.18em] text-on-surface-variant">
          Tu estilo, apartado para ti
        </span>
      )}
    </span>
  );
}
