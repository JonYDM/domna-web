import { createContext, useContext } from "react";
import type { Rol, SucursalId } from "@/types/api";

export type { Rol };

export interface Sesion {
  rol: Rol;
  nombre: string;
  /** Solo para la clienta (en producción sale del token). */
  clientaId?: string;
  /** Sucursal donde opera la cajera (su corte del día es de aquí). */
  sucursal?: SucursalId;
}

export interface SesionValor {
  sesion: Sesion | null;
  /** Entrar con un rol de demo (la dueña, la cajera, o María como clienta de ejemplo). */
  entrar: (rol: Rol) => void;
  /** Entrar como una clienta concreta (tras registro o login con PIN). */
  entrarComoClienta: (clienta: { id: string; nombre: string }) => void;
  salir: () => void;
}

export const SesionContext = createContext<SesionValor | null>(null);

export function useSesion(): SesionValor {
  const v = useContext(SesionContext);
  if (!v) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return v;
}

/** ¿La sesión es de staff (puede POS / alta de productos)? */
export function esStaff(s: Sesion | null): boolean {
  return s?.rol === "duena" || s?.rol === "cajera";
}

/** Usuarias de la demo (sin login real todavía). */
export const USUARIAS_DEMO: Record<Rol, Sesion> = {
  clienta: { rol: "clienta", nombre: "María", clientaId: "c-maria" },
  duena: { rol: "duena", nombre: "Jesly" },
  cajera: { rol: "cajera", nombre: "Caja Temixco", sucursal: "temixco" },
};

export const STORAGE_SESION = "domna.sesion";
