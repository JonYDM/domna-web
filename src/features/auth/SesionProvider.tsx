import { useCallback, useMemo, useState, type ReactNode } from "react";
import { SesionContext, STORAGE_SESION, USUARIAS_DEMO, type Rol, type Sesion } from "./sesion";

function leer(): Sesion | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESION);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

/** Sesión de la demo: elegir rol en la bienvenida. Value estable con useMemo. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leer);

  const entrar = useCallback((rol: Rol) => {
    const s = USUARIAS_DEMO[rol];
    localStorage.setItem(STORAGE_SESION, JSON.stringify(s));
    setSesion(s);
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(STORAGE_SESION);
    setSesion(null);
  }, []);

  const valor = useMemo(() => ({ sesion, entrar, salir }), [sesion, entrar, salir]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
