import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FamiliaColor, FiltrosCatalogo, OrdenCatalogo, SeccionCatalogo } from "@/types/api";

type Clave = "q" | "categoria" | "talla" | "color" | "precioMax" | "orden" | "seccion";

/**
 * Filtros del catálogo en la URL (?categoria=vestidos&talla=M&orden=precio-asc):
 * se pueden compartir, el botón atrás funciona y otras vistas pueden enlazar a un filtro.
 */
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams();

  const filtros = useMemo<FiltrosCatalogo>(
    () => ({
      texto: params.get("q") ?? undefined,
      categoria: params.get("categoria") ?? undefined,
      talla: params.get("talla") ?? undefined,
      color: (params.get("color") as FamiliaColor | null) ?? undefined,
      precioMax: params.get("precioMax") ? Number(params.get("precioMax")) : undefined,
      orden: (params.get("orden") as OrdenCatalogo | null) ?? undefined,
      seccion: (params.get("seccion") as SeccionCatalogo | null) ?? undefined,
    }),
    [params],
  );

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
