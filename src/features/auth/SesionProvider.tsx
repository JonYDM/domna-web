import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SucursalId } from "@/types/api";
import { cerrarSesion, comprobarSesion, logout, usandoApi } from "@/api/authSelector";
import { registrarSesionVencida } from "@/api/http";
import { limpiarBorradoresDeSesion } from "@/features/panel/borradorProducto";
import { debeComprobarSesion, mensajeSesionVencida } from "./sesionUnica";
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
    // Cierre real en el servidor PRIMERO (mejor esfuerzo: timeout corto, ignora errores y NO bloquea
    // la salida local ni la navegación). Luego borra token + sesión local y los borradores de sesión.
    void logout();
    cerrarSesion(); // borra el JWT si la API real está activa
    localStorage.removeItem(STORAGE_SESION);
    void limpiarBorradoresDeSesion();
    // Nota: NO se borra el carrito (domna.carrito.<clientaId>): sobrevive al cierre de sesión.
    setSesion(null);
  }, []);

  // Sesión terminada por el servidor (401 en ruta autenticada): limpia la sesión local, borra los
  // borradores de sesión y manda a /entrar con un aviso acorde al `codigo` del backend. El carrito se
  // conserva (vive en localStorage por clientaId y nada de esto lo toca). Centralizado vía http.ts.
  useEffect(() => {
    registrarSesionVencida((codigo) => {
      cerrarSesion();
      localStorage.removeItem(STORAGE_SESION);
      void limpiarBorradoresDeSesion();
      setSesion(null);
      const yaEnEntrar = window.location.pathname.startsWith("/entrar");
      if (!yaEnEntrar) {
        const aviso = encodeURIComponent(mensajeSesionVencida(codigo));
        window.location.assign(`/entrar?motivo=vencio&aviso=${aviso}`);
      }
    });
    return () => registrarSesionVencida(null);
  }, []);

  // Detección temprana (solo API real + sesión iniciada): al volver la ventana/app al primer plano
  // comprueba la sesión con GET /api/auth/sesion, como máximo 1 vez cada 30 s, para enterarse pronto
  // si la reemplazaron sin esperar a la siguiente acción. Un 401 lo maneja el handler central; un
  // error de red NO cierra la sesión (se ignora). En modo mock no corre nada.
  const ultimaComprobacion = useRef<number | null>(null);
  const haySesion = sesion !== null;
  useEffect(() => {
    if (!usandoApi || !haySesion) return;
    const alPrimerPlano = () => {
      if (document.visibilityState === "hidden") return;
      const ahora = Date.now();
      if (!debeComprobarSesion(ultimaComprobacion.current, ahora)) return;
      ultimaComprobacion.current = ahora;
      // Ignoramos el resultado y los errores de red: el 401 ya lo cierra el handler central.
      void comprobarSesion().catch(() => {});
    };
    window.addEventListener("visibilitychange", alPrimerPlano);
    window.addEventListener("focus", alPrimerPlano);
    return () => {
      window.removeEventListener("visibilitychange", alPrimerPlano);
      window.removeEventListener("focus", alPrimerPlano);
    };
  }, [haySesion]);

  const valor = useMemo(
    () => ({ sesion, entrar, entrarStaff, entrarComoClienta, salir }),
    [sesion, entrar, entrarStaff, entrarComoClienta, salir],
  );
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
