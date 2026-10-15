import type {
  Apartado,
  CorteDia,
  CotizacionApartado,
  CrearApartadoInput,
  EstadoEntrega,
  FiltroEstadoApartado,
  FiltroMetricas,
  Metricas,
  RegistrarAbonoInput,
  SucursalId,
  TipoPedido,
} from "@/types/api";
import { apiActiva } from "./http";
import * as real from "./apartados";
import * as mock from "@/mock/server";

/** Apartados/ventas: capa real si VITE_API_URL está activa; si no, el mock. */
export function cotizarApartado(clientaId: string, input: CrearApartadoInput): Promise<CotizacionApartado> {
  return apiActiva ? real.cotizarApartado(clientaId, input) : mock.cotizarApartado(clientaId, input);
}

export function crearApartado(clientaId: string, input: CrearApartadoInput, idempotencyKey?: string): Promise<Apartado> {
  return apiActiva ? real.crearApartado(clientaId, input, idempotencyKey) : mock.crearApartado(clientaId, input);
}

export function misApartados(clientaId: string): Promise<Apartado[]> {
  return apiActiva ? real.misApartados(clientaId) : mock.misApartados(clientaId);
}

export function obtenerApartado(id: string): Promise<Apartado> {
  return apiActiva ? real.obtenerApartado(id) : mock.obtenerApartado(id);
}

export function listarApartados(filtro?: FiltroEstadoApartado, texto?: string, tipo?: TipoPedido): Promise<Apartado[]> {
  return apiActiva ? real.listarApartados(filtro, texto, tipo) : mock.listarApartados(filtro, texto, tipo);
}

export function registrarAbono(input: RegistrarAbonoInput, idempotencyKey?: string): Promise<Apartado> {
  return apiActiva ? real.registrarAbono(input, idempotencyKey) : mock.registrarAbono(input);
}

/**
 * Confirmación de pagos declarados en línea. Solo existe con la API real: el mock de la demo
 * cobra al instante y no tiene pagos por confirmar.
 */
export function listarPorConfirmar(): Promise<Apartado[]> {
  return apiActiva ? real.listarPorConfirmar() : Promise.resolve([]);
}

export function confirmarPago(apartadoId: string, abonoId: string, idempotencyKey?: string): Promise<Apartado> {
  return real.confirmarPago(apartadoId, abonoId, idempotencyKey);
}

export function rechazarPago(apartadoId: string, abonoId: string, motivo: string, idempotencyKey?: string): Promise<Apartado> {
  return real.rechazarPago(apartadoId, abonoId, motivo, idempotencyKey);
}

export function cancelarApartado(id: string): Promise<Apartado> {
  return apiActiva ? real.cancelarApartado(id) : mock.cancelarApartado(id);
}

export function avanzarEntrega(id: string, siguiente: EstadoEntrega): Promise<Apartado> {
  return apiActiva ? real.avanzarEntrega(id, siguiente) : mock.avanzarEntrega(id, siguiente);
}

export function obtenerCorteDia(sucursal: SucursalId): Promise<CorteDia> {
  return apiActiva ? real.obtenerCorteDia(sucursal) : mock.obtenerCorteDia(sucursal);
}

export function obtenerMetricas(filtro: FiltroMetricas = {}): Promise<Metricas> {
  return apiActiva ? real.obtenerMetricas(filtro) : mock.obtenerMetricas(filtro);
}
