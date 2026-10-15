import { useEffect, useState } from "react";
import { onlineManager } from "@tanstack/react-query";

/**
 * ¿Hay conexión? Combina `navigator.onLine` con los eventos online/offline y los sincroniza con
 * el `onlineManager` de TanStack Query (así, al volver la red, Query reintenta sus peticiones).
 *
 * En SSR/entorno sin `navigator` asume que sí hay conexión (no bloquea nada).
 */
export function useEnLinea(): boolean {
  const [enLinea, setEnLinea] = useState<boolean>(() => leerEnLinea());

  useEffect(() => {
    const actualizar = (valor: boolean) => {
      setEnLinea(valor);
      onlineManager.setOnline(valor);
    };
    const online = () => actualizar(true);
    const offline = () => actualizar(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    // Sincroniza el estado inicial con onlineManager por si cambió antes de montar.
    onlineManager.setOnline(leerEnLinea());

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return enLinea;
}

function leerEnLinea(): boolean {
  if (typeof navigator === "undefined") return true;
  // navigator.onLine puede ser undefined en algunos entornos: trátalo como "sí hay conexión".
  return navigator.onLine !== false;
}
