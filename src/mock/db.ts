import type {
  Apartado,
  Categoria,
  Clienta,
  ConfigBoutique,
  Producto,
} from "@/types/api";

/** Entidad interna (sin los campos derivados pagado/saldo). */
export type ApartadoEntidad = Omit<Apartado, "pagado" | "saldo"> & {
  /** true cuando ya se generó la penalización por vencimiento. */
  penalizado: boolean;
};

export interface DbState {
  version: number;
  config: ConfigBoutique;
  categorias: Categoria[];
  productos: Producto[];
  clientas: Clienta[];
  apartados: ApartadoEntidad[];
  folioSeq: number;
  /** Avisos leídos por clienta (ids). Los avisos en sí se derivan del estado. */
  avisosLeidos: Record<string, string[]>;
}

/** Subir al cambiar la forma de los datos: la demo se reinicia con el seed nuevo. */
export const DB_VERSION = 4;
const KEY = "domna.demo.db";

export function cargar(): DbState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as DbState;
    return s.version === DB_VERSION ? s : null;
  } catch {
    return null;
  }
}

export function guardar(s: DbState): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function borrar(): void {
  localStorage.removeItem(KEY);
}
