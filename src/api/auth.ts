import type { Clienta, OrigenClienta, RegistroClientaInput } from "@/types/api";
import { http, guardarToken, limpiarToken } from "./http";

/**
 * Auth contra el backend real (domna-api). Mismas firmas que las del mock (`src/mock/server.ts`)
 * para que los hooks puedan usar una u otra sin cambios. Guarda el JWT tras registro/login.
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

export async function loginConPin(telefono: string, pin: string): Promise<Clienta> {
  const sesion = await http.post<SesionDto>("/api/auth/login", { telefono, pin }, { conAuth: false });
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
export async function loginStaff(telefono: string, pin: string): Promise<SesionStaff> {
  const sesion = await http.post<SesionDto>("/api/auth/login", { telefono, pin }, { conAuth: false });
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

/** Cierra la sesión en el cliente (borra el JWT). */
export function cerrarSesion(): void {
  limpiarToken();
}
