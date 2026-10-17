import type { Clienta, OrigenClienta, RegistroClientaInput } from "@/types/api";
import { http, guardarToken, limpiarToken, leerToken } from "./http";
import { cuerpoLogin } from "@/features/auth/sesionUnica";

/**
 * Auth contra el backend (domna-api). Guarda el JWT tras registro/login.
 */

/** DTO de clienta tal como lo devuelve el backend. */
interface ClientaDto {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  origen: string;
  rol?: string;
  sucursalCajera?: string | null;
  creada: string;
  ultimoAcceso?: string | null;
  penalizacionPendiente: number;
}

/** Respuesta de registro/login: JWT + clienta. */
interface SesionDto {
  token: string;
  expira: string;
  clienta: ClientaDto;
}

/** Mapea el DTO del backend a la `Clienta` del contrato del front. */
function aClienta(dto: ClientaDto): Clienta {
  return {
    id: dto.id,
    nombre: dto.nombre,
    apellidos: dto.apellidos,
    telefono: dto.telefono,
    email: dto.email,
    origen: dto.origen as OrigenClienta,
    creada: dto.creada,
    ultimoAcceso: dto.ultimoAcceso ?? undefined,
    penalizacionPendiente: dto.penalizacionPendiente,
  };
}

export async function registrar(input: RegistroClientaInput): Promise<Clienta> {
  const sesion = await http.post<SesionDto>("/api/auth/registrar", input, { conAuth: false });
  guardarToken(sesion.token);
  return aClienta(sesion.clienta);
}

export async function loginConPin(telefono: string, pin: string, reemplazarSesion = false): Promise<Clienta> {
  const sesion = await http.post<SesionDto>("/api/auth/login", cuerpoLogin(telefono, pin, reemplazarSesion), {
    conAuth: false,
  });
  guardarToken(sesion.token);
  return aClienta(sesion.clienta);
}

/** ¿El teléfono ya tiene cuenta? Solo bool (el backend no revela el nombre). */
export async function existeTelefono(telefono: string): Promise<boolean> {
  const r = await http.get<{ existe: boolean }>(
    `/api/auth/existe?telefono=${encodeURIComponent(telefono)}`,
    { conAuth: false },
  );
  return r.existe;
}

/** Resultado del login de staff: datos para armar la sesión por rol. */
export interface SesionStaff {
  rol: "clienta" | "duena" | "cajera";
  nombre: string;
  clientaId: string;
  sucursal?: "temixco" | "azteca";
}

/** Login de staff: valida teléfono+PIN y devuelve el rol real del backend (del JWT/DTO). */
export async function loginStaff(telefono: string, pin: string, reemplazarSesion = false): Promise<SesionStaff> {
  const sesion = await http.post<SesionDto>("/api/auth/login", cuerpoLogin(telefono, pin, reemplazarSesion), {
    conAuth: false,
  });
  guardarToken(sesion.token);
  const c = sesion.clienta;
  return {
    rol: (c.rol as SesionStaff["rol"]) ?? "clienta",
    nombre: c.nombre,
    clientaId: c.id,
    sucursal: (c.sucursalCajera as SesionStaff["sucursal"]) ?? undefined,
  };
}

export async function solicitarRecuperacion(email: string): Promise<{ token: string | null }> {
  return http.post<{ token: string | null }>("/api/auth/recuperar", { email }, { conAuth: false });
}

export async function confirmarRecuperacion(token: string, pinNuevo: string): Promise<Clienta> {
  const sesion = await http.post<SesionDto>(
    "/api/auth/recuperar/confirmar",
    { token, pin: pinNuevo },
    { conAuth: false },
  );
  guardarToken(sesion.token);
  return aClienta(sesion.clienta);
}

/** Datos de la sesión viva (GET /api/auth/sesion): para la comprobación temprana. */
export interface SesionInfo {
  dispositivo: string;
  creada: string;
  ultimaActividad: string;
  expira: string;
}

/**
 * Comprueba que la sesión siga viva en el servidor (GET /api/auth/sesion). Si el servidor la revocó,
 * responde 401 y el manejador central de http.ts cierra la sesión local; aquí solo se propaga el
 * ApiError. Un error de red NO debe cerrar la sesión (quien llama lo ignora).
 */
export function comprobarSesion(): Promise<SesionInfo> {
  return http.get<SesionInfo>("/api/auth/sesion");
}

/**
 * Cierra la sesión en el servidor (POST /api/auth/logout, 204). Mejor esfuerzo: timeout corto y
 * nunca lanza, para no bloquear la salida local ni la navegación. Si no hay token, no hace nada.
 */
export async function logout(): Promise<void> {
  if (!leerToken()) return;
  try {
    await http.post<void>("/api/auth/logout", undefined, { timeoutMs: 4_000 });
  } catch {
    // Mejor esfuerzo: si falla o tarda, igual cerramos localmente.
  }
}

/** Cierra la sesión en el cliente (borra el JWT). */
export function cerrarSesion(): void {
  limpiarToken();
}
