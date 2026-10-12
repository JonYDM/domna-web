import type { Clienta, ClientaResumen, FiltroClientas, NuevaClientaInput, ResumenClientas } from "@/types/api";
import { apiActiva } from "./http";
import * as real from "./clientas";
import * as mock from "@/mock/server";

/** Clientas (panel de la dueña): capa real si VITE_API_URL está activa; si no, el mock. */
export function listarClientas(filtro: FiltroClientas, texto: string): Promise<ClientaResumen[]> {
  return apiActiva ? real.listarClientas(filtro, texto) : mock.listarClientas(filtro, texto);
}

export function obtenerResumenClientas(): Promise<ResumenClientas> {
  return apiActiva ? real.obtenerResumenClientas() : mock.obtenerResumenClientas();
}

export function obtenerClientaResumen(id: string): Promise<ClientaResumen> {
  return apiActiva ? real.obtenerClientaResumen(id) : mock.obtenerClientaResumen(id);
}

/** Datos básicos de la propia clienta (perfil en la tienda). */
export function obtenerClienta(id: string): Promise<Clienta> {
  return apiActiva ? real.obtenerClienta(id) : mock.obtenerClienta(id);
}

export function crearClienta(input: NuevaClientaInput): Promise<Clienta> {
  return apiActiva ? real.crearClienta(input) : mock.crearClienta(input);
}
