import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { PantallaCarga } from "@/components/organisms/PantallaCarga";
import { useSesion } from "@/features/auth/sesion";

const RECARGADO = "domna.recargado-por-chunk-viejo";

/**
 * Como lazy(), pero si el chunk ya no existe en el servidor (deploy nuevo mientras la pestaña
 * seguía abierta con los hashes viejos), recarga la página una sola vez para traer el index.html
 * fresco. Evita la pantalla en blanco de "Failed to fetch dynamically imported module".
 */
function lazyConReintento<T extends { default: ComponentType<unknown> }>(cargar: () => Promise<T>) {
  return lazy(() =>
    cargar().catch((error) => {
      const yaRecargado = sessionStorage.getItem(RECARGADO) === "1";
      if (!yaRecargado) {
        sessionStorage.setItem(RECARGADO, "1");
        window.location.reload();
        // Nunca resuelve: la recarga interrumpe la ejecución antes de que esto importe.
        return new Promise<T>(() => {});
      }
      throw error;
    }),
  );
}

// Lazy por rol: la clienta no descarga el panel de la dueña.
export const TiendaLayout = lazyConReintento(() => import("./layouts/TiendaLayout"));
export const CatalogoPage = lazyConReintento(() => import("@/features/catalogo/pages/CatalogoPage"));
export const ProductoPage = lazyConReintento(() => import("@/features/catalogo/pages/ProductoPage"));
export const MisApartadosPage = lazyConReintento(() => import("@/features/apartados/pages/MisApartadosPage"));
export const CarritoPage = lazyConReintento(() => import("@/features/carrito/pages/CarritoPage"));
export const EntrarPage = lazyConReintento(() => import("@/features/auth/pages/EntrarPage"));
export const PresentacionPage = lazyConReintento(() => import("@/features/presentacion/pages/PresentacionPage"));
export const ClientasPage = lazyConReintento(() => import("@/features/panel/pages/ClientasPage"));
export const ClientaPage = lazyConReintento(() => import("@/features/panel/pages/ClientaPage"));
export const AvisosPage = lazyConReintento(() => import("@/features/avisos/pages/AvisosPage"));
export const ApartadoClientaPage = lazyConReintento(() => import("@/features/apartados/pages/ApartadoClientaPage"));

export const DuenaLayout = lazyConReintento(() => import("./layouts/DuenaLayout"));
export const CajeraLayout = lazyConReintento(() => import("./layouts/CajeraLayout"));
export const CortePage = lazyConReintento(() => import("@/features/panel/pages/CortePage"));
export const VenderPage = lazyConReintento(() => import("@/features/pos/pages/VenderPage"));
export const DashboardPage = lazyConReintento(() => import("@/features/panel/pages/DashboardPage"));
export const ApartadosPage = lazyConReintento(() => import("@/features/panel/pages/ApartadosPage"));
export const ApartadoDuenaPage = lazyConReintento(() => import("@/features/panel/pages/ApartadoDuenaPage"));
export const InventarioPage = lazyConReintento(() => import("@/features/panel/pages/InventarioPage"));
export const ProductoDuenaPage = lazyConReintento(() => import("@/features/panel/pages/ProductoDuenaPage"));
export const PersonalPage = lazyConReintento(() => import("@/features/panel/pages/PersonalPage"));
export const CategoriasPage = lazyConReintento(() => import("@/features/panel/pages/CategoriasPage"));
export const ColoresPage = lazyConReintento(() => import("@/features/panel/pages/ColoresPage"));

/** Suspense con la carga de Domi. */
export function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PantallaCarga />}>{children}</Suspense>;
}

/** Guardia del panel (en producción: rol del token). */
export function SoloDuena({ children }: { children: ReactNode }) {
  const { sesion } = useSesion();
  if (sesion?.rol !== "duena") return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Guardia de staff: dueña o cajera (POS, alta de productos). En producción: rol del token. */
export function SoloStaff({ children }: { children: ReactNode }) {
  const { sesion } = useSesion();
  if (sesion?.rol !== "duena" && sesion?.rol !== "cajera") return <Navigate to="/" replace />;
  return <>{children}</>;
}
