import type { FamiliaColor, FiltrosCatalogo, OrdenCatalogo, ProductoResumen, SeccionCatalogo } from "@/types/api";
import { FAMILIAS_COLOR } from "./enums";

const FAMILIAS = new Set<string>(FAMILIAS_COLOR.map((f) => f.id));
const ORDENES = new Set<string>(["nuevos", "precio-asc", "precio-desc"]);
const SECCIONES = new Set<string>(["nuevos", "reabastecidos"]);

/** Minúsculas y sin acentos, para que "blusa" encuentre "Blúsa" y "cafe" encuentre "Café". */
export function normalizarTexto(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Aplica los filtros del catálogo a la lista completa. Todo se resuelve aquí porque el catálogo es chico y ya
 * viene entero del servidor: cambiar un filtro es instantáneo y no pide nada de nuevo.
 *
 * - texto: cada palabra debe aparecer en el nombre de la prenda o en el de alguno de sus colores.
 * - color: la prenda tiene al menos un color de esa familia.
 * - seccion: "nuevos" (recién llegadas) o "reabastecidos" (de vuelta en stock).
 * - orden: por precio; "nuevos" (o ninguno) conserva el orden del servidor, que ya es el más reciente primero.
 */
export function aplicarFiltros(lista: ProductoResumen[], f: FiltrosCatalogo): ProductoResumen[] {
  let r = lista;

  const palabras = normalizarTexto(f.texto ?? "").split(/\s+/).filter(Boolean);
  if (palabras.length > 0) {
    r = r.filter((p) => {
      const campo = normalizarTexto(`${p.nombre} ${p.colores.map((c) => c.nombre).join(" ")}`);
      return palabras.every((w) => campo.includes(w));
    });
  }
  if (f.categoria) r = r.filter((p) => p.categoriaId === f.categoria);
  if (f.talla) r = r.filter((p) => p.tallas.includes(f.talla!));
  if (f.color) r = r.filter((p) => p.colores.some((c) => c.familia === f.color));
  if (f.precioMax) r = r.filter((p) => p.precio <= f.precioMax!);
  if (f.seccion === "nuevos") r = r.filter((p) => p.nuevo);
  else if (f.seccion === "reabastecidos") r = r.filter((p) => p.reabastecido);

  if (f.orden === "precio-asc") r = [...r].sort((a, b) => a.precio - b.precio);
  else if (f.orden === "precio-desc") r = [...r].sort((a, b) => b.precio - a.precio);
  return r;
}

/**
 * Lee los filtros de la URL descartando lo que no sirve (un color que no existe, un precio que no es número, un
 * orden inventado): un enlace viejo o escrito a mano no debe dejar el catálogo vacío sin explicación.
 */
export function leerFiltros(params: URLSearchParams): FiltrosCatalogo {
  const color = params.get("color");
  const orden = params.get("orden");
  const seccion = params.get("seccion");
  const precio = Number(params.get("precioMax"));
  return {
    texto: params.get("q") || undefined,
    categoria: params.get("categoria") || undefined,
    talla: params.get("talla") || undefined,
    color: color && FAMILIAS.has(color) ? (color as FamiliaColor) : undefined,
    precioMax: Number.isFinite(precio) && precio > 0 ? precio : undefined,
    orden: orden && ORDENES.has(orden) ? (orden as OrdenCatalogo) : undefined,
    seccion: seccion && SECCIONES.has(seccion) ? (seccion as SeccionCatalogo) : undefined,
  };
}