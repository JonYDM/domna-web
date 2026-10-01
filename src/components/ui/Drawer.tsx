import type { ElementType, ReactNode } from "react";
import { Drawer as Vaul } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  descripcion?: string;
  children: ReactNode;
  /** Pie fijo (botón principal). */
  pie?: ReactNode;
  className?: string;
}

/**
 * Contenedor de formularios y filtros:
 * - Escritorio (≥768 px): diálogo centrado.
 * - Móvil: bottom-sheet de Vaul arrastrable.
 */
export function Drawer({ open, onClose, title, descripcion, children, pie, className }: DrawerProps) {
  const escritorio = useMediaQuery("(min-width: 768px)");

  const encabezado = (Titulo: ElementType, Desc: ElementType) => (
    <div className="px-5 pb-3 pt-2 md:px-6 md:pt-6">
      <Titulo className="font-marca text-headline-md text-on-surface">{title}</Titulo>
      {descripcion ? (
        <Desc className="mt-1 text-body-md text-on-surface-variant">{descripcion}</Desc>
      ) : (
        <Desc className="sr-only">{title}</Desc>
      )}
    </div>
  );

  const cuerpo = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 md:px-6">{children}</div>
      {pie && (
        <div
          className="border-t border-outline-variant/60 bg-surface-container-lowest px-5 pt-3 md:px-6 md:pb-5"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {pie}
        </div>
      )}
    </>
  );

  if (escritorio) {
    return (
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-on-surface/40" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl bg-surface-container-lowest shadow-float outline-none",
              className,
            )}
          >
            {encabezado(Dialog.Title, Dialog.Description)}
            <Dialog.Close
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
            {cuerpo}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Vaul.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-on-surface/40" />
        <Vaul.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface-container-lowest outline-none",
            className,
          )}
        >
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1.5 w-10 rounded-full bg-outline-variant" aria-hidden />
          </div>
          {encabezado(Vaul.Title, Vaul.Description)}
          {cuerpo}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
