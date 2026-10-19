import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { leerFiltros } from "@/lib/filtrosCatalogo";

type Clave = "q" | "categoria" | "talla" | "color" | "precioMax" | "orden" | "seccion";

/**
 * Filtros del catálogo en la URL (?categoria=vestidos&talla=M&orden=precio-asc):
 * se pueden compartir, el botón atrás funciona y otras vistas pueden enlazar a un filtro.
 */
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams();

  const filtros = useMemo(() => leerFiltros(params), [params]);

  const cambiar = useCallback(
    (cambios: Partial<Record<Clave, string | number | undefined>>) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(cambios)) {
            if (v === undefined || v === "") p.delete(k);
            else p.set(k, String(v));
          }
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const limpiar = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  /** Filtros del drawer activos (talla, color, precio, orden). */
  const activosDrawer = [filtros.talla, filtros.color, filtros.precioMax, filtros.orden].filter(Boolean).length;
  const hayFiltros = activosDrawer > 0 || !!filtros.categoria || !!filtros.texto || !!filtros.seccion;

  return { filtros, cambiar, limpiar, activosDrawer, hayFiltros };
}
