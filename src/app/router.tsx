import { createBrowserRouter } from "react-router-dom";
import { PaginaError } from "@/components/organisms/PaginaError";
import {
  ApartadoClientaPage,
  ApartadoDuenaPage,
  ApartadosPage,
  AvisosPage,
  CajeraLayout,
  CarritoPage,
  CatalogoPage,
  CategoriasPage,
  ClientaPage,
  ClientasPage,
  ColoresPage,
  CortePage,
  DashboardPage,
  DuenaLayout,
  EntrarPage,
  InventarioPage,
  MisApartadosPage,
  DatosBancariosPage,
  PersonalPage,
  PagosPorConfirmarPage,
  ProductoDuenaPage,
  ProductoPage,
  S,
  SoloDuena,
  SoloStaff,
  TiendaLayout,
  VenderPage,
} from "./rutas";

/**
 * Rutas por rol:
 * - /tienda/*  portal de la clienta (catálogo público + apartados)
 * - /app/*     panel de la dueña
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <S>
        <EntrarPage />
      </S>
    ),
    errorElement: <PaginaError tipo="error" />,
  },
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
      { path: "carrito", element: <S><CarritoPage /></S> },
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
      { path: "pagos", element: <S><PagosPorConfirmarPage /></S> },
      { path: "inventario", element: <S><InventarioPage /></S> },
      { path: "inventario/:id", element: <S><ProductoDuenaPage /></S> },
      { path: "clientas", element: <S><ClientasPage /></S> },
      { path: "clientas/:id", element: <S><ClientaPage /></S> },
      { path: "personal", element: <S><PersonalPage /></S> },
      { path: "transferencia", element: <S><DatosBancariosPage /></S> },
      { path: "categorias", element: <S><CategoriasPage /></S> },
      { path: "colores", element: <S><ColoresPage /></S> },
    ],
  },
  {
    path: "/caja",
    element: (
      <SoloStaff>
        <S>
          <CajeraLayout />
        </S>
      </SoloStaff>
    ),
    errorElement: <PaginaError tipo="error" />,
    children: [
      { index: true, element: <S><CortePage /></S> },
      { path: "vender", element: <S><VenderPage /></S> },
      { path: "pagos", element: <S><PagosPorConfirmarPage /></S> },
      { path: "inventario", element: <S><InventarioPage /></S> },
      { path: "inventario/:id", element: <S><ProductoDuenaPage /></S> },
    ],
  },
  { path: "*", element: <PaginaError tipo="404" /> },
]);
