import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  CrearApartadoInput,
  EstadoEntrega,
  FiltroEstadoApartado,
  RegistrarAbonoInput,
  TipoPedido,
} from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/mock/server";

/**
 * Mapa de invalidación (regla de oro): al mutar, invalidar TODAS las vistas que muestran el dato.
 * Apartar/cancelar/vencer cambian el stock disponible → también producto(s).
 */
function invalidarTodo(qc: QueryClient, { stock }: { stock: boolean }) {
  qc.invalidateQueries({ queryKey: qk.apartadosTodos() });
  qc.invalidateQueries({ queryKey: qk.apartadoTodos() });
  qc.invalidateQueries({ queryKey: qk.misApartadosTodos() });
  qc.invalidateQueries({ queryKey: qk.clientaTodos() });
  qc.invalidateQueries({ queryKey: qk.metricas() });
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
    queryFn: () => api.obtenerClienta(id!),
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
  return useMutation({
    mutationFn: (input: CrearApartadoInput) => api.crearApartado(clientaId!, input),
    onSuccess: () => invalidarTodo(qc, { stock: true }),
    // Si fue 409 (sin stock), refresca el detalle para mostrar el stock real.
    onError: () => qc.invalidateQueries({ queryKey: qk.productoTodos() }),
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

export function useApartados(estado?: FiltroEstadoApartado, texto?: string, tipo?: TipoPedido) {
  return useQuery({
    queryKey: qk.apartados(estado, texto, tipo),
    queryFn: () => api.listarApartados(estado, texto, tipo),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useRegistrarAbono() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegistrarAbonoInput) => api.registrarAbono(input),
    // Si liquida, descuenta stock físico → también producto(s).
    onSuccess: (a) => invalidarTodo(qc, { stock: a.estado === "liquidado" }),
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
