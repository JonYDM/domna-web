import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCarrito } from "../carrito";

/** Ícono de carrito del header de la tienda, con el número de piezas. Lleva a /tienda/carrito. */
export function CarritoIcono() {
  const { piezas } = useCarrito();
  return (
    <Link
      to="/tienda/carrito"
      aria-label={`Carrito${piezas ? `, ${piezas} ${piezas === 1 ? "prenda" : "prendas"}` : " (vacío)"}`}
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface hover:bg-surface-container"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      {piezas > 0 && (
        <span className="tabular absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary ring-2 ring-surface">
          {piezas}
        </span>
      )}
    </Link>
  );
}
