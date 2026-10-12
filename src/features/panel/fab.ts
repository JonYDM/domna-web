import { createContext, useContext, useEffect, type Dispatch, type SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";

export interface AccionFab {
  label: string;
  icono: LucideIcon;
  onClick: () => void;
}

export interface FabContextValue {
  accion: AccionFab | null;
  registrar: Dispatch<SetStateAction<AccionFab | null>>;
}

export const FabContext = createContext<FabContextValue | null>(null);

/** Lee la acción activa del FAB (lo usa el Dock para renderizarlo). */
export function useFab() {
  const ctx = useContext(FabContext);
  if (!ctx) throw new Error("useFab debe usarse dentro de FabProvider");
  return ctx.accion;
}

/**
 * Una página registra su acción de "agregar" aquí; el Dock la muestra como botón flotante.
 * Se desregistra sola al desmontar (al salir de la página).
 */
export function useRegistrarFab(label: string, icono: LucideIcon, onClick: () => void) {
  const ctx = useContext(FabContext);
  if (!ctx) throw new Error("useRegistrarFab debe usarse dentro de FabProvider");
  const { registrar } = ctx;
  useEffect(() => {
    registrar({ label, icono, onClick });
    return () => registrar(null);
  }, [registrar, label, icono, onClick]);
}
