import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NuevoProductoInput, SucursalId } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/mock/server";

export function useMetricas() {
  return useQuery({ queryKey: qk.metricas(), queryFn: api.obtenerMetricas, staleTime: 60_000 });
}

export function useCrearProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoProductoInput) => api.crearProducto(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.metricas() });
    },
  });
}

export function useCambiarEstadoProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.cambiarEstadoProducto(id, activo),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.producto(v.id) });
      qc.invalidateQueries({ queryKey: qk.metricas() });
    },
  });
}

export function useCambiarPermiteApartado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permite }: { id: string; permite: boolean }) => api.cambiarPermiteApartado(id, permite),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.producto(v.id) });
    },
  });
}

export function useAjustarStock(productoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ varianteId, sucursal, delta }: { varianteId: string; sucursal: SucursalId; delta: number }) =>
      api.ajustarStock(varianteId, sucursal, delta),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.producto(productoId) });
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.metricas() });
    },
  });
}

/** Controles de la demo: cambian todo → se invalida toda la caché. */
export function useControlesDemo() {
  const qc = useQueryClient();
  const todo = () => qc.invalidateQueries();
  return {
    avanzar: useMutation({ mutationFn: (dias: number) => api.demoAvanzarDias(dias), onSuccess: todo }),
    suspender: useMutation({ mutationFn: (s: boolean) => api.demoSuspender(s), onSuccess: todo }),
    reiniciar: useMutation({ mutationFn: api.demoReiniciar, onSuccess: todo }),
  };
}
