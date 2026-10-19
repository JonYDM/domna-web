import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FiltrosCatalogo, ProductoResumen } from "@/types/api";
import { aplicarFiltros } from "@/lib/filtrosCatalogo";
import { qk } from "@/lib/queryKeys";
import * as api from "@/api/catalogo";
import * as config from "@/api/config";

/**
 * Catálogo filtrado. Todas las pantallas que lo usan comparten UNA sola consulta (la lista completa) y cada una
 * filtra a su manera: la portada pide el catálogo una vez aunque muestre tres listas, y cambiar un filtro no
 * espera a la red.
 */
export function useProductos(filtros: FiltrosCatalogo = {}) {
  const { incluirInactivos = false, texto, categoria, talla, color, precioMax, orden, seccion } = filtros;
  const select = useCallback(
    (lista: ProductoResumen[]) => aplicarFiltros(lista, { texto, categoria, talla, color, precioMax, orden, seccion }),
    [texto, categoria, talla, color, precioMax, orden, seccion],
  );
  return useQuery({
    queryKey: qk.productos(incluirInactivos),
    queryFn: () => api.listarProductos(incluirInactivos),
    select,
    // Se publican prendas con frecuencia: al volver a la app o cada 2 min (con la ventana visible)
    // se revalida. Cuesta poco: el servidor responde 304 si nada cambió.
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60_000,
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
  return useQuery({ queryKey: qk.categorias(), queryFn: api.obtenerCategorias, staleTime: 60_000, refetchOnWindowFocus: true });
}

export function useColores() {
  return useQuery({ queryKey: qk.colores(), queryFn: api.obtenerColores, staleTime: 60_000, refetchOnWindowFocus: true });
}

export function useConfig() {
  return useQuery({ queryKey: qk.config(), queryFn: config.obtenerConfig, staleTime: 60_000 });
}

/** Prefetch del detalle al tocar/pasar sobre la card. */
export function usePrefetchProducto() {
  const qc = useQueryClient();
  return (id: string) =>
    qc.prefetchQuery({ queryKey: qk.producto(id), queryFn: () => api.obtenerProducto(id), staleTime: 10_000 });
}
