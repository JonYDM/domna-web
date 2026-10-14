import type { CambioStock, MotivoAjuste, SucursalId } from "@/types/api";
import { http } from "./http";

/** Stock en lote y traspasos contra el backend real (con historial de movimientos). */

/** Guarda varios cambios de stock (valores absolutos), todo o nada. Devuelve cuántos cambios validó. */
export async function guardarStock(productoId: string, cambios: CambioStock[], motivo: MotivoAjuste): Promise<number> {
  const r = await http.post<{ actualizados: number }>(`/api/stock/${encodeURIComponent(productoId)}/lote`, { cambios, motivo });
  return r.actualizados;
}

/** Mueve piezas disponibles de una sucursal a la otra. */
export async function moverStock(varianteId: string, desde: SucursalId, cantidad: number): Promise<void> {
  await http.post<void>("/api/stock/mover", { varianteId, desde, cantidad });
}
