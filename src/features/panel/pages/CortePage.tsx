import { Banknote, Package, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import type { SucursalId } from "@/types/api";
import { ButtonLink, Skeleton } from "@/components/ui";
import { formatMXN } from "@/lib/format";
import { useSesion } from "@/features/auth/sesion";
import { useCorteDia } from "../hooks";

const NOMBRE_SUCURSAL: Record<SucursalId, string> = {
  temixco: "Temixco",
  azteca: "La Azteca",
};

/**
 * Corte del día de la cajera: lo único de dinero que ve (venta y ganancia del DÍA de su sucursal).
 * No tiene acceso a métricas del mes ni a la ganancia total.
 */
export default function CortePage() {
  const { sesion } = useSesion();
  const sucursal: SucursalId = sesion?.sucursal ?? "temixco";
  const corte = useCorteDia(sucursal);
  const d = corte.data;

  const tarjetas = [
    { label: "Vendido hoy", valor: d ? formatMXN(d.ventasDia) : "", icono: Banknote, tono: "bg-primary-soft text-primary-strong" },
    { label: "Ganancia de hoy", valor: d ? formatMXN(d.gananciaDia) : "", icono: TrendingUp, tono: "bg-success-container text-success" },
    { label: "Piezas vendidas", valor: d ? String(d.piezasDia) : "", icono: Package, tono: "bg-surface-container text-on-surface" },
    { label: "Ventas (tickets)", valor: d ? String(d.tickets) : "", icono: Receipt, tono: "bg-surface-container text-on-surface" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-marca text-headline-lg">Corte del día</h1>
        <p className="text-body-md text-on-surface-variant">
          {NOMBRE_SUCURSAL[sucursal]} · lo vendido hoy en tu caja.
        </p>
      </div>

      <ButtonLink to="/caja/vender" size="lg" fullWidth>
        <ShoppingBag className="h-5 w-5" aria-hidden />
        Iniciar una venta
      </ButtonLink>

      <div className="grid grid-cols-2 gap-3">
        {tarjetas.map((t) => {
          const Icono = t.icono;
          return (
            <div key={t.label} className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${t.tono}`}>
                <Icono className="h-5 w-5" aria-hidden />
              </span>
              {corte.isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <span className="tabular text-headline-sm">{t.valor}</span>
              )}
              <span className="text-body-sm text-on-surface-variant">{t.label}</span>
            </div>
          );
        })}
      </div>

      <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
        El total del mes y la ganancia global solo los ve la dueña. Aquí ves tu corte del día.
      </p>
    </div>
  );
}
