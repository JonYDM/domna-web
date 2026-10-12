import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Apartado, LineaCarrito, MetodoPago, ResultadoCodigo, SucursalId } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as mock from "@/mock/server";
import * as cat from "@/api/catalogoSelector";
import * as apartadosApi from "@/api/apartadosSelector";

/** Busca una variante por código de barras (POS/escáner). On-demand → mutation. */
export function useBuscarPorCodigo() {
  return useMutation<ResultadoCodigo, Error, string>({
    mutationFn: (codigo: string) => cat.buscarPorCodigo(codigo),
  });
}

/** Demo: obtiene un código de barras real del inventario para "simular" una lectura. Solo mock. */
export function useCodigoDemo() {
  return useMutation<string, Error, SucursalId | undefined>({
    mutationFn: (sucursal) => mock.codigoDemo(sucursal),
  });
}

export interface CobrarInput {
  /** Clienta destino. "c-publico" = venta a público general. */
  clientaId: string;
  lineas: LineaCarrito[];
  sucursal: SucursalId;
  metodo: MetodoPago;
}

/**
 * Cobrar una venta en físico (POS): es una compra de contado, canal "fisico".
 * Descuenta stock al momento y refresca corte del día, inventario y métricas.
 */
export function useVenderFisico() {
  const qc = useQueryClient();
  return useMutation<Apartado, Error, CobrarInput>({
    mutationFn: ({ clientaId, lineas, sucursal, metodo }) =>
      apartadosApi.crearApartado(clientaId, {
        lineas,
        modalidad: "compra",
        entrega: sucursal,
        canal: "fisico",
        metodoAnticipo: metodo,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corte"] });
      qc.invalidateQueries({ queryKey: qk.metricasTodos() });
      qc.invalidateQueries({ queryKey: qk.productosTodos() });
      qc.invalidateQueries({ queryKey: qk.productoTodos() });
      qc.invalidateQueries({ queryKey: qk.apartadosTodos() });
      qc.invalidateQueries({ queryKey: qk.clientasTodos() });
    },
  });
}
