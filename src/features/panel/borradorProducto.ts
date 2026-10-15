import type { SucursalId } from "@/types/api";
import type { ImagenProcesada } from "@/lib/imagen";
import { idbBorrar, idbBorrarPrefijo, idbGuardar, idbLeer } from "@/lib/idbLocal";

/**
 * Borrador del alta de producto. Vive mientras viva la sesión de uso: sobrevive a cerrar el
 * formulario, recargar la página (p. ej. al volver de la cámara en Android) y navegar dentro de la
 * app, pero NO sobrevive a cerrar sesión, a que la sesión venza/se invalide, ni a cerrar la
 * app/pestaña. Por eso el texto va en sessionStorage (muere con la pestaña) y las fotos (Blobs) en
 * IndexedDB, pero las fotos solo valen si existe el borrador de texto de ese usuario en
 * sessionStorage: si no, se consideran huérfanas y se descartan. Es por usuario.
 */

export const VERSION_BORRADOR = 1;

/** Prefijos de almacenamiento, compartidos para poder limpiar todo de golpe al cerrar sesión. */
const PREFIJO_TEXTO = "domna.borrador.producto.";
const PREFIJO_FOTOS = "borrador-producto-fotos:";

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

const claveTexto = (usuario: string) => `${PREFIJO_TEXTO}${usuario}`;
const claveFotos = (usuario: string) => `${PREFIJO_FOTOS}${usuario}`;

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

/** Valida lo leído del disco: cualquier cosa rara (versión vieja, JSON roto) se descarta. La edad ya
 * no importa: la vida del borrador la acota la sesión. */
export function validarBorrador(crudo: unknown): BorradorProducto | null {
  if (!crudo || typeof crudo !== "object") return null;
  const b = crudo as Record<string, unknown>;
  if (b.version !== VERSION_BORRADOR) return null;
  if (!esTexto(b.guardado) || Number.isNaN(Date.parse(b.guardado))) return null;
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
    const raw = sessionStorage.getItem(claveTexto(usuario));
    return raw ? validarBorrador(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function guardarBorrador(usuario: string, b: Omit<BorradorProducto, "version" | "guardado">): void {
  try {
    const completo: BorradorProducto = { ...b, version: VERSION_BORRADOR, guardado: new Date().toISOString() };
    sessionStorage.setItem(claveTexto(usuario), JSON.stringify(completo));
  } catch {
    // Sin espacio o modo privado: el borrador es una comodidad, no un requisito.
  }
}

/** ¿Hay borrador de texto de este usuario en la sesión viva? Las fotos solo valen si lo hay. */
function hayBorradorTexto(usuario: string): boolean {
  try {
    return sessionStorage.getItem(claveTexto(usuario)) !== null;
  } catch {
    return false;
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
  // Las fotos solo valen acompañadas de su borrador de texto en la sesión viva. Si no está (p. ej.
  // la app se cerró y volvió a abrir, matando sessionStorage), son huérfanas: se borran.
  if (!hayBorradorTexto(usuario)) {
    await idbBorrar(claveFotos(usuario));
    return null;
  }
  const guardadas = await idbLeer<FotoGuardada[][]>(claveFotos(usuario));
  if (!Array.isArray(guardadas)) return null;
  const valido = guardadas.every(
    (lista) => Array.isArray(lista) && lista.every((f) => f && typeof f.preview === "string" && f.webp && f.webp[800] instanceof Blob),
  );
  return valido ? (guardadas as ImagenProcesada[][]) : null;
}

export async function borrarBorrador(usuario: string): Promise<void> {
  try {
    sessionStorage.removeItem(claveTexto(usuario));
  } catch {
    // nada que hacer
  }
  await idbBorrar(claveFotos(usuario));
}

/**
 * Borra TODOS los borradores de esta máquina: textos en sessionStorage con el prefijo de producto y
 * todas las fotos en IndexedDB con su prefijo. La llama el login/logout al cerrar sesión o al
 * vencer/invalidarse (401). Nunca lanza.
 */
export async function limpiarBorradoresDeSesion(): Promise<void> {
  try {
    const claves: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIJO_TEXTO)) claves.push(k);
    }
    for (const k of claves) sessionStorage.removeItem(k);
  } catch {
    // sessionStorage inaccesible: no hay nada que limpiar.
  }
  try {
    await idbBorrarPrefijo(PREFIJO_FOTOS);
  } catch {
    // IndexedDB inaccesible: nada que hacer.
  }
}

/**
 * Al abrir la app: si no quedó NINGÚN borrador de texto en sessionStorage (caso típico de app
 * cerrada y reabierta, que mata sessionStorage pero no IndexedDB), las fotos guardadas son
 * huérfanas y se borran. Si hay al menos un borrador vivo, no toca nada. Nunca lanza.
 */
export async function purgarFotosHuerfanas(): Promise<void> {
  try {
    let hayAlguno = false;
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIJO_TEXTO)) {
        hayAlguno = true;
        break;
      }
    }
    if (hayAlguno) return;
  } catch {
    // Sin sessionStorage no podemos afirmar que haya borradores vivos: seguimos y limpiamos.
  }
  try {
    await idbBorrarPrefijo(PREFIJO_FOTOS);
  } catch {
    // IndexedDB inaccesible: nada que hacer.
  }
}
