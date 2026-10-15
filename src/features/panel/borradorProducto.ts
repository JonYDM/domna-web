import type { SucursalId } from "@/types/api";
import type { ImagenProcesada } from "@/lib/imagen";
import { idbBorrar, idbGuardar, idbLeer } from "@/lib/idbLocal";

/**
 * Borrador del alta de producto. Si se cierra el formulario (deslizar, tocar fuera, botón atrás) o
 * el navegador recarga la página (típico al volver de la cámara en Android), se retoma donde se
 * quedó. Los textos van en localStorage y las fotos (Blobs) en IndexedDB. Es por usuario.
 */

export const VERSION_BORRADOR = 1;
/** Un borrador más viejo que esto ya no se ofrece (los precios y colores cambian). */
const VIGENCIA_MS = 14 * 24 * 60 * 60 * 1000;

export type StockBorrador = Record<SucursalId, Record<string, number[]>>;

export interface BorradorProducto {
  version: number;
  guardado: string;
  paso: number;
  nombre: string;
  descripcion: string;
  categoriaElegida: string | null;
  colorIds: string[];
  tallasElegidas: string[] | null;
  sucursal: SucursalId;
  stock: StockBorrador;
  precio: string;
  costo: string;
  permiteApartado: boolean;
}

const claveTexto = (usuario: string) => `domna.borrador.producto.${usuario}`;
const claveFotos = (usuario: string) => `borrador-producto-fotos:${usuario}`;

const esTexto = (v: unknown): v is string => typeof v === "string";
const esListaTexto = (v: unknown): v is string[] => Array.isArray(v) && v.every(esTexto);

function esStock(v: unknown): v is StockBorrador {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return ["temixco", "azteca"].every((suc) => {
    const porTalla = s[suc];
    if (!porTalla || typeof porTalla !== "object") return false;
    return Object.values(porTalla as Record<string, unknown>).every(
      (fila) => Array.isArray(fila) && fila.every((n) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 99),
    );
  });
}

/** Valida lo leído del disco: cualquier cosa rara (versión vieja, JSON roto, vencido) se descarta. */
export function validarBorrador(crudo: unknown, ahora = Date.now()): BorradorProducto | null {
  if (!crudo || typeof crudo !== "object") return null;
  const b = crudo as Record<string, unknown>;
  if (b.version !== VERSION_BORRADOR) return null;
  if (!esTexto(b.guardado) || Number.isNaN(Date.parse(b.guardado))) return null;
  if (ahora - Date.parse(b.guardado) > VIGENCIA_MS) return null;
  if (!Number.isInteger(b.paso) || (b.paso as number) < 0 || (b.paso as number) > 3) return null;
  if (!esTexto(b.nombre) || !esTexto(b.descripcion) || !esTexto(b.precio) || !esTexto(b.costo)) return null;
  if (b.categoriaElegida !== null && !esTexto(b.categoriaElegida)) return null;
  if (!esListaTexto(b.colorIds)) return null;
  if (b.tallasElegidas !== null && !esListaTexto(b.tallasElegidas)) return null;
  if (b.sucursal !== "temixco" && b.sucursal !== "azteca") return null;
  if (!esStock(b.stock)) return null;
  if (typeof b.permiteApartado !== "boolean") return null;
  return b as unknown as BorradorProducto;
}

/** ¿Vale la pena guardarlo? Un formulario recién abierto y vacío no es un borrador. */
export function tieneContenido(b: Pick<BorradorProducto, "nombre" | "descripcion" | "colorIds" | "precio" | "costo">, hayFotos: boolean): boolean {
  return b.nombre.trim() !== "" || b.descripcion.trim() !== "" || b.colorIds.length > 0 || b.precio !== "" || b.costo !== "" || hayFotos;
}

export function leerBorrador(usuario: string): BorradorProducto | null {
  try {
    const raw = localStorage.getItem(claveTexto(usuario));
    return raw ? validarBorrador(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function guardarBorrador(usuario: string, b: Omit<BorradorProducto, "version" | "guardado">): void {
  try {
    const completo: BorradorProducto = { ...b, version: VERSION_BORRADOR, guardado: new Date().toISOString() };
    localStorage.setItem(claveTexto(usuario), JSON.stringify(completo));
  } catch {
    // Sin espacio o modo privado: el borrador es una comodidad, no un requisito.
  }
}

/** Las fotos se guardan sin el archivo original (pesa varios MB por foto). */
type FotoGuardada = Omit<ImagenProcesada, "originalFile">;

export async function guardarFotosBorrador(usuario: string, fotos: ImagenProcesada[][]): Promise<void> {
  if (!fotos.some((l) => l && l.length > 0)) {
    await idbBorrar(claveFotos(usuario));
    return;
  }
  const limpias: FotoGuardada[][] = fotos.map((lista) =>
    (lista ?? []).map(({ originalFile: _omitido, ...resto }) => resto),
  );
  await idbGuardar(claveFotos(usuario), limpias);
}

export async function leerFotosBorrador(usuario: string): Promise<ImagenProcesada[][] | null> {
  const guardadas = await idbLeer<FotoGuardada[][]>(claveFotos(usuario));
  if (!Array.isArray(guardadas)) return null;
  const valido = guardadas.every(
    (lista) => Array.isArray(lista) && lista.every((f) => f && typeof f.preview === "string" && f.webp && f.webp[800] instanceof Blob),
  );
  return valido ? (guardadas as ImagenProcesada[][]) : null;
}

export async function borrarBorrador(usuario: string): Promise<void> {
  try {
    localStorage.removeItem(claveTexto(usuario));
  } catch {
    // nada que hacer
  }
  await idbBorrar(claveFotos(usuario));
}
