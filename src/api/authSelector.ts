import type { Clienta, RegistroClientaInput } from "@/types/api";
import { ApiError } from "@/lib/errores";
import { apiActiva } from "./http";
import * as real from "./auth";
import type { SesionStaff } from "./auth";
import * as mock from "@/mock/server";

export type { SesionStaff };

/**
 * Selector de la capa de autenticación: usa el backend real si `VITE_API_URL` está definida,
 * si no el mock. Expone las mismas firmas, así los hooks no saben cuál está activo.
 */

export const usandoApi = apiActiva;

export function registrar(input: RegistroClientaInput): Promise<Clienta> {
  return apiActiva ? real.registrar(input) : mock.registrar(input);
}

export function loginConPin(telefono: string, pin: string): Promise<Clienta> {
  return apiActiva ? real.loginConPin(telefono, pin) : mock.loginConPin(telefono, pin);
}

/**
 * ¿El teléfono ya tiene cuenta? (para el saludo "Bienvenida de nuevo").
 * Con API real consulta el backend; con mock no hay endpoint, así que responde false (feedback neutro).
 */
export function existeTelefono(telefono: string): Promise<boolean> {
  return apiActiva ? real.existeTelefono(telefono) : Promise.resolve(false);
}

/** Login de staff (dueña/cajera). Requiere la API real; con mock no hay cuentas de staff. */
export function loginStaff(telefono: string, pin: string): Promise<real.SesionStaff> {
  if (!apiActiva) {
    return Promise.reject(new ApiError(400, "El acceso del equipo requiere el servidor conectado."));
  }
  return real.loginStaff(telefono, pin);
}

/**
 * Login UNIFICADO: una sola pantalla para todos. Devuelve el rol real para rutear
 * (clienta → tienda, dueña → /app, cajera → /caja).
 * - API real: usa el login que ya trae el rol del token/DTO.
 * - Mock: solo hay clientas, así que mapea a rol "clienta".
 */
export async function loginUnificado(telefono: string, pin: string): Promise<real.SesionStaff> {
  if (apiActiva) return real.loginStaff(telefono, pin);
  const c = await mock.loginConPin(telefono, pin);
  return { rol: "clienta", nombre: c.nombre, clientaId: c.id };
}

export function solicitarRecuperacion(email: string): Promise<{ token: string | null }> {
  return apiActiva ? real.solicitarRecuperacion(email) : mock.solicitarRecuperacion(email);
}

export function confirmarRecuperacion(token: string, pinNuevo: string): Promise<Clienta> {
  return apiActiva ? real.confirmarRecuperacion(token, pinNuevo) : mock.confirmarRecuperacion(token, pinNuevo);
}

/** Cierra sesión en el cliente. Con la API real borra el JWT; con el mock no hace nada. */
export function cerrarSesion(): void {
  if (apiActiva) real.cerrarSesion();
}
