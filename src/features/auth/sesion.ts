import { createContext, useContext } from "react";

export type Rol = "clienta" | "duena";

export interface Sesion {
  rol: Rol;
  nombre: string;
  /** Solo para la clienta (en producción sale del token). */
  clientaId?: string;
}

export interface SesionValor {
  sesion: Sesion | null;
  /** Entrar con un rol de demo (la dueña, o María como clienta de ejemplo). */
  entrar: (rol: Rol) => void;
  /** Entrar como una clienta concreta (tras "Continuar con Google" o con teléfono). */
  entrarComoClienta: (clienta: { id: string; nombre: string }) => void;
  salir: () => void;
}

export const SesionContext = createContext<SesionValor | null>(null);

export function useSesion(): SesionValor {
  const v = useContext(SesionContext);
  if (!v) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return v;
}

/** Usuarias de la demo (sin login real todavía). */
export const USUARIAS_DEMO: Record<Rol, Sesion> = {
  clienta: { rol: "clienta", nombre: "María", clientaId: "c-maria" },
  duena: { rol: "duena", nombre: "Jesly" },
};

export const STORAGE_SESION = "domna.sesion";
