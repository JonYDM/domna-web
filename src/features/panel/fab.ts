import { createContext, useContext, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";

export interface AccionFab {
  label: string;
  icono: LucideIcon;
  onClick: () => void;
  /** Muestra el texto junto al icono. Para acciones que un icono solo no explica ("Marcar como entregada"). */
  extendido?: boolean;
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
export function useRegistrarFab(label: string, icono: LucideIcon, onClick: () => void, extendido = false) {
  const ctx = useContext(FabContext);
  if (!ctx) throw new Error("useRegistrarFab debe usarse dentro de FabProvider");
  const { registrar } = ctx;
  useEffect(() => {
    registrar({ label, icono, onClick, extendido });
    return () => registrar(null);
  }, [registrar, label, icono, onClick, extendido]);
}

/**
 * Como `useRegistrarFab`, pero la acción puede faltar (`null`): cuando una pantalla solo a veces tiene algo que
 * ofrecer, como un pedido que ya está entregado. Siempre muestra el texto junto al icono. El `onClick` puede
 * cambiar en cada render sin volver a registrar el botón: se llama siempre la versión más reciente.
 */
export function useRegistrarFabSi(accion: { label: string; icono: LucideIcon; onClick: () => void } | null) {
  const ctx = useContext(FabContext);
  if (!ctx) throw new Error("useRegistrarFabSi debe usarse dentro de FabProvider");
  const { registrar } = ctx;
  const alToque = useRef(accion?.onClick);
  useEffect(() => {
    alToque.current = accion?.onClick;
  });
  const label = accion?.label;
  const icono = accion?.icono;
  useEffect(() => {
    if (!label || !icono) return;
    registrar({ label, icono, extendido: true, onClick: () => alToque.current?.() });
    return () => registrar(null);
  }, [registrar, label, icono]);
}