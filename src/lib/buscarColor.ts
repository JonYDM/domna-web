/** Minúsculas, sin acentos y con espacios colapsados: para comparar lo que se teclea con un nombre. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Filtra una lista de colores por nombre. Cada palabra de la búsqueda debe aparecer en el nombre
 * (en cualquier orden): "verde menta" encuentra "Menta verde claro". Los `siempreVisibles` (por
 * ejemplo los ya elegidos) se conservan aunque no coincidan, para que no desaparezcan al buscar.
 * Devuelve `coinciden` por separado para poder avisar "sin resultados".
 */
export function filtrarPorNombre<T extends { id: string; nombre: string }>(
  lista: readonly T[],
  consulta: string,
  siempreVisibles: ReadonlySet<string> = new Set(),
): { visibles: T[]; coinciden: number } {
  const palabras = normalizarBusqueda(consulta).split(" ").filter(Boolean);
  if (palabras.length === 0) return { visibles: [...lista], coinciden: lista.length };
  let coinciden = 0;
  const visibles = lista.filter((c) => {
    const nombre = normalizarBusqueda(c.nombre);
    const ok = palabras.every((p) => nombre.includes(p));
    if (ok) coinciden++;
    return ok || siempreVisibles.has(c.id);
  });
  return { visibles, coinciden };
}
