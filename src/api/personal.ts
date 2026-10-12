import type { CrearCajeraInput, EditarCajeraInput, Personal, Rol, SucursalId } from "@/types/api";
import { http } from "./http";

/** DTO de clienta tal como lo devuelve el backend (igual al de auth.ts). */
interface ClientaDto {
  id: string;
  nombre: string;
  telefono: string;
  rol: string;
  sucursalCajera?: string | null;
  creada: string;
  ultimoAcceso?: string | null;
  activo: boolean;
}

function aPersonal(dto: ClientaDto): Personal {
  return {
    id: dto.id,
    nombre: dto.nombre,
    telefono: dto.telefono,
    rol: dto.rol as Rol,
    sucursalCajera: (dto.sucursalCajera as SucursalId) ?? undefined,
    creada: dto.creada,
    ultimoAcceso: dto.ultimoAcceso ?? undefined,
    activo: dto.activo,
  };
}

/** Equipo de la boutique: la dueña y las cajeras (solo rol dueña puede verlo/crear). */
export async function listarPersonal(): Promise<Personal[]> {
  const lista = await http.get<ClientaDto[]>("/api/personal");
  return lista.map(aPersonal);
}

/** Da de alta una cajera: nombre, teléfono, PIN de 6 dígitos y su sucursal. */
export async function crearCajera(input: CrearCajeraInput): Promise<Personal> {
  const dto = await http.post<ClientaDto>("/api/personal", input);
  return aPersonal(dto);
}

/** Edita nombre, teléfono y sucursal de una cajera (p. ej. cambió de número). */
export async function editarCajera(id: string, input: EditarCajeraInput): Promise<Personal> {
  const dto = await http.put<ClientaDto>(`/api/personal/${id}`, input);
  return aPersonal(dto);
}

/** Fija un PIN nuevo para una cajera que lo olvidó. */
export async function resetPinCajera(id: string, pin: string): Promise<Personal> {
  const dto = await http.post<ClientaDto>(`/api/personal/${id}/pin`, { pin });
  return aPersonal(dto);
}

/** Bloquea el acceso de una cajera (conserva su historial). */
export async function desactivarCajera(id: string): Promise<Personal> {
  const dto = await http.post<ClientaDto>(`/api/personal/${id}/desactivar`);
  return aPersonal(dto);
}

/** Restaura el acceso de una cajera desactivada. */
export async function activarCajera(id: string): Promise<Personal> {
  const dto = await http.post<ClientaDto>(`/api/personal/${id}/activar`);
  return aPersonal(dto);
}
