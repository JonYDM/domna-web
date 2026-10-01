import { Link, Outlet } from "react-router-dom";
import { ArrowLeftRight, ShoppingBag, Store } from "lucide-react";
import { Logo } from "@/components/ilustraciones/Logo";
import { BottomNav, TopNav, type ItemNav } from "@/components/organisms/Navegacion";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ButtonLink } from "@/components/ui";
import { useConfig } from "@/features/catalogo/hooks";
import { useMisApartados } from "@/features/apartados/hooks";
import { useSesion } from "@/features/auth/sesion";

/** Portal de la clienta: header sólido (sin blur), nav inferior en móvil. */
export default function TiendaLayout() {
  const { sesion } = useSesion();
  const config = useConfig();
  const apartados = useMisApartados(sesion?.clientaId);
  const activos = apartados.data?.filter((a) => a.estado === "activo").length ?? 0;

  const items: ItemNav[] = [
    { to: "/tienda", label: "Catálogo", icono: Store, end: true },
    { to: "/tienda/apartados", label: "Mis apartados", icono: ShoppingBag, contador: activos },
    { to: "/", label: "Cambiar rol", icono: ArrowLeftRight, end: true },
  ];

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
          <Link to="/tienda" className="flex items-baseline gap-2" aria-label="Domna, ir al catálogo">
            <Logo className="text-[28px]" />
            <span className="hidden text-body-sm text-on-surface-variant sm:inline">
              · {config.data?.nombre ?? "Jesly Boutique"}
            </span>
          </Link>
          <TopNav items={items} />
          {sesion?.rol === "clienta" && (
            <span className="text-body-sm text-on-surface-variant md:hidden">Hola, {sesion.nombre}</span>
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
