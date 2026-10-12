import type { CrearCajeraInput, Personal, Rol, SucursalId } from "@/types/api";
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
