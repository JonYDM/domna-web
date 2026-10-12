import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CambioStock, CategoriaInput, ColorInput, AgregarColorInput, CrearCajeraInput, EditarProductoInput, FiltroClientas, FiltroMetricas, MotivoAjuste, NuevaClientaInput, NuevoProductoInput, SucursalId } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/mock/server";
import * as cat from "@/api/catalogoSelector";
import * as personal from "@/api/personal";

export function useMetricas(filtro: FiltroMetricas = {}) {
  const sucursal = filtro.sucursal ?? "todas";
  return useQuery({
    queryKey: qk.metricas(sucursal),
    queryFn: () => api.obtenerMetricas(filtro),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Corte del día de una sucursal (lo que ve la cajera). */
export function useCorteDia(sucursal: SucursalId) {
  return useQuery({ queryKey: qk.corteDia(sucursal), queryFn: () => api.obtenerCorteDia(sucursal), staleTime: 30_000 });
}

export function useCrearProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoProductoInput) => cat.crearProducto(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.categorias() }); // cambia el conteo de prendas
      qc.invalidateQueries({ queryKey: qk.metricasTodos() });
    },
  });
}

export function useEditarProducto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditarProductoInput) => cat.editarProducto(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.producto(id) });
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.metricasTodos() });
    },
  });
}

export function useAgregarColor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AgregarColorInput) => cat.agregarColor(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.producto(id) });
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.metricasTodos() });
    },
  });
}

/** Edición de la galería de un producto: quitar foto, agregar fotos a un color, quitar un color. */
export function useGaleriaProducto(id: string) {
  const qc = useQueryClient();
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: qk.producto(id) });
    qc.invalidateQueries({ queryKey: qk.productosTodos() });
  };
  return {
    quitarImagen: useMutation({ mutationFn: (url: string) => cat.quitarImagen(id, url), onSuccess: invalidar }),
    agregarImagenes: useMutation({
      mutationFn: ({ colorId, urls }: { colorId: string; urls: string[] }) => cat.agregarImagenesColor(id, colorId, urls),
      onSuccess: invalidar,
    }),
    quitarColor: useMutation({ mutationFn: (colorId: string) => cat.quitarColor(id, colorId), onSuccess: invalidar }),
  };
}

export function useCambiarEstadoProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => cat.cambiarEstadoProducto(id, activo),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.producto(v.id) });
      qc.invalidateQueries({ queryKey: qk.metricasTodos() });
    },
  });
}

export function useCambiarPermiteApartado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permite }: { id: string; permite: boolean }) => cat.cambiarPermiteApartado(id, permite),
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
    qc.invalidateQueries({ queryKey: qk.metricasTodos() });
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

// ── Personal (equipo): la dueña ve el staff y da de alta cajeras ──

export function usePersonal() {
  return useQuery({ queryKey: qk.personal(), queryFn: personal.listarPersonal, staleTime: 30_000 });
}

export function useCrearCajera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCajeraInput) => personal.crearCajera(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.personal() }),
  });
}

// ── Catálogo de atributos (categorías y colores) ──

export function useGuardarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: CategoriaInput }) => cat.guardarCategoria(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categorias() }),
  });
}

export function useEliminarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cat.eliminarCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categorias() }),
  });
}

export function useGuardarColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: ColorInput }) => cat.guardarColor(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.colores() }),
  });
}

export function useEliminarColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cat.eliminarColor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.colores() }),
  });
}
