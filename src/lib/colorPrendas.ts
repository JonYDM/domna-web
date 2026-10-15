/**
 * Cuándo ofrecer llevar un color del catálogo a las prendas que lo usan. Cada prenda guarda su propia
 * copia del color, así que editar el catálogo no la toca. Se ofrece cuando hay algo que llevar:
 *  - el color se está cambiando (nombre o tono) y lo usan prendas, o
 *  - aunque no se cambie nada, hay prendas que todavía muestran un tono anterior ("desactualizadas").
 */
export function ofrecerAplicarAPrendas(args: {
  /** El color tal como está guardado hoy (null si se está creando uno nuevo). */
  original: { nombre: string; hex: string } | null;
  nombre: string;
  hex: string;
  valido: boolean;
  prendas: number;
  desactualizadas?: number;
}): boolean {
  const { original, nombre, hex, valido, prendas, desactualizadas = 0 } = args;
  if (!original || !valido || prendas <= 0) return false;
  return cambioElColor(original, nombre, hex) || desactualizadas > 0;
}

/** ¿El formulario cambió el nombre o el tono respecto al color guardado? (sin distinguir mayúsculas del código) */
export function cambioElColor(original: { nombre: string; hex: string }, nombre: string, hex: string): boolean {
  return nombre.trim() !== original.nombre || hex.trim().toUpperCase() !== original.hex.toUpperCase();
}

/** "1 prenda" / "3 prendas". */
export function textoPrendas(n: number): string {
  return `${n} ${n === 1 ? "prenda" : "prendas"}`;
}