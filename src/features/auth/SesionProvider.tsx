import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { SucursalId } from "@/types/api";
import { cerrarSesion } from "@/api/authSelector";
import { SesionContext, STORAGE_SESION, USUARIAS_DEMO, type Rol, type Sesion } from "./sesion";

function leer(): Sesion | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESION);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

/** Sesión de la demo. Value estable con useMemo. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leer);

  const guardar = useCallback((s: Sesion) => {
    localStorage.setItem(STORAGE_SESION, JSON.stringify(s));
    setSesion(s);
  }, []);

  const entrar = useCallback((rol: Rol) => guardar(USUARIAS_DEMO[rol]), [guardar]);

  const entrarStaff = useCallback(
    (s: { rol: Rol; nombre: string; clientaId?: string; sucursal?: SucursalId }) =>
      guardar({ rol: s.rol, nombre: s.nombre.split(" ")[0], clientaId: s.clientaId, sucursal: s.sucursal }),
    [guardar],
  );

  const entrarComoClienta = useCallback(
    (c: { id: string; nombre: string }) => guardar({ rol: "clienta", nombre: c.nombre.split(" ")[0], clientaId: c.id }),
    [guardar],
  );

  const salir = useCallback(() => {
    cerrarSesion(); // borra el JWT si la API real está activa
    localStorage.removeItem(STORAGE_SESION);
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({ sesion, entrar, entrarStaff, entrarComoClienta, salir }),
    [sesion, entrar, entrarStaff, entrarComoClienta, salir],
  );
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
