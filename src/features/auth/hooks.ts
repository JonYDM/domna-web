import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RegistroClientaInput } from "@/types/api";
import { qk } from "@/lib/queryKeys";
import * as api from "@/api/authSelector";

/** Acceso de clientas. Toda mutación agrega/actualiza clientas → invalida el módulo de la dueña. */
function useInvalidarClientas() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.clientasTodos() });
    qc.invalidateQueries({ queryKey: qk.clientaTodos() });
    qc.invalidateQueries({ queryKey: qk.misApartadosTodos() });
  };
}

/** Registro propio (nombre, apellidos, teléfono +52, correo, PIN 6 díg). */
export function useRegistrar() {
  const invalidar = useInvalidarClientas();
  return useMutation({ mutationFn: (input: RegistroClientaInput) => api.registrar(input), onSuccess: invalidar });
}

/** Login con teléfono + PIN. */
export function useLoginConPin() {
  const invalidar = useInvalidarClientas();
  return useMutation({
    mutationFn: ({ telefono, pin }: { telefono: string; pin: string }) => api.loginConPin(telefono, pin),
    onSuccess: invalidar,
  });
}

/** Olvidé mi PIN: pide el enlace de recuperación por correo (en la demo devuelve el token). */
export function useSolicitarRecuperacion() {
  return useMutation({ mutationFn: (email: string) => api.solicitarRecuperacion(email) });
}

/** Fija un PIN nuevo con el token de recuperación. */
export function useConfirmarRecuperacion() {
  const invalidar = useInvalidarClientas();
  return useMutation({
    mutationFn: ({ token, pin }: { token: string; pin: string }) => api.confirmarRecuperacion(token, pin),
    onSuccess: invalidar,
  });
}
