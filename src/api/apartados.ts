import type {
  Apartado,
  ConteosPedidos,
  CorteDia,
  CotizacionApartado,
  CrearApartadoInput,
  EstadoEntrega,
  EstadoPago,
  FiltroEstadoApartado,
  FiltroMetricas,
  Metricas,
  PaginaApartados,
  RegistrarAbonoInput,
  SucursalId,
  TipoPedido,
} from "@/types/api";
import { TAMANO_PAGINA_PEDIDOS } from "@/lib/paginasPedidos";
import { http } from "./http";

/** DTO de apartado tal como lo devuelve el backend. */
export interface ApartadoDto {
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
    imagenUrl?: string | null;
  }[];
  subtotal: number;
  penalizacion: number;
  total: number;
  modalidad: string;
  canal: string;
  entrega: string;
  requiereTraslado: boolean;
  estadoEntrega: string;
  abonos: {
    id: string;
    monto: number;
    fecha: string;
    metodo: string;
    concepto: string;
    estado: string;
    revisadoPor?: string | null;
    revisadoEl?: string | null;
    motivoRechazo?: string | null;
    tieneComprobante: boolean;
  }[];
  pagado: number;
  porConfirmar: number;
  saldo: number;
  creado: string;
  venceEl: string;
  listoEstimado: string;
  estado: string;
  cerradoEl?: string | null;
}

export function aApartado(dto: ApartadoDto): Apartado {
  return {
    id: dto.id,
    folio: dto.folio,
    clientaId: dto.clientaId,
    clientaNombre: dto.clientaNombre,
    clientaTelefono: dto.clientaTelefono,
    lineas: dto.lineas.map((l) => ({
      ...l,
      silueta: l.silueta as Apartado["lineas"][number]["silueta"],
      sucursalOrigen: l.sucursalOrigen as Apartado["entrega"],
      imagenUrl: l.imagenUrl ?? undefined,
    })),
    subtotal: dto.subtotal,
    penalizacion: dto.penalizacion,
    total: dto.total,
    modalidad: dto.modalidad as Apartado["modalidad"],
    canal: dto.canal as Apartado["canal"],
    entrega: dto.entrega as Apartado["entrega"],
    requiereTraslado: dto.requiereTraslado,
    estadoEntrega: dto.estadoEntrega as EstadoEntrega,
    abonos: dto.abonos.map((a) => ({
      id: a.id,
      monto: a.monto,
      fecha: a.fecha,
      metodo: a.metodo as Apartado["abonos"][number]["metodo"],
      concepto: a.concepto as Apartado["abonos"][number]["concepto"],
      estado: a.estado as EstadoPago,
      revisadoPor: a.revisadoPor ?? undefined,
      revisadoEl: a.revisadoEl ?? undefined,
      motivoRechazo: a.motivoRechazo ?? undefined,
      tieneComprobante: a.tieneComprobante,
    })),
    pagado: dto.pagado,
    porConfirmar: dto.porConfirmar,
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

export async function crearApartado(clientaId: string, input: CrearApartadoInput, idempotencyKey?: string): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>("/api/apartados", aInputBackend(input, clientaId), { idempotencyKey });
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

/** Pedidos de a poco. El filtro, la búsqueda y el total los resuelve el servidor. */
export async function paginaApartados(
  filtro?: FiltroEstadoApartado,
  texto?: string,
  tipo?: TipoPedido,
  pagina = 1,
  tamano = TAMANO_PAGINA_PEDIDOS,
): Promise<PaginaApartados> {
  const params = new URLSearchParams({ pagina: String(pagina), tamano: String(tamano) });
  if (filtro) params.set("estado", filtro);
  if (texto) params.set("texto", texto);
  if (tipo) params.set("tipo", tipo);
  const dto = await http.get<{ items: ApartadoDto[]; total: number; pagina: number; tamano: number; hayMas: boolean }>(
    `/api/apartados/pagina?${params}`,
  );
  return { ...dto, items: dto.items.map(aApartado) };
}

/** Los números de las pestañas (apartados activos y compras por entregar), sin traer los pedidos. */
export function conteosPedidos(): Promise<ConteosPedidos> {
  return http.get<ConteosPedidos>("/api/apartados/conteos");
}
export async function registrarAbono(input: RegistrarAbonoInput, idempotencyKey?: string): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>("/api/apartados/abonos", input, { idempotencyKey });
  return aApartado(dto);
}

/** Pedidos con un pago declarado en línea que la tienda aún no confirma (la cajera ve solo su sucursal). */
export async function listarPorConfirmar(): Promise<Apartado[]> {
  const lista = await http.get<ApartadoDto[]>("/api/apartados/por-confirmar");
  return lista.map(aApartado);
}

/** La tienda verificó el pago: pasa a pagado y, si cubre el saldo, liquida. */
export async function confirmarPago(apartadoId: string, abonoId: string, idempotencyKey?: string): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>(`/api/apartados/${encodeURIComponent(apartadoId)}/abonos/${encodeURIComponent(abonoId)}/confirmar`, undefined, { idempotencyKey });
  return aApartado(dto);
}

/** La tienda no encontró el pago. Queda el motivo y la clienta puede volver a intentarlo. */
export async function rechazarPago(apartadoId: string, abonoId: string, motivo: string, idempotencyKey?: string): Promise<Apartado> {
  const dto = await http.post<ApartadoDto>(`/api/apartados/${encodeURIComponent(apartadoId)}/abonos/${encodeURIComponent(abonoId)}/rechazar`, { motivo }, { idempotencyKey });
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
