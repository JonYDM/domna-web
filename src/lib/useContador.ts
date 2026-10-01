import { useEffect, useState } from "react";

/** Cuenta de 0 a `objetivo` en `ms` con ease-out (para cifras de la presentación). */
export function useContador(objetivo: number, ms = 1400, retraso = 400): number {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValor(objetivo);
      return;
    }
    let raf = 0;
    const inicio = performance.now() + retraso;
    const paso = (ahora: number) => {
      const p = Math.min(1, Math.max(0, (ahora - inicio) / ms));
      setValor(Math.round(objetivo * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, ms, retraso]);
  return valor;
}
