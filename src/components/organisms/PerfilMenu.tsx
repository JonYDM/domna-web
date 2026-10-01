import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";

interface PerfilMenuProps {
  nombre: string;
  subtitulo?: string;
  /** Pendientes (avisos sin leer). Si > 0, el avatar lleva punto rojo con el número. */
  pendientes?: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSalir: () => void;
  /** Contenido del popover (avisos, accesos). */
  children?: ReactNode;
}

/**
 * Perfil arriba a la derecha: cápsula con el nombre a la izquierda y el avatar, punto rojo si hay
 * pendientes. Al tocarla abre un popover (Radix: Esc, clic afuera y foco accesibles).
 */
export function PerfilMenu({ nombre, subtitulo, pendientes = 0, open, onOpenChange, onSalir, children }: PerfilMenuProps) {
  const corto = nombre.trim().split(/\s+/)[0] ?? nombre;
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        aria-label={pendientes ? `Perfil de ${corto}, ${pendientes} avisos sin leer` : `Perfil de ${corto}`}
        className={cn(
          "group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest py-1 pl-3.5 pr-1 shadow-xs transition-colors",
          "hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 data-[state=open]:border-tinta",
        )}
      >
        <span className="max-w-[7.5rem] truncate text-label-lg text-on-surface">{corto}</span>
        <span className="relative">
          <Avatar nombre={nombre} className="h-9 w-9 text-label-md" />
          {pendientes > 0 && (
            <span className="tabular absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary ring-2 ring-surface-container-lowest">
              {pendientes > 9 ? "9+" : pendientes}
            </span>
          )}
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          tabIndex={-1}
          // El foco va al contenedor (no al primer botón): sin anillo de foco al tocar en móvil.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
          className="popover-anim z-50 flex max-h-[min(80dvh,600px)] w-[min(calc(100vw-24px),360px)] flex-col overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-lift outline-none"
        >
          <div className="flex items-center gap-3 border-b border-outline-variant/60 p-4">
            <Avatar nombre={nombre} />
            <div className="min-w-0">
              <p className="truncate text-label-lg">{nombre}</p>
              {subtitulo && <p className="truncate text-body-sm text-on-surface-variant">{subtitulo}</p>}
            </div>
          </div>

          {children && <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>}

          <div className="border-t border-outline-variant/60 p-2">
            <button
              type="button"
              onClick={onSalir}
              className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-label-lg text-error hover:bg-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
