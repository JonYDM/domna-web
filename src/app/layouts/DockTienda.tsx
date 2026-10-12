import { ClipboardList, ShoppingBag, Store } from "lucide-react";
import { Dock, type ItemDock } from "@/components/organisms/Dock";
import { useCarrito } from "@/features/carrito/carrito";

const CATALOGO: ItemDock = { to: "/tienda", label: "Catálogo", icono: Store, end: true };

/**
 * Dock de la tienda (móvil): el mismo componente que el panel de la dueña. Catálogo al centro,
 * Pedidos a la izquierda y Carrito a la derecha con su contador. Debe renderizarse dentro del
 * CarritoProvider porque lee las piezas del carrito.
 */
export function DockTienda({ pedidosActivos }: { pedidosActivos: number }) {
  const { piezas } = useCarrito();

  const pedidos: ItemDock = { to: "/tienda/apartados", label: "Pedidos", icono: ClipboardList, contador: pedidosActivos };
  const carrito: ItemDock = { to: "/tienda/carrito", label: "Carrito", icono: ShoppingBag, contador: piezas };

  return <Dock centro={CATALOGO} izquierda={[pedidos]} derecha={[carrito]} />;
}
