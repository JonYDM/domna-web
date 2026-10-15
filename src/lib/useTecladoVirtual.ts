import { useEffect } from "react";

/** Debajo de esto se considera barra del navegador que se esconde, no teclado (evita saltitos). */
const UMBRAL_TECLADO_PX = 80;

/**
 * Cuánto tapa el teclado virtual: lo que falta entre el borde de abajo de la ventana y el borde de
 * abajo de lo que realmente se ve (visualViewport). 0 si no hay teclado.
 */
export function alturaTeclado(altoVentana: number, altoVisible: number, desplazamientoArriba: number): number {
  const tapado = Math.round(altoVentana - altoVisible - desplazamientoArriba);
  return tapado > UMBRAL_TECLADO_PX ? tapado : 0;
}

/**
 * Mantiene dos variables CSS en <html> mientras `activo`: `--teclado` (px que tapa el teclado) y
 * `--alto-visible` (px visibles sobre él). Un bottom-sheet fijo las usa para subir sobre el teclado
 * y, cuando el teclado se cierra (incluso con el botón "atrás" de Android, que no dispara blur),
 * volver a su lugar sin dejar un hueco. Si el navegador no tiene visualViewport no hace nada.
 */
export function useTecladoVirtual(activo: boolean): void {
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!activo || !vv) return;
    const raiz = document.documentElement;

    const aplicar = () => {
      const kb = alturaTeclado(window.innerHeight, vv.height, vv.offsetTop);
      if (kb > 0) {
        raiz.style.setProperty("--teclado", `${kb}px`);
        raiz.style.setProperty("--alto-visible", `${Math.round(vv.height)}px`);
      } else {
        raiz.style.removeProperty("--teclado");
        raiz.style.removeProperty("--alto-visible");
      }
    };

    aplicar();
    vv.addEventListener("resize", aplicar);
    vv.addEventListener("scroll", aplicar);
    return () => {
      vv.removeEventListener("resize", aplicar);
      vv.removeEventListener("scroll", aplicar);
      raiz.style.removeProperty("--teclado");
      raiz.style.removeProperty("--alto-visible");
    };
  }, [activo]);
}
