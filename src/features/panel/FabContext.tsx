import { useState, type ReactNode } from "react";
import { FabContext, type AccionFab } from "./fab";

/** Provee el FAB contextual del dock: cada página registra su propia acción de "agregar". */
export function FabProvider({ children }: { children: ReactNode }) {
  const [accion, setAccion] = useState<AccionFab | null>(null);
  return <FabContext.Provider value={{ accion, registrar: setAccion }}>{children}</FabContext.Provider>;
}
