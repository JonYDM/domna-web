import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { SesionProvider } from "@/features/auth/SesionProvider";
import { ApiError } from "@/lib/errores";
import { MARCA } from "@/lib/marca";

/** Providers globales: TanStack Query (estado de servidor), sesión y toasts. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // No reintentar errores de negocio/permiso (no cambian al reintentar).
            retry: (fallos, error) => {
              if (error instanceof ApiError && error.status < 500) return false;
              return fallos < 1;
            },
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

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
