import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FiltrosCatalogo } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/mock/server";

/** Catálogo: cambia poco → staleTime 5 min, conserva la lista anterior al filtrar. */
export function useProductos(filtros: FiltrosCatalogo) {
  return useQuery({
    queryKey: qk.productos(filtros),
    queryFn: () => api.listarProductos(filtros),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Detalle: incluye el disponible por variante → siempre fresco (stock crítico). */
export function useProducto(id: string, opciones: { incluirInactivo?: boolean } = {}) {
  return useQuery({
    queryKey: qk.producto(id),
    queryFn: () => api.obtenerProducto(id, opciones),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useCategorias() {
  return useQuery({ queryKey: qk.categorias(), queryFn: api.obtenerCategorias, staleTime: 5 * 60_000 });
}

export function useColores() {
  return useQuery({ queryKey: qk.colores(), queryFn: api.obtenerColores, staleTime: 5 * 60_000 });
}

export function useConfig() {
  return useQuery({ queryKey: qk.config(), queryFn: api.obtenerConfig, staleTime: 60_000 });
}

/** Prefetch del detalle al tocar/pasar sobre la card. */
export function usePrefetchProducto() {
  const qc = useQueryClient();
  return (id: string) =>
    qc.prefetchQuery({ queryKey: qk.producto(id), queryFn: () => api.obtenerProducto(id), staleTime: 10_000 });
}
