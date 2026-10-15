/**
 * Qué lados de un carrusel horizontal todavía tienen contenido por mostrar. `margen` absorbe los
 * decimales que algunos navegadores dejan al terminar un desplazamiento. Pura para poder probarla.
 */
export function bordesDeScroll(
  scrollLeft: number,
  anchoVisible: number,
  anchoTotal: number,
  margen = 2,
): { izquierda: boolean; derecha: boolean } {
  const izquierda = scrollLeft > margen;
  const derecha = scrollLeft + anchoVisible < anchoTotal - margen;
  return { izquierda, derecha };
}
