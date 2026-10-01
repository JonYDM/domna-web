import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle, ClipboardList, FlaskConical, LayoutDashboard, Package, Store, Users } from "lucide-react";
import { Domi } from "@/components/ilustraciones/Domi";
import { Logo } from "@/components/ilustraciones/Logo";
import { BottomNav, TopNav, type ItemNav } from "@/components/organisms/Navegacion";
import { PerfilMenu } from "@/components/organisms/PerfilMenu";
import { useMetricas } from "@/features/panel/hooks";
import { useSesion } from "@/features/auth/sesion";
import { useConfig } from "@/features/catalogo/hooks";

/** Panel de la dueña. */
export default function DuenaLayout() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const metricas = useMetricas();
  const config = useConfig();

  // Móvil: Inicio al centro y elevado. Escritorio: Inicio primero.
  const inicio: ItemNav = { to: "/app", label: "Inicio", icono: LayoutDashboard, end: true };
  const pedidos: ItemNav = { to: "/app/apartados", label: "Pedidos", icono: ClipboardList, contador: metricas.data?.porVencer };
  const inventario: ItemNav = { to: "/app/inventario", label: "Inventario", icono: Package };
  const clientas: ItemNav = { to: "/app/clientas", label: "Clientas", icono: Users };
  const demo: ItemNav = { to: "/app/demo", label: "Demo", icono: FlaskConical };
  const items: ItemNav[] = [inicio, pedidos, inventario, clientas, demo];
  const itemsMovil: ItemNav[] = [pedidos, inventario, { ...inicio, destacado: true }, clientas, demo];

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
          <PerfilMenu
            nombre={sesion?.nombre ?? "Jesly"}
            subtitulo={`Dueña · ${config.data?.nombre ?? "Jesly Boutique"}`}
            pendientes={metricas.data?.porVencer}
            open={perfilAbierto}
            onOpenChange={setPerfilAbierto}
            onSalir={() => {
              setPerfilAbierto(false);
              salir();
              navigate("/");
            }}
          >
            <nav aria-label="Accesos" className="flex flex-col p-2">
              {!!metricas.data?.porVencer && (
                <Link
                  to="/app/apartados?tipo=apartados&estado=por_vencer"
                  onClick={() => setPerfilAbierto(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-warning-container"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning-container text-warning">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-lg">
                      {metricas.data.porVencer} {metricas.data.porVencer === 1 ? "apartado vence" : "apartados vencen"} pronto
                    </span>
                    <span className="block text-body-sm text-on-surface-variant">En los próximos 3 días</span>
                  </span>
                </Link>
              )}
              <Link
                to="/tienda"
                onClick={() => setPerfilAbierto(false)}
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-label-lg hover:bg-surface-container-low"
              >
                <Store className="h-4 w-4 text-on-surface-variant" aria-hidden />
                Ver la tienda como clienta
              </Link>
            </nav>
          </PerfilMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-12">
        <Outlet />
      </main>
      <BottomNav items={itemsMovil} />
    </div>
  );
}
