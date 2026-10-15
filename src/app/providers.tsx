import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { SesionProvider } from "@/features/auth/SesionProvider";
import { debeReintentar, esperaReintento } from "@/lib/reintento";
import { MARCA } from "@/lib/marca";
import { sincronizarCatalogoEntreVentanas } from "@/lib/sincronizacionCatalogo";

/** Providers globales: TanStack Query (estado de servidor), sesión y toasts. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reintenta cortes de red/timeout (hasta 2 veces); no reintenta errores de negocio (4xx)
            // y da un solo reintento a 5xx persistentes. Espera exponencial entre intentos.
            retry: debeReintentar,
            retryDelay: esperaReintento,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  // Lo que se publica o edita en una ventana de la app se refleja en las demás sin recargar.
  useEffect(() => sincronizarCatalogoEntreVentanas(queryClient), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SesionProvider>{children}</SesionProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          className: "!rounded-2xl !bg-tinta !text-on-primary !text-body-md !shadow-lift",
          success: { iconTheme: { primary: MARCA.rojo, secondary: MARCA.blanco } },
        }}
      />
    </QueryClientProvider>
  );
}
