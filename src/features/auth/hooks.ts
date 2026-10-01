import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CuentaGoogle } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/mock/server";

/** Acceso de clientas. Toda mutación agrega/actualiza clientas → invalida el módulo de la dueña. */
function useInvalidarClientas() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.clientasTodos() });
    qc.invalidateQueries({ queryKey: qk.clientaTodos() });
    qc.invalidateQueries({ queryKey: qk.misApartadosTodos() });
  };
}

export function useEntrarConGoogle() {
  const invalidar = useInvalidarClientas();
  return useMutation({ mutationFn: (c: CuentaGoogle) => api.entrarConGoogle(c), onSuccess: invalidar });
}

export function useGuardarTelefono() {
  const invalidar = useInvalidarClientas();
  return useMutation({
    mutationFn: ({ clientaId, telefono }: { clientaId: string; telefono: string }) => api.guardarTelefono(clientaId, telefono),
    onSuccess: invalidar,
  });
}

export function useEntrarConTelefono() {
  const invalidar = useInvalidarClientas();
  return useMutation({ mutationFn: (t: string) => api.entrarConTelefono(t), onSuccess: invalidar });
}
