import { lazy, Suspense, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { PantallaCarga } from "@/components/organisms/PantallaCarga";
import { useSesion } from "@/features/auth/sesion";

// Lazy por rol: la clienta no descarga el panel de la dueña.
export const TiendaLayout = lazy(() => import("./layouts/TiendaLayout"));
export const CatalogoPage = lazy(() => import("@/features/catalogo/pages/CatalogoPage"));
export const ProductoPage = lazy(() => import("@/features/catalogo/pages/ProductoPage"));
export const MisApartadosPage = lazy(() => import("@/features/apartados/pages/MisApartadosPage"));
export const EntrarPage = lazy(() => import("@/features/auth/pages/EntrarPage"));
export const ClientasPage = lazy(() => import("@/features/panel/pages/ClientasPage"));
export const ClientaPage = lazy(() => import("@/features/panel/pages/ClientaPage"));
export const AvisosPage = lazy(() => import("@/features/avisos/pages/AvisosPage"));
export const ApartadoClientaPage = lazy(() => import("@/features/apartados/pages/ApartadoClientaPage"));

export const DuenaLayout = lazy(() => import("./layouts/DuenaLayout"));
export const DashboardPage = lazy(() => import("@/features/panel/pages/DashboardPage"));
export const ApartadosPage = lazy(() => import("@/features/panel/pages/ApartadosPage"));
export const ApartadoDuenaPage = lazy(() => import("@/features/panel/pages/ApartadoDuenaPage"));
export const InventarioPage = lazy(() => import("@/features/panel/pages/InventarioPage"));
export const ProductoDuenaPage = lazy(() => import("@/features/panel/pages/ProductoDuenaPage"));
export const DemoPage = lazy(() => import("@/features/panel/pages/DemoPage"));

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
