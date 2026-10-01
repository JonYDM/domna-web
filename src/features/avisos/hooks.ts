import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Aviso } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/mock/server";

/**
 * Avisos in-app de la clienta. Se refrescan al volver a la app y cada minuto mientras está
 * abierta. (Con la app cerrada, el siguiente paso es Web Push; ver docs/PLANEACION.md.)
 */
export function useAvisos(clientaId: string | undefined) {
  return useQuery({
    queryKey: qk.avisos(clientaId ?? ""),
    queryFn: () => api.misAvisos(clientaId!),
    enabled: !!clientaId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

/** Marcar como leídos: optimista (riesgo bajo) y se revierte si falla. */
export function useMarcarAvisosLeidos(clientaId: string | undefined) {
  const qc = useQueryClient();
  const key = qk.avisos(clientaId ?? "");
  return useMutation({
    mutationFn: (ids: string[]) => api.marcarAvisosLeidos(clientaId!, ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const previo = qc.getQueryData<Aviso[]>(key);
      qc.setQueryData<Aviso[]>(key, (lista) => lista?.map((a) => (ids.includes(a.id) ? { ...a, leido: true } : a)));
      return { previo };
    },
    onError: (_e, _ids, ctx) => qc.setQueryData(key, ctx?.previo),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
