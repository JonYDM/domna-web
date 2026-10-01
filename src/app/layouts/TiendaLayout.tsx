import { useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, ShoppingBag, Store } from "lucide-react";
import { DomiImagen } from "@/components/ilustraciones/DomiImagen";
import { Logo } from "@/components/ilustraciones/Logo";
import { BottomNav, TopNav, type ItemNav } from "@/components/organisms/Navegacion";
import { PerfilMenu } from "@/components/organisms/PerfilMenu";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ButtonLink } from "@/components/ui";
import { useConfig } from "@/features/catalogo/hooks";
import { useClienta, useMisApartados } from "@/features/apartados/hooks";
import { useAvisos } from "@/features/avisos/hooks";
import { AvisosPopover } from "@/features/avisos/components/AvisosPopover";
import { useSesion } from "@/features/auth/sesion";
import { enCurso } from "@/lib/enums";

/** Portal de la clienta: header sólido (sin blur), nav inferior en móvil. */
export default function TiendaLayout() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const config = useConfig();
  const clienta = useClienta(sesion?.rol === "clienta" ? sesion.clientaId : undefined);
  const apartados = useMisApartados(sesion?.clientaId);
  const activos = apartados.data?.filter(enCurso).length ?? 0;
  const avisos = useAvisos(sesion?.rol === "clienta" ? sesion.clientaId : undefined);
  const sinLeer = avisos.data?.filter((a) => !a.leido).length ?? 0;

  const items: ItemNav[] = [
    { to: "/tienda", label: "Catálogo", icono: Store, end: true },
    { to: "/tienda/apartados", label: "Mis pedidos", icono: ShoppingBag, contador: activos },
    { to: "/", label: "Cambiar rol", icono: ArrowLeftRight, end: true },
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
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/tienda" className="flex min-w-0 items-center gap-2" aria-label="Domna, ir al catálogo">
            <DomiImagen ancho={40} prioridad />
            <span className="flex min-w-0 flex-col leading-tight">
              <Logo className="text-[20px]" />
              <span className="truncate text-label-sm uppercase text-on-surface-variant">
                {config.data?.nombre ?? "Jesly Boutique"}
              </span>
            </span>
          </Link>
          <TopNav items={items} />
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
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-12">
        <Outlet />
      </main>
      <BottomNav items={items} />
    </div>
  );
}
