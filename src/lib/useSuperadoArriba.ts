import { useCallback, useEffect, useState } from "react";

/**
 * ¿El elemento ya quedó POR ARRIBA de la pantalla? (se hizo scroll más allá de él). Si aún no se
 * llega a él (está abajo) o si está a la vista, es false. Pura para poder probarla.
 */
export function haPasadoArriba(e: { isIntersecting: boolean; top: number; rootTop: number }): boolean {
  return !e.isIntersecting && e.top < e.rootTop;
}

/**
 * Devuelve [ref, superado]. `superado` es true cuando el elemento ya salió por arriba de la
 * pantalla; sirve para mostrar una barra flotante solo después de pasar las acciones de la página.
 * `margenSuperior` descuenta un encabezado fijo (px). Sin IntersectionObserver siempre es false.
 */
export function useSuperadoArriba(margenSuperior = 0): [(nodo: Element | null) => void, boolean] {
  const [nodo, setNodo] = useState<Element | null>(null);
  const [superado, setSuperado] = useState(false);
  const ref = useCallback((n: Element | null) => setNodo(n), []);

  useEffect(() => {
    if (!nodo || typeof IntersectionObserver === "undefined") {
      setSuperado(false);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) =>
        setSuperado(
          haPasadoArriba({ isIntersecting: e.isIntersecting, top: e.boundingClientRect.top, rootTop: e.rootBounds?.top ?? 0 }),
        ),
      { rootMargin: `-${margenSuperior}px 0px 0px 0px`, threshold: 0 },
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [nodo, margenSuperior]);

  return [ref, superado];
}
