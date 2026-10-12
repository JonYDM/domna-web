import { useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Store } from "lucide-react";
import { TopNav, type ItemNav } from "@/components/organisms/Navegacion";
import { PerfilMenu } from "@/components/organisms/PerfilMenu";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ButtonLink } from "@/components/ui";
import { BotonInstalar } from "@/components/organisms/BotonInstalar";
import { CarritoProvider } from "@/features/carrito/CarritoProvider";
import { CarritoIcono } from "@/features/carrito/components/CarritoIcono";
import { useConfig } from "@/features/catalogo/hooks";
import { useClienta, useMisApartados } from "@/features/apartados/hooks";
import { useAvisos } from "@/features/avisos/hooks";
import { AvisosPopover } from "@/features/avisos/components/AvisosPopover";
import { useSesion } from "@/features/auth/sesion";
import { enCurso } from "@/lib/enums";
import { CristalEncabezado, FondoShell, MarcaNombre } from "@/components/organisms/MarcaShell";
import { DockTienda } from "./DockTienda";

/** Portal de la clienta (app shell): encabezado translúcido, dock flotante en móvil, nav superior en escritorio. */
export default function TiendaLayout() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const config = useConfig();
  const nombreBoutique = config.data?.nombre ?? "Jesly Boutique";
  const clienta = useClienta(sesion?.rol === "clienta" ? sesion.clientaId : undefined);
  const apartados = useMisApartados(sesion?.clientaId);
  const activos = apartados.data?.filter(enCurso).length ?? 0;
  const avisos = useAvisos(sesion?.rol === "clienta" ? sesion.clientaId : undefined);
  const sinLeer = avisos.data?.filter((a) => !a.leido).length ?? 0;

  // Navegación de escritorio. En móvil el dock reemplaza a este menú.
  const items: ItemNav[] = [
    { to: "/tienda", label: "Catálogo", icono: Store, end: true },
    { to: "/tienda/apartados", label: "Mis pedidos", icono: ShoppingBag, contador: activos },
  ];

  const location = useLocation();
  const volver = encodeURIComponent(location.pathname + location.search);
  // Catálogo privado (lo decide la dueña): sin cuenta no se ven prendas ni precios.
  if (config.data && !config.data.catalogoPublico && !sesion) {
    return <Navigate to={`/entrar?volver=${volver}`} replace />;
  }

  if (config.data?.suspendida) {
    return (
      <main className="lunares grid min-h-dvh place-items-center bg-surface">
        <EmptyState
          expresion="dormida"
          titulo="Tienda en pausa"
          texto={`${config.data.nombre} volverá muy pronto. Tus apartados siguen guardados.`}
          accion={<ButtonLink to="/" variant="outline">Volver</ButtonLink>}
        />
      </main>
    );
  }

  return (
    <CarritoProvider clientaId={sesion?.rol === "clienta" ? sesion.clientaId : undefined}>
      <div className="relative isolate min-h-dvh bg-surface">
        <header className="sticky top-0 z-30">
          <CristalEncabezado />
          <FondoShell nombre={nombreBoutique} />
          <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
            <Link to="/tienda" className="flex min-w-0 items-center gap-2" aria-label={`${nombreBoutique}, ir al catálogo`}>
              <MarcaNombre nombre={nombreBoutique} />
            </Link>
            <TopNav items={items} />
            <div className="flex items-center gap-1">
              <BotonInstalar compacto className="hidden sm:inline-flex" />
              <div className="hidden md:block">
                <CarritoIcono />
              </div>
              {sesion?.rol === "clienta" && sesion.clientaId && (
                <PerfilMenu
                  nombre={clienta.data?.nombre ?? sesion.nombre}
                  subtitulo={clienta.data?.email ?? clienta.data?.telefono}
                  pendientes={sinLeer}
                  open={perfilAbierto}
                  onOpenChange={setPerfilAbierto}
                  onSalir={() => {
                    setPerfilAbierto(false);
                    salir();
                    navigate("/");
                  }}
                >
                  <AvisosPopover clientaId={sesion.clientaId} onNavegar={() => setPerfilAbierto(false)} />
                </PerfilMenu>
              )}
              {!sesion && (
                <ButtonLink to={`/entrar?volver=${volver}`} size="sm" variant="tinta">
                  Entrar
                </ButtonLink>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-36 pt-4 md:pb-12">
          <Outlet />
        </main>
        <DockTienda pedidosActivos={activos} />
      </div>
    </CarritoProvider>
  );
}
