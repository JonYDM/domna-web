import type { Clienta, ClientaResumen, FiltroClientas, NuevaClientaInput, OrigenClienta, ResumenClientas } from "@/types/api";
import { http } from "./http";

/** DTO de clienta tal como lo devuelve el backend (ver auth.ts). */
interface ClientaDto {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  origen: string;
  creada: string;
  ultimoAcceso?: string | null;
  penalizacionPendiente: number;
}

/** DTO de la fila del panel: la clienta + lo derivado de sus pedidos (en 0 hasta que exista el módulo). */
interface ClientaResumenDto extends ClientaDto {
  apartadosActivos: number;
  porRecoger: number;
  totalComprado: number;
  saldoPendiente: number;
  pedidos: number;
  ultimoPedido?: string | null;
}

interface ResumenClientasDto {
  total: number;
  nuevasSemana: number;
  conApartadoActivo: number;
  conCargo: number;
  porOrigen: Record<string, number>;
}

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

function aClientaResumen(dto: ClientaResumenDto): ClientaResumen {
  return {
    ...aClienta(dto),
    apartadosActivos: dto.apartadosActivos,
    porRecoger: dto.porRecoger,
    totalComprado: dto.totalComprado,
    saldoPendiente: dto.saldoPendiente,
    pedidos: dto.pedidos,
    ultimoPedido: dto.ultimoPedido ?? undefined,
  };
}

/** Lista clientas con filtro (todas|activas|nuevas|cargo) y búsqueda por nombre, correo o teléfono. */
export async function listarClientas(filtro: FiltroClientas, texto: string): Promise<ClientaResumen[]> {
  const params = new URLSearchParams({ filtro });
  if (texto) params.set("texto", texto);
  const lista = await http.get<ClientaResumenDto[]>(`/api/clientas?${params}`);
  return lista.map(aClientaResumen);
}

/** Totales del panel: cuántas clientas, nuevas de la semana, con cargo, cómo llegaron. */
export async function obtenerResumenClientas(): Promise<ResumenClientas> {
  const dto = await http.get<ResumenClientasDto>("/api/clientas/resumen");
  return {
    total: dto.total,
    nuevasSemana: dto.nuevasSemana,
    conApartadoActivo: dto.conApartadoActivo,
    conCargo: dto.conCargo,
    porOrigen: { registro: dto.porOrigen.registro ?? 0, mostrador: dto.porOrigen.mostrador ?? 0 },
  };
}

/** Ficha de una clienta (panel de la dueña). */
export async function obtenerClientaResumen(id: string): Promise<ClientaResumen> {
  const dto = await http.get<ClientaResumenDto>(`/api/clientas/${id}`);
  return aClientaResumen(dto);
}

/** Datos básicos de la PROPIA clienta (para su perfil en la tienda). */
export async function obtenerClienta(id: string): Promise<Clienta> {
  const dto = await http.get<ClientaResumenDto>(`/api/clientas/${id}/propio`);
  return aClienta(dto);
}

/** Alta en mostrador: nace sin PIN (sin acceso) hasta que se registre. */
export async function crearClienta(input: NuevaClientaInput): Promise<Clienta> {
  const dto = await http.post<ClientaDto>("/api/clientas", input);
  return aClienta(dto);
}
