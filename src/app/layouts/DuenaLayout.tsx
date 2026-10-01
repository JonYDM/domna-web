import { Link, Outlet } from "react-router-dom";
import { ClipboardList, FlaskConical, LayoutDashboard, LogOut, Package, Store } from "lucide-react";
import { Domi } from "@/components/ilustraciones/Domi";
import { Logo } from "@/components/ilustraciones/Logo";
import { BottomNav, TopNav, type ItemNav } from "@/components/organisms/Navegacion";
import { useMetricas } from "@/features/panel/hooks";
import { useSesion } from "@/features/auth/sesion";
import { useConfig } from "@/features/catalogo/hooks";

/** Panel de la dueña. */
export default function DuenaLayout() {
  const { salir } = useSesion();
  const metricas = useMetricas();
  const config = useConfig();

  const items: ItemNav[] = [
    { to: "/app", label: "Inicio", icono: LayoutDashboard, end: true },
    { to: "/app/apartados", label: "Pedidos", icono: ClipboardList, contador: metricas.data?.porVencer },
    { to: "/app/inventario", label: "Inventario", icono: Package },
    { to: "/app/demo", label: "Demo", icono: FlaskConical },
  ];

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/app" className="flex items-center gap-2.5" aria-label="Ir al inicio del panel">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft">
              <Domi size={34} animar="ninguna" />
            </span>
            <span className="flex flex-col leading-tight">
              <Logo className="text-[20px]" />
              <span className="text-label-sm uppercase text-on-surface-variant">
                {config.data?.nombre ?? "Jesly Boutique"}
              </span>
            </span>
          </Link>
          <TopNav items={items} />
          <div className="flex items-center gap-1">
            <Link
              to="/tienda"
              className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label="Ver la tienda como clienta"
              title="Ver la tienda"
            >
              <Store className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              to="/"
              onClick={salir}
              className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label="Salir"
              title="Salir"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-12">
        <Outlet />
      </main>
      <BottomNav items={items} />
    </div>
  );
}
