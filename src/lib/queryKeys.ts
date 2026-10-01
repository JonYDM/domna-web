import type { FiltroEstadoApartado, FiltrosCatalogo, TipoPedido } from "@/types/api";

/** Fábrica única de query keys (evita keys inestables y facilita invalidar). */
export const qk = {
  config: () => ["config"] as const,
  categorias: () => ["categorias"] as const,
  colores: () => ["colores"] as const,
  productos: (f: FiltrosCatalogo) => ["productos", f] as const,
  productosTodos: () => ["productos"] as const,
  producto: (id: string) => ["producto", id] as const,
  productoTodos: () => ["producto"] as const,
  apartados: (estado?: FiltroEstadoApartado, texto?: string, tipo?: TipoPedido) =>
    ["apartados", tipo ?? "todo", estado ?? "todos", texto ?? ""] as const,
  apartadosTodos: () => ["apartados"] as const,
  apartado: (id: string) => ["apartado", id] as const,
  apartadoTodos: () => ["apartado"] as const,
  misApartados: (clientaId: string) => ["tienda", "apartados", clientaId] as const,
  misApartadosTodos: () => ["tienda"] as const,
  /** Bajo "tienda": se invalida junto con mis apartados en cada mutación de pedidos. */
  avisos: (clientaId: string) => ["tienda", "avisos", clientaId] as const,
  clienta: (id: string) => ["clienta", id] as const,
  clientaTodos: () => ["clienta"] as const,
  metricas: () => ["metricas"] as const,
  clientas: (filtro: string, texto: string) => ["clientas", "lista", filtro, texto] as const,
  resumenClientas: () => ["clientas", "resumen"] as const,
  clientaResumen: (id: string) => ["clientas", "detalle", id] as const,
  clientasTodos: () => ["clientas"] as const,
};
