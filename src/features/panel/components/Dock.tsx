import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFab } from "../fab";
import { BusquedaDock } from "./BusquedaDock";

export interface ItemDock {
  to: string;
  label: string;
  icono: LucideIcon;
  end?: boolean;
  contador?: number;
}

export interface SubItemDock {
  to: string;
  label: string;
  descripcion?: string;
  icono: LucideIcon;
}

/** "Más" del dock: mismo popover que el resto, con el estilo del dock. */
function MasDock({ label, icono: Icono, items }: { label: string; icono: LucideIcon; items: SubItemDock[] }) {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const activo = items.some((s) => pathname.startsWith(s.to));

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label={`${label}: ${items.map((s) => s.label).join(", ")}`}
        className={cn(
          "flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full transition-colors",
          activo || abierto ? "text-on-surface" : "text-on-surface-variant",
        )}
      >
        <Icono className="h-5 w-5" strokeWidth={activo ? 2.3 : 1.8} aria-hidden />
        <span className="text-[10px] font-semibold leading-none">{label}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={12}
          collisionPadding={12}
          className="popover-anim z-50 w-[min(calc(100vw-24px),300px)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-lift outline-none"
        >
          <ul className="flex flex-col">
            {items.map(({ to, label: itemLabel, descripcion, icono: Sub }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", isActive ? "bg-tinta text-on-primary" : "bg-surface-container text-on-surface-variant")}>
                        <Sub className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-label-lg text-on-surface">{itemLabel}</span>
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

/**
 * Dock flotante del panel de la dueña (mobile-first): isla elevada del borde con blur, no una
 * barra pegada al borde. El FAB central (acción "agregar" de la pantalla activa) sobresale por
 * encima; la lupa abre el buscador en popover. Solo /app usa este Dock (no toca BottomNav).
 */
export function Dock({ items, mas, base }: { items: ItemDock[]; mas: { label: string; icono: LucideIcon; items: SubItemDock[] }; base: string }) {
  const fab = useFab();
  const FabIcono = fab?.icono ?? Plus;

  return (
    <nav aria-label="Navegación principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:hidden">
      <div className="relative mx-auto flex max-w-sm items-center justify-around rounded-[28px] border border-outline-variant/60 bg-surface-container-lowest/90 px-1.5 shadow-lift backdrop-blur-md">
        {items.slice(0, 2).map((item) => (
          <ItemBoton key={item.to} item={item} />
        ))}

        {/* Hueco para el FAB, que flota encima. */}
        <div className="w-16 shrink-0" aria-hidden />

        {items.slice(2).map((item) => (
          <ItemBoton key={item.to} item={item} />
        ))}
        <BusquedaDock base={base} />
        <MasDock label={mas.label} icono={mas.icono} items={mas.items} />

        {fab && (
          <button
            type="button"
            onClick={fab.onClick}
            aria-label={fab.label}
            className="absolute -top-6 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-primary-strong text-on-primary shadow-primary-glow transition-transform active:scale-95"
          >
            <FabIcono className="h-6 w-6" strokeWidth={2.2} aria-hidden />
          </button>
        )}
      </div>
    </nav>
  );
}

function ItemBoton({ item }: { item: ItemDock }) {
  const { to, label, icono: Icono, end, contador } = item;
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn("flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full transition-colors", isActive ? "text-on-surface" : "text-on-surface-variant")}
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icono className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
            {!!contador && (
              <span className="tabular absolute -right-2 -top-1.5 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-on-primary">
                {contador}
              </span>
            )}
          </span>
          <span className="text-[10px] font-semibold leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
}
