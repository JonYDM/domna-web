import type { CategoriaInput, ColorCatalogo, ColorInput } from "@/types/api";
import { familiaDeHex } from "@/lib/color";
import { ApiError } from "@/lib/errores";
import type { CategoriaEntidad, DbState } from "./db";

/**
 * Catálogo de atributos de la boutique: categorías (con su juego de tallas) y colores.
 * Reglas puras, portables al backend. Las prendas COPIAN el color al darse de alta, así que editar
 * o borrar un color del catálogo no rompe prendas existentes.
 */

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mismoNombre(a: string, b: string) {
  return slug(a) === slug(b);
}

function idUnico(base: string, existe: (id: string) => boolean) {
  let id = base || "item";
  let i = 2;
  while (existe(id)) id = `${base}-${i++}`;
  return id;
}

function limpiarNombre(nombre: string, min = 2, max = 30): string {
  const n = nombre.trim().replace(/\s+/g, " ");
  if (n.length < min) throw new ApiError(400, "Escribe un nombre.");
  if (n.length > max) throw new ApiError(400, `Máximo ${max} caracteres.`);
  return n;
}

/** Tallas: sin espacios extra, en mayúsculas ("ch" → "CH"), sin repetir, 1–15 de máx. 6 caracteres. */
export function normalizarTallas(tallas: string[]): string[] {
  const out: string[] = [];
  for (const t of tallas) {
    const v = t.trim().replace(/\s+/g, " ");
    if (!v) continue;
    const norm = /^[úu]nica$/i.test(v) ? "Única" : v.toUpperCase();
    if (norm.length > 6) throw new ApiError(400, `La talla "${v}" es muy larga (máx. 6).`);
    if (!out.includes(norm)) out.push(norm);
  }
  if (!out.length) throw new ApiError(400, "Agrega al menos una talla.");
  if (out.length > 15) throw new ApiError(400, "Máximo 15 tallas por categoría.");
  return out;
}

export function productosEnCategoria(db: DbState, id: string): number {
  return db.productos.filter((p) => p.categoriaId === id).length;
}

export function crearCategoria(db: DbState, input: CategoriaInput): CategoriaEntidad {
  const nombre = limpiarNombre(input.nombre);
  if (db.categorias.some((c) => mismoNombre(c.nombre, nombre))) throw new ApiError(409, "Ya existe esa categoría.");
  const c: CategoriaEntidad = {
    id: idUnico(slug(nombre), (id) => db.categorias.some((x) => x.id === id)),
    nombre,
    tallas: normalizarTallas(input.tallas),
  };
  db.categorias.push(c);
  return c;
}

/** Editar no toca las prendas existentes: las tallas nuevas solo se proponen en altas futuras. */
export function actualizarCategoria(db: DbState, id: string, input: CategoriaInput): CategoriaEntidad {
  const c = db.categorias.find((x) => x.id === id);
  if (!c) throw new ApiError(404, "Categoría no encontrada.");
  const nombre = limpiarNombre(input.nombre);
  if (db.categorias.some((x) => x.id !== id && mismoNombre(x.nombre, nombre))) throw new ApiError(409, "Ya existe esa categoría.");
  c.nombre = nombre;
  c.tallas = normalizarTallas(input.tallas);
  return c;
}

export function eliminarCategoria(db: DbState, id: string): void {
  const n = productosEnCategoria(db, id);
  if (n > 0) throw new ApiError(409, `No se puede borrar: tiene ${n} ${n === 1 ? "prenda" : "prendas"}. Muévelas a otra categoría primero.`);
  db.categorias = db.categorias.filter((c) => c.id !== id);
}

// ── Colores ──

export function normalizarHex(hex: string): string {
  const h = hex.trim().toUpperCase();
  const corto = /^#?([0-9A-F])([0-9A-F])([0-9A-F])$/.exec(h);
  if (corto) return `#${corto[1]}${corto[1]}${corto[2]}${corto[2]}${corto[3]}${corto[3]}`;
  const largo = /^#?([0-9A-F]{6})$/.exec(h);
  if (!largo) throw new ApiError(400, "Color inválido (usa formato #RRGGBB).");
  return `#${largo[1]}`;
}

export function crearColor(db: DbState, input: ColorInput): ColorCatalogo {
  const nombre = limpiarNombre(input.nombre, 2, 24);
  if (db.colores.some((c) => mismoNombre(c.nombre, nombre))) throw new ApiError(409, "Ya existe un color con ese nombre.");
  const hex = normalizarHex(input.hex);
  const c: ColorCatalogo = {
    id: idUnico(slug(nombre), (id) => db.colores.some((x) => x.id === id)),
    nombre,
    hex,
    familia: familiaDeHex(hex),
  };
  db.colores.push(c);
  return c;
}

export function actualizarColor(db: DbState, id: string, input: ColorInput): ColorCatalogo {
  const c = db.colores.find((x) => x.id === id);
  if (!c) throw new ApiError(404, "Color no encontrado.");
  const nombre = limpiarNombre(input.nombre, 2, 24);
  if (db.colores.some((x) => x.id !== id && mismoNombre(x.nombre, nombre))) throw new ApiError(409, "Ya existe un color con ese nombre.");
  c.nombre = nombre;
  c.hex = normalizarHex(input.hex);
  c.familia = familiaDeHex(c.hex);
  return c;
}

/** Quita el color del catálogo (las prendas que ya lo usan conservan su copia). */
export function eliminarColor(db: DbState, id: string): void {
  if (!db.colores.some((c) => c.id === id)) throw new ApiError(404, "Color no encontrado.");
  db.colores = db.colores.filter((c) => c.id !== id);
}
