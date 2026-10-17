import type { Apartado, EstadoEntrega } from "@/types/api";
import { SIGUIENTE_ENTREGA } from "./enums";

type PedidoParaAccion = Pick<Apartado, "estado" | "estadoEntrega" | "porConfirmar">;

/** El siguiente paso de la entrega, si lo hay y tiene sentido darlo en el estado actual del pedido. */
export function siguienteEntrega(a: PedidoParaAccion): { estado: EstadoEntrega; accion: string } | null {
  const siguiente = SIGUIENTE_ENTREGA[a.estadoEntrega];
  if (!siguiente) return null;
  if (a.estado === "cancelado" || a.estado === "vencido") return null;
  // Solo se entrega lo liquidado; los traslados se pueden mover desde que está apartado.
  if (siguiente.estado === "entregado" && a.estado !== "liquidado") return null;
  return siguiente;
}

export type AccionPrincipal =
  | { tipo: "confirmar-pago"; label: string }
  | { tipo: "abonar"; label: string }
  | { tipo: "entrega"; label: string; siguiente: EstadoEntrega };

/**
 * Lo que la dueña más probablemente viene a hacer en este pedido, para ponerlo al alcance del pulgar:
 * mientras falte dinero, cobrar (o confirmar lo que la clienta ya declaró); una vez pagado, avanzar la
 * entrega. Cancelado, vencido o ya entregado no tienen acción principal.
 */
export function accionPrincipal(a: PedidoParaAccion): AccionPrincipal | null {
  if (a.estado === "activo") {
    return (a.porConfirmar ?? 0) > 0
      ? { tipo: "confirmar-pago", label: "Confirmar el pago" }
      : { tipo: "abonar", label: "Registrar abono" };
  }
  const siguiente = siguienteEntrega(a);
  return siguiente ? { tipo: "entrega", label: siguiente.accion, siguiente: siguiente.estado } : null;
}