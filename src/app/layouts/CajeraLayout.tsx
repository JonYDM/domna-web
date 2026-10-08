import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Package, Receipt, ShoppingBag } from "lucide-react";
import { DomiImagen } from "@/components/ilustraciones/DomiImagen";
import { Logo } from "@/components/ilustraciones/Logo";
import { BottomNav, TopNav, type ItemNav } from "@/components/organisms/Navegacion";
import { PerfilMenu } from "@/components/organisms/PerfilMenu";
import { useSesion } from "@/features/auth/sesion";
import { useConfig } from "@/features/catalogo/hooks";

const NOMBRE_SUCURSAL: Record<string, string> = { temixco: "Temixco", azteca: "La Azteca" };

/** Panel de la cajera: corte del día e inventario. Sin métricas del mes ni ganancia global. */
export default function CajeraLayout() {
  const { sesion, salir } = useSesion();
  const navigate = useNavigate();
  const config = useConfig();
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const sucursal = sesion?.sucursal ?? "temixco";

  const corte: ItemNav = { to: "/caja", label: "Corte del día", icono: Receipt, end: true };
  const vender: ItemNav = { to: "/caja/vender", label: "Vender", icono: ShoppingBag };
  const inventario: ItemNav = { to: "/caja/inventario", label: "Inventario", icono: Package };
  const items: ItemNav[] = [corte, vender, inventario];
  const itemsMovil: ItemNav[] = [corte, { ...vender, destacado: true }, inventario];

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/caja" className="flex min-w-0 items-center gap-2" aria-label="Ir al corte del día">
            <DomiImagen ancho={40} prioridad />
            <span className="flex flex-col leading-tight">
              <Logo className="text-[20px]" />
              <span className="text-label-sm uppercase text-on-surface-variant">
                Caja · {NOMBRE_SUCURSAL[sucursal] ?? sucursal}
              </span>
            </span>
          </Link>
          <TopNav items={items} />
          <PerfilMenu
            nombre={sesion?.nombre ?? "Caja"}
            subtitulo={`Cajera · ${config.data?.nombre ?? "Jesly Boutique"}`}
            open={perfilAbierto}
            onOpenChange={setPerfilAbierto}
            onSalir={() => {
              setPerfilAbierto(false);
              salir();
              navigate("/");
            }}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-12">
        <Outlet />
      </main>
      <BottomNav items={itemsMovil} />
    </div>
  );
}
