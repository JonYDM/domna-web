import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ItemNav {
  to: string;
  label: string;
  icono: LucideIcon;
  end?: boolean;
  contador?: number;
  /** Botón central elevado (p. ej. Inicio de la dueña). */
  destacado?: boolean;
}

/** Navegación inferior (móvil). Fondo sólido, safe-area, touch ≥ 44 px. */
export function BottomNav({ items }: { items: ItemNav[] }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/70 bg-surface-container-lowest md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map(({ to, label, icono: Icono, end, contador, destacado }) => (
          <li key={to} className="flex-1">
            {destacado ? (
              <NavLink to={to} end={end} aria-label={label} className="group flex h-16 flex-col items-center justify-end gap-1 pb-1.5">
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "-mt-7 grid h-14 w-14 place-items-center rounded-full shadow-primary-glow ring-4 ring-surface-container-lowest transition-transform group-active:scale-95",
                        isActive ? "bg-primary-strong text-on-primary" : "bg-tinta text-on-primary",
                      )}
                    >
                      <Icono className="h-6 w-6" strokeWidth={2.2} aria-hidden />
                    </span>
                    <span className={cn("text-label-sm", isActive ? "text-primary-strong" : "text-on-surface-variant")}>{label}</span>
                  </>
                )}
              </NavLink>
            ) : (
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-label-sm transition-colors",
                  isActive ? "text-primary-strong" : "text-on-surface-variant",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icono className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                    {!!contador && (
                      <span className="tabular absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                        {contador}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Navegación superior (escritorio). */
export function TopNav({ items }: { items: ItemNav[] }) {
  return (
    <nav aria-label="Navegación principal" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map(({ to, label, icono: Icono, end, contador }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-2 rounded-full px-4 text-label-lg transition-colors",
                  isActive ? "bg-tinta text-on-primary" : "text-on-surface-variant hover:bg-surface-container",
                )
              }
            >
              <Icono className="h-4 w-4" aria-hidden />
              {label}
              {!!contador && (
                <span className="tabular rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
                  {contador}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
