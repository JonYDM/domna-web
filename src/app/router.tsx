import { createBrowserRouter } from "react-router-dom";
import { BienvenidaPage } from "@/features/auth/pages/BienvenidaPage";
import { PaginaError } from "@/components/organisms/PaginaError";
import {
  ApartadoClientaPage,
  ApartadoDuenaPage,
  ApartadosPage,
  AvisosPage,
  CatalogoPage,
  CategoriasPage,
  ClientaPage,
  ClientasPage,
  ColoresPage,
  DashboardPage,
  DemoPage,
  DuenaLayout,
  EntrarPage,
  InventarioPage,
  MisApartadosPage,
  ProductoDuenaPage,
  ProductoPage,
  S,
  SoloDuena,
  TiendaLayout,
} from "./rutas";

/**
 * Rutas por rol:
 * - /          bienvenida (elegir rol en la demo)
 * - /tienda/*  portal de la clienta (catálogo público + apartados)
 * - /app/*     panel de la dueña
 */
export const router = createBrowserRouter([
  { path: "/", element: <BienvenidaPage />, errorElement: <PaginaError tipo="error" /> },
  {
    path: "/entrar",
    element: (
      <S>
        <EntrarPage />
      </S>
    ),
    errorElement: <PaginaError tipo="error" />,
  },
  {
    path: "/tienda",
    element: (
      <S>
        <TiendaLayout />
      </S>
    ),
    errorElement: <PaginaError tipo="error" />,
    children: [
      { index: true, element: <S><CatalogoPage /></S> },
      { path: "producto/:id", element: <S><ProductoPage /></S> },
      { path: "apartados", element: <S><MisApartadosPage /></S> },
      { path: "avisos", element: <S><AvisosPage /></S> },
      { path: "apartados/:id", element: <S><ApartadoClientaPage /></S> },
    ],
  },
  {
    path: "/app",
    element: (
      <SoloDuena>
        <S>
          <DuenaLayout />
        </S>
      </SoloDuena>
    ),
    errorElement: <PaginaError tipo="error" />,
    children: [
      { index: true, element: <S><DashboardPage /></S> },
      { path: "apartados", element: <S><ApartadosPage /></S> },
      { path: "apartados/:id", element: <S><ApartadoDuenaPage /></S> },
      { path: "inventario", element: <S><InventarioPage /></S> },
      { path: "inventario/:id", element: <S><ProductoDuenaPage /></S> },
      { path: "clientas", element: <S><ClientasPage /></S> },
      { path: "clientas/:id", element: <S><ClientaPage /></S> },
      { path: "demo", element: <S><DemoPage /></S> },
      { path: "categorias", element: <S><CategoriasPage /></S> },
      { path: "colores", element: <S><ColoresPage /></S> },
    ],
  },
  { path: "*", element: <PaginaError tipo="404" /> },
]);
