import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SubItemNav {
  to: string;
  label: string;
  descripcion?: string;
  icono: LucideIcon;
}

export interface ItemNav {
  to: string;
  label: string;
  icono: LucideIcon;
  end?: boolean;
  contador?: number;
  /** Botón central elevado (p. ej. Inicio de la dueña). */
  destacado?: boolean;
  /** Si tiene menú, es un botón "Más" que abre un popover con estas opciones. */
  menu?: SubItemNav[];
}

/** "Más": agrupa pantallas secundarias en un popover para no saturar la barra. */
function MenuMas({ item, variante }: { item: ItemNav; variante: "inferior" | "superior" }) {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const activo = !!item.menu?.some((s) => pathname.startsWith(s.to));
  const Icono = item.icono;

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label={`${item.label}: ${item.menu?.map((s) => s.label).join(", ")}`}
        className={cn(
          variante === "inferior"
            ? "flex h-16 w-full flex-col items-center justify-center gap-1 text-label-sm transition-colors"
            : "flex h-10 items-center gap-2 rounded-full px-4 text-label-lg transition-colors",
          variante === "inferior" && (activo || abierto ? "text-primary-strong" : "text-on-surface-variant"),
          variante === "superior" &&
            (activo ? "bg-tinta text-on-primary" : abierto ? "bg-surface-container text-on-surface" : "text-on-surface-variant hover:bg-surface-container"),
        )}
      >
        <Icono className={variante === "inferior" ? "h-6 w-6" : "h-4 w-4"} strokeWidth={variante === "inferior" && activo ? 2.4 : 1.8} aria-hidden />
        {item.label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={variante === "inferior" ? "top" : "bottom"}
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="popover-anim z-50 w-[min(calc(100vw-24px),300px)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-lift outline-none"
        >
          <ul className="flex flex-col">
            {item.menu?.map(({ to, label, descripcion, icono: Sub }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                          isActive ? "bg-tinta text-on-primary" : "bg-surface-container text-on-surface-variant",
                        )}
                      >
                        <Sub className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-label-lg text-on-surface">{label}</span>
                        {descripcion && <span className="block truncate text-body-sm text-on-surface-variant">{descripcion}</span>}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Navegación inferior (móvil). Fondo sólido, safe-area, touch ≥ 44 px. */
export function BottomNav({ items }: { items: ItemNav[] }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/70 bg-surface-container-lowest md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const { to, label, icono: Icono, end, contador, destacado, menu } = item;
          return (
            <li key={to} className="flex-1">
              {menu ? (
                <MenuMas item={item} variante="inferior" />
              ) : destacado ? (
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
          );
        })}
      </ul>
    </nav>
  );
}

/** Navegación superior (escritorio). */
export function TopNav({ items }: { items: ItemNav[] }) {
  return (
    <nav aria-label="Navegación principal" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const { to, label, icono: Icono, end, contador, menu } = item;
          return (
            <li key={to}>
              {menu ? (
                <MenuMas item={item} variante="superior" />
              ) : (
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
                    <span className="tabular rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">{contador}</span>
                  )}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
