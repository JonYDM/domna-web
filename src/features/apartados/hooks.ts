import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  CrearApartadoInput,
  EstadoEntrega,
  FiltroEstadoApartado,
  RegistrarAbonoInput,
  TipoPedido,
} from "@/types/api";
import { qk } from "@/lib/queryKeys";
import { useLlaveIdempotencia } from "@/lib/idempotencia";
import * as api from "@/api/apartados";
import * as comprobantes from "@/api/comprobantes";
import * as clientasApi from "@/api/clientas";
import { comprimirComprobante } from "@/lib/imagen";
import { siguientePagina } from "@/lib/paginasPedidos";

/**
 * Mapa de invalidación (regla de oro): al mutar, invalidar TODAS las vistas que muestran el dato.
 * Apartar/cancelar/vencer cambian el stock disponible → también producto(s).
 */
function invalidarTodo(qc: QueryClient, { stock }: { stock: boolean }) {
  qc.invalidateQueries({ queryKey: qk.apartadosTodos() });
  qc.invalidateQueries({ queryKey: qk.apartadoTodos() });
  qc.invalidateQueries({ queryKey: qk.misApartadosTodos() });
  qc.invalidateQueries({ queryKey: qk.clientaTodos() });
  qc.invalidateQueries({ queryKey: qk.metricasTodos() });
  qc.invalidateQueries({ queryKey: ["corte"] });
  qc.invalidateQueries({ queryKey: qk.clientasTodos() });
  if (stock) {
    qc.invalidateQueries({ queryKey: qk.productoTodos() });
    qc.invalidateQueries({ queryKey: qk.productosTodos() });
  }
}

// ── Clienta ──

export function useClienta(id: string | undefined) {
  return useQuery({
    queryKey: qk.clienta(id ?? ""),
    queryFn: () => clientasApi.obtenerClienta(id!),
    enabled: !!id,
  });
}

export function useCotizacion(clientaId: string | undefined, input: CrearApartadoInput | null) {
  return useQuery({
    queryKey: ["cotizacion", clientaId, input],
    queryFn: () => api.cotizarApartado(clientaId!, input!),
    enabled: !!clientaId && !!input,
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

/** Apartar NO es optimista: espera la confirmación (depende del stock real). */
export function useCrearApartado(clientaId: string | undefined) {
  const qc = useQueryClient();
  const llave = useLlaveIdempotencia();
  return useMutation({
    mutationFn: (input: CrearApartadoInput) => api.crearApartado(clientaId!, input, llave.llavePara(input)),
    onSuccess: () => {
      llave.confirmarExito();
      invalidarTodo(qc, { stock: true });
    },
    // Si fue 409 (sin stock), refresca el detalle para mostrar el stock real.
    onError: (e) => {
      llave.alError(e);
      qc.invalidateQueries({ queryKey: qk.productoTodos() });
    },
  });
}

export function useMisApartados(clientaId: string | undefined) {
  return useQuery({
    queryKey: qk.misApartados(clientaId ?? ""),
    queryFn: () => api.misApartados(clientaId!),
    enabled: !!clientaId,
    staleTime: 30_000,
  });
}

export function useApartado(id: string) {
  return useQuery({ queryKey: qk.apartado(id), queryFn: () => api.obtenerApartado(id), staleTime: 15_000 });
}

// ── Dueña ──

/** Pedidos de a poco: la primera página al abrir y las demás con `fetchNextPage` (botón "Ver más"). */
export function useApartadosPaginados(estado?: FiltroEstadoApartado, texto?: string, tipo?: TipoPedido) {
  return useInfiniteQuery({
    queryKey: qk.apartados(estado, texto, tipo),
    queryFn: ({ pageParam }) => api.paginaApartados(estado, texto, tipo, pageParam),
    initialPageParam: 1,
    getNextPageParam: siguientePagina,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

/** Los números de las pestañas de Pedidos, sin traer los pedidos. */
export function useConteosPedidos() {
  return useQuery({ queryKey: qk.conteosPedidos(), queryFn: api.conteosPedidos, staleTime: 15_000 });
}

export function useRegistrarAbono() {
  const qc = useQueryClient();
  const llave = useLlaveIdempotencia();
  return useMutation({
    mutationFn: (input: RegistrarAbonoInput) => api.registrarAbono(input, llave.llavePara(input)),
    // Si liquida, descuenta stock físico → también producto(s).
    onSuccess: (a) => {
      llave.confirmarExito();
      invalidarTodo(qc, { stock: a.estado === "liquidado" });
    },
    onError: (e) => llave.alError(e),
  });
}

export function useCancelarApartado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelarApartado(id),
    onSuccess: () => invalidarTodo(qc, { stock: true }),
  });
}

export function useAvanzarEntrega() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, siguiente }: { id: string; siguiente: EstadoEntrega }) => api.avanzarEntrega(id, siguiente),
    onSuccess: () => invalidarTodo(qc, { stock: false }),
  });
}

// ── Transferencias y comprobantes (solo API real) ──

/** Cuenta para transferir. La pide quien tiene sesión; `activo` evita pedirla si no hace falta. */
export function useDatosBancarios(activo = true) {
  return useQuery({
    queryKey: qk.datosBancarios(),
    queryFn: comprobantes.obtenerDatosBancarios,
    enabled: activo,
    staleTime: 5 * 60_000,
  });
}

export function useGuardarDatosBancarios() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comprobantes.guardarDatosBancarios,
    onSuccess: (datos) => qc.setQueryData(qk.datosBancarios(), datos),
  });
}

/** La clienta sube su comprobante: se reduce en el navegador, se sube directo y el pago queda en revisión. */
export function useSubirComprobante(apartadoId: string) {
  const qc = useQueryClient();
  const llave = useLlaveIdempotencia();
  return useMutation({
    mutationFn: async (archivo: File) =>
      comprobantes.subirComprobante(apartadoId, await comprimirComprobante(archivo), llave.llavePara(apartadoId)),
    onSuccess: () => {
      llave.confirmarExito();
      qc.invalidateQueries({ queryKey: qk.porConfirmar() });
      invalidarTodo(qc, { stock: false });
    },
    onError: (e) => llave.alError(e),
  });
}

/** La cajera abre un comprobante con su PIN. Devuelve un enlace que dura 2 minutos (no se cachea). */
export function useVerComprobante() {
  return useMutation({
    mutationFn: ({ apartadoId, abonoId, pin }: { apartadoId: string; abonoId: string; pin: string }) =>
      comprobantes.verComprobante(apartadoId, abonoId, pin),
    gcTime: 0,
  });
}

// ── Pagos por confirmar (pedidos en línea) ──

/** Cola de pagos declarados por las clientas. La cajera ve solo los de su sucursal. */
export function usePorConfirmar() {
  return useQuery({
    queryKey: qk.porConfirmar(),
    queryFn: api.listarPorConfirmar,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

/** Confirmar liquida (y descuenta stock) si el pago cubre el saldo → refresca todo lo que lo muestra. */
export function useConfirmarPago() {
  const qc = useQueryClient();
  const llave = useLlaveIdempotencia();
  return useMutation({
    mutationFn: ({ apartadoId, abonoId }: { apartadoId: string; abonoId: string }) =>
      api.confirmarPago(apartadoId, abonoId, llave.llavePara({ apartadoId, abonoId })),
    onSuccess: (a) => {
      llave.confirmarExito();
      qc.invalidateQueries({ queryKey: qk.porConfirmar() });
      invalidarTodo(qc, { stock: a.estado === "liquidado" });
    },
    // Si ya venció o lo revisó otra persona, la cola cambió: refrescarla para ver el estado real.
    onError: (e) => {
      llave.alError(e);
      qc.invalidateQueries({ queryKey: qk.porConfirmar() });
    },
  });
}

export function useRechazarPago() {
  const qc = useQueryClient();
  const llave = useLlaveIdempotencia();
  return useMutation({
    mutationFn: ({ apartadoId, abonoId, motivo }: { apartadoId: string; abonoId: string; motivo: string }) =>
      api.rechazarPago(apartadoId, abonoId, motivo, llave.llavePara({ apartadoId, abonoId, motivo })),
    onSuccess: () => {
      llave.confirmarExito();
      qc.invalidateQueries({ queryKey: qk.porConfirmar() });
      invalidarTodo(qc, { stock: false });
    },
    onError: (e) => {
      llave.alError(e);
      qc.invalidateQueries({ queryKey: qk.porConfirmar() });
    },
  });
}
