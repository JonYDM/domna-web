import type { FiltroEstadoApartado, FiltrosCatalogo } from "@/types/api";

/** Fábrica única de query keys (evita keys inestables y facilita invalidar). */
export const qk = {
  config: () => ["config"] as const,
  categorias: () => ["categorias"] as const,
  productos: (f: FiltrosCatalogo) => ["productos", f] as const,
  productosTodos: () => ["productos"] as const,
  producto: (id: string) => ["producto", id] as const,
  productoTodos: () => ["producto"] as const,
  apartados: (estado?: FiltroEstadoApartado, texto?: string) =>
    ["apartados", estado ?? "todos", texto ?? ""] as const,
  apartadosTodos: () => ["apartados"] as const,
  apartado: (id: string) => ["apartado", id] as const,
  apartadoTodos: () => ["apartado"] as const,
  misApartados: (clientaId: string) => ["tienda", "apartados", clientaId] as const,
  misApartadosTodos: () => ["tienda"] as const,
  clienta: (id: string) => ["clienta", id] as const,
  clientaTodos: () => ["clienta"] as const,
  metricas: () => ["metricas"] as const,
};
