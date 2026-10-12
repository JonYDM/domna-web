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
import { http } from "./http";

/** DTO de apartado tal como lo devuelve el backend. */
interface ApartadoDto {
  id: string;
  folio: string;
  clientaId: string;
  clientaNombre: string;
  clientaTelefono: string;
  lineas: {
    varianteId: string;
    productoId: string;
    nombre: string;
    silueta: string;
    talla: string;
    colorNombre: string;
    colorHex: string;
    precio: number;
    costo: number;
    cantidad: number;
    sucursalOrigen: string;
  }[];
  subtotal: number;
  penalizacion: number;
  total: number;
  modalidad: string;
  canal: string;
  entrega: string;
  requiereTraslado: boolean;
  estadoEntrega: string;
  abonos: { id: string; monto: number; fecha: string; metodo: string; concepto: string }[];
  pagado: number;
  saldo: number;
  creado: string;
  venceEl: string;
  listoEstimado: string;
  estado: string;
  cerradoEl?: string | null;
}

function aApartado(dto: ApartadoDto): Apartado {
  return {
    id: dto.id,
    folio: dto.folio,
    clientaId: dto.clientaId,
    clientaNombre: dto.clientaNombre,
    clientaTelefono: dto.clientaTelefono,
    lineas: dto.lineas.map((l) => ({ ...l, silueta: l.silueta as Apartado["lineas"][number]["silueta"], sucursalOrigen: l.sucursalOrigen as Apartado["entrega"] })),
    subtotal: dto.subtotal,
    penalizacion: dto.penalizacion,
    total: dto.total,
    modalidad: dto.modalidad as Apartado["modalidad"],
    canal: dto.canal as Apartado["canal"],
    entrega: dto.entrega as Apartado["entrega"],
    requiereTraslado: dto.requiereTraslado,
    estadoEntrega: dto.estadoEntrega as EstadoEntrega,
    abonos: dto.abonos.map((a) => ({ ...a, metodo: a.metodo as Apartado["abonos"][number]["metodo"], concepto: a.concepto as Apartado["abonos"][number]["concepto"] })),
    pagado: dto.pagado,
    saldo: dto.saldo,
    creado: dto.creado,
    venceEl: dto.venceEl,
    listoEstimado: dto.listoEstimado,
    estado: dto.estado as Apartado["estado"],
    cerradoEl: dto.cerradoEl ?? undefined,
  };
}

function aInputBackend(input: CrearApartadoInput, clientaId?: string) {
  return {
    lineas: input.lineas ?? (input.varianteId ? [{ varianteId: input.varianteId, cantidad: input.cantidad ?? 1 }] : []),
    modalidad: input.modalidad,
    entrega: input.entrega,
    canal: input.canal,
    clientaId: clientaId ?? input.clientaId,
    metodoAnticipo: input.metodoAnticipo,
  };
}

export async function cotizarApartado(clientaId: string, input: CrearApartadoInput): Promise<CotizacionApartado> {
  const dto = await http.post<{
    subtotal: number; penalizacion: number; total: number; anticipo: number; venceEl: string;
    requiereTraslado: boolean; listoEstimado: string; sucursalOrigen: string | null;
  }>("/api/apartados/cotizar", aInputBackend(input, clientaId));
  return { ...dto, sucursalOrigen: dto.sucursalOrigen as CotizacionApartado["sucursalOrigen"] };
}

export async function crearApartado(clientaId: string, input: CrearApartadoInput): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>("/api/apartados", aInputBackend(input, clientaId));
  return aApartado(dto);
}

export async function misApartados(clientaId: string): Promise<Apartado[]> {
  const lista = await http.get<ApartadoDto[]>(`/api/apartados/clienta/${clientaId}`);
  return lista.map(aApartado);
}

export async function obtenerApartado(id: string): Promise<Apartado> {
  const dto = await http.get<ApartadoDto>(`/api/apartados/${id}`);
  return aApartado(dto);
}

export async function listarApartados(
  filtro?: FiltroEstadoApartado,
  texto?: string,
  tipo?: TipoPedido,
): Promise<Apartado[]> {
  const params = new URLSearchParams();
  if (filtro) params.set("estado", filtro);
  if (texto) params.set("texto", texto);
  if (tipo) params.set("tipo", tipo);
  const lista = await http.get<ApartadoDto[]>(`/api/apartados?${params}`);
  return lista.map(aApartado);
}

export async function registrarAbono(input: RegistrarAbonoInput): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>("/api/apartados/abonos", input);
  return aApartado(dto);
}

export async function cancelarApartado(id: string): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>(`/api/apartados/${id}/cancelar`);
  return aApartado(dto);
}

export async function avanzarEntrega(id: string, siguiente: EstadoEntrega): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>(`/api/apartados/${id}/entrega`, { siguiente });
  return aApartado(dto);
}

export async function obtenerCorteDia(sucursal: SucursalId): Promise<CorteDia> {
  return http.get(`/api/apartados/corte/${sucursal}`);
}

export async function obtenerMetricas(filtro: FiltroMetricas = {}): Promise<Metricas> {
  const params = new URLSearchParams();
  if (filtro.sucursal) params.set("sucursal", filtro.sucursal);
  return http.get(`/api/apartados/metricas?${params}`);
}
