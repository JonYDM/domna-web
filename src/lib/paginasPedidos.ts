import type { Apartado, PaginaApartados } from "@/types/api";

/** Cuántos pedidos se piden por página. El servidor acepta hasta 50. */
export const TAMANO_PAGINA_PEDIDOS = 20;

/** El número de la página siguiente, o `undefined` si la última ya era la final. */
export function siguientePagina(ultima: PaginaApartados): number | undefined {
  return ultima.hayMas ? ultima.pagina + 1 : undefined;
}

/**
 * Junta las páginas cargadas en una sola lista. Si entra un pedido nuevo mientras se lee, los demás se
 * corren un lugar y el último de una página reaparece al inicio de la siguiente: aquí se quita el repetido
 * (queda su primera aparición) para que no haya dos tarjetas iguales.
 */
export function unirPaginas(paginas: PaginaApartados[] | undefined): { pedidos: Apartado[]; total: number } {
  if (!paginas || paginas.length === 0) return { pedidos: [], total: 0 };
  const vistos = new Set<string>();
  const pedidos: Apartado[] = [];
  for (const pagina of paginas) {
    for (const pedido of pagina.items) {
      if (vistos.has(pedido.id)) continue;
      vistos.add(pedido.id);
      pedidos.push(pedido);
    }
  }
  // El total más reciente es el de la última página pedida.
  return { pedidos, total: paginas[paginas.length - 1].total };
}

/** "Mostrando 20 de 57", o nada si todo cabe en lo que ya se ve. */
export function textoAvance(mostrados: number, total: number): string | null {
  if (total <= 0 || mostrados >= total) return null;
  return `Mostrando ${mostrados} de ${total}`;
}