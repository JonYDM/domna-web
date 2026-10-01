import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CambioStock, CategoriaInput, ColorInput, FiltroClientas, MotivoAjuste, NuevaClientaInput, NuevoProductoInput, SucursalId } from "@/types/api";
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
      qc.invalidateQueries({ queryKey: qk.categorias() }); // cambia el conteo de prendas
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

/** Stock cambia disponibilidad, novedades ("De vuelta") y métricas → invalida todo eso. */
function useInvalidarStock(productoId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.producto(productoId) });
    qc.invalidateQueries({ queryKey: qk.productosTodos() });
    qc.invalidateQueries({ queryKey: qk.metricas() });
  };
}

/** Guardar el borrador de stock en una sola operación (todo o nada) con su motivo. */
export function useGuardarStock(productoId: string) {
  const invalidar = useInvalidarStock(productoId);
  return useMutation({
    mutationFn: ({ cambios, motivo }: { cambios: CambioStock[]; motivo: MotivoAjuste }) =>
      api.guardarStock(productoId, cambios, motivo),
    onSuccess: invalidar,
  });
}

export function useMoverStock(productoId: string) {
  const invalidar = useInvalidarStock(productoId);
  return useMutation({
    mutationFn: ({ varianteId, desde, cantidad }: { varianteId: string; desde: SucursalId; cantidad: number }) =>
      api.moverStock(varianteId, desde, cantidad),
    onSuccess: invalidar,
  });
}


// ── Clientas ──

export function useClientas(filtro: FiltroClientas, texto: string) {
  return useQuery({
    queryKey: qk.clientas(filtro, texto),
    queryFn: () => api.listarClientas(filtro, texto),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useResumenClientas() {
  return useQuery({ queryKey: qk.resumenClientas(), queryFn: api.obtenerResumenClientas, staleTime: 60_000 });
}

export function useClientaResumen(id: string) {
  return useQuery({ queryKey: qk.clientaResumen(id), queryFn: () => api.obtenerClientaResumen(id), staleTime: 15_000 });
}

/** Alta en mostrador: invalida lista, resumen y métricas. */
export function useCrearClienta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaClientaInput) => api.crearClienta(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.clientasTodos() }),
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
    catalogoPublico: useMutation({ mutationFn: (p: boolean) => api.demoCatalogoPublico(p), onSuccess: todo }),
  };
}

// ── Catálogo de atributos (categorías y colores) ──

export function useGuardarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: CategoriaInput }) => api.guardarCategoria(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categorias() }),
  });
}

export function useEliminarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.eliminarCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categorias() }),
  });
}

export function useGuardarColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: ColorInput }) => api.guardarColor(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.colores() }),
  });
}

export function useEliminarColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.eliminarColor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.colores() }),
  });
}
