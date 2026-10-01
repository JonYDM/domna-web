import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Minus, Plus } from "lucide-react";
import type { SucursalId, VarianteDisponible } from "@/types/api";
import { Button, Drawer, Segmentos } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useMoverStock } from "../hooks";

const NOMBRE: Record<SucursalId, string> = { temixco: "Temixco", azteca: "La Azteca" };

/** Mover piezas disponibles de una sucursal a la otra (las apartadas no se mueven). */
export function MoverStockDrawer({
  productoId,
  variante: v,
  colorNombre,
  onClose,
}: {
  productoId: string;
  variante: VarianteDisponible;
  colorNombre: string;
  onClose: () => void;
}) {
  const [desde, setDesde] = useState<SucursalId>(v.disponiblePorSucursal.temixco > 0 ? "temixco" : "azteca");
  const hacia: SucursalId = desde === "temixco" ? "azteca" : "temixco";
  const libres = v.disponiblePorSucursal[desde];
  const [cantidad, setCantidad] = useState(1);
  const n = Math.min(Math.max(1, cantidad), Math.max(1, libres));
  const mover = useMoverStock(productoId);

  function confirmar() {
    mover.mutate(
      { varianteId: v.id, desde, cantidad: n },
      {
        onSuccess: () => {
          toast.success(`${n} ${n === 1 ? "pieza movida" : "piezas movidas"} a ${NOMBRE[hacia]}`);
          onClose();
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Mover entre sucursales"
      descripcion={`${colorNombre} · Talla ${v.talla}`}
      pie={
        <Button size="lg" fullWidth disabled={libres === 0} loading={mover.isPending} onClick={confirmar}>
          Mover {n} {n === 1 ? "pieza" : "piezas"} a {NOMBRE[hacia]}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Segmentos
          aria-label="Dirección"
          activo={desde}
          onChange={(d) => {
            setDesde(d);
            setCantidad(1);
          }}
          segmentos={[
            { id: "temixco", label: "Temixco → La Azteca" },
            { id: "azteca", label: "La Azteca → Temixco" },
          ]}
        />

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <div className="rounded-2xl bg-surface-container-low p-3">
            <p className="text-label-md text-on-surface-variant">{NOMBRE[desde]}</p>
            <p className="tabular text-headline-md">{v.stock[desde] - n}</p>
            <p className="text-body-sm text-on-surface-variant">antes {v.stock[desde]}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" aria-hidden />
          <div className="rounded-2xl bg-primary-soft p-3">
            <p className="text-label-md text-primary-on-soft">{NOMBRE[hacia]}</p>
            <p className="tabular text-headline-md">{v.stock[hacia] + n}</p>
            <p className="text-body-sm text-on-surface-variant">antes {v.stock[hacia]}</p>
          </div>
        </div>

        {libres === 0 ? (
          <p className="rounded-xl bg-warning-container px-3 py-2.5 text-body-sm text-warning">
            En {NOMBRE[desde]} no hay piezas disponibles de esta talla
            {v.reservadoPorSucursal[desde] > 0 ? " (las que hay están apartadas)" : ""}.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-label-lg">Cantidad</p>
              <p className="text-body-sm text-on-surface-variant">
                Hasta {libres} disponibles{v.reservadoPorSucursal[desde] > 0 ? ` (${v.reservadoPorSucursal[desde]} apartadas no se mueven)` : ""}
              </p>
            </div>
            <div className="flex items-center rounded-xl border border-outline-variant">
              <button
                type="button"
                onClick={() => setCantidad(n - 1)}
                disabled={n <= 1}
                className="grid h-11 w-11 place-items-center text-on-surface-variant disabled:opacity-30"
                aria-label="Una pieza menos"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="tabular w-8 text-center text-body-lg font-semibold">{n}</span>
              <button
                type="button"
                onClick={() => setCantidad(n + 1)}
                disabled={n >= libres}
                className="grid h-11 w-11 place-items-center text-on-surface-variant disabled:opacity-30"
                aria-label="Una pieza más"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
