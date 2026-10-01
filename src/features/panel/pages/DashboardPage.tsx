import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, ClipboardList, PackageCheck, Plus, TrendingUp, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Domi } from "@/components/ilustraciones/Domi";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button, ButtonLink, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fechaHoyLarga, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { saludo } from "@/lib/saludo";
import { useSesion } from "@/features/auth/sesion";
import { useMetricas } from "../hooks";

const DIA_CORTO = new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" });

export default function DashboardPage() {
  const { sesion } = useSesion();
  const m = useMetricas();

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center gap-4">
        <Domi size={64} expresion="feliz" />
        <div>
          <p className="text-body-sm text-on-surface-variant">{fechaHoyLarga()}</p>
          <h1 className="font-marca text-headline-lg">
            {saludo()}, {sesion?.nombre}
          </h1>
        </div>
      </section>

      <div className="flex gap-2">
        <ButtonLink to="/app/inventario?nuevo=1" size="sm">
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </ButtonLink>
        <ButtonLink to="/app/apartados" size="sm" variant="outline">
          <Wallet className="h-4 w-4" aria-hidden />
          Registrar abono
        </ButtonLink>
      </div>

      {m.isError ? (
        <EmptyState
          expresion="triste"
          titulo="No pudimos cargar tus métricas"
          texto={mensajeError(m.error)}
          accion={<Button onClick={() => m.refetch()}>Reintentar</Button>}
        />
      ) : m.isPending ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metrica
              to="/app/apartados?tipo=apartados&estado=activo"
              titulo="Apartados activos"
              valor={String(m.data.apartadosActivos)}
              detalle={`${formatMXN(m.data.saldoPorCobrar)} por cobrar`}
              icono={<ClipboardList className="h-5 w-5" aria-hidden />}
              destacada
            />
            <Metrica
              to="/app/apartados?tipo=apartados&estado=por_vencer"
              titulo="Por vencer (3 días)"
              valor={String(m.data.porVencer)}
              detalle={m.data.porVencer ? "Ya les llegó el aviso en la app" : "Todo en orden"}
              icono={<AlertTriangle className="h-5 w-5" aria-hidden />}
              tono={m.data.porVencer ? "warning" : "neutral"}
            />
            <Metrica
              to="/app/apartados?tipo=todo&estado=liquidado"
              titulo="Ventas del mes"
              valor={formatMXN(m.data.ventasMes)}
              detalle={`${m.data.piezasVendidasMes} piezas · ${m.data.comprasMes} de contado`}
              icono={<TrendingUp className="h-5 w-5" aria-hidden />}
              tono="success"
            />
            <Metrica
              to="/app/apartados?tipo=todo&estado=por_entregar"
              titulo="Por entregar"
              valor={String(m.data.porEntregar)}
              detalle={`Conversión de apartados ${m.data.conversion}%`}
              icono={<PackageCheck className="h-5 w-5" aria-hidden />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft lg:col-span-2">
              <h2 className="text-label-lg">Ventas de los últimos 7 días</h2>
              <Barras datos={m.data.ventasUltimos7} />
            </section>

            <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <h2 className="mb-2 text-label-lg">Lo más apartado</h2>
              <ol className="flex flex-col gap-2.5">
                {m.data.topProductos.map((t, i) => (
                  <li key={t.productoId}>
                    <Link to={`/app/inventario/${t.productoId}`} className="flex items-center gap-3 rounded-xl hover:bg-surface-container-low">
                      <span className="tabular w-4 text-label-md text-on-surface-variant">{i + 1}</span>
                      <PrendaImagen silueta={t.silueta} hex={t.colorHex} alt="" className="w-9 shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1 truncate text-body-md">{t.nombre}</span>
                      <span className="tabular text-label-md text-on-surface-variant">{t.unidades} pzs</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-label-lg">Stock bajo</h2>
              <span className="text-body-sm text-on-surface-variant">{m.data.stockBajo.length} variantes</span>
            </div>
            {m.data.stockBajo.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Todo tu inventario está bien surtido.</p>
            ) : (
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {m.data.stockBajo.slice(0, 8).map((s) => (
                  <li key={`${s.productoId}-${s.colorNombre}-${s.talla}`}>
                    <Link
                      to={`/app/inventario/${s.productoId}`}
                      className="flex items-center gap-3 border-b border-outline-variant/40 py-2.5 hover:bg-surface-container-low"
                    >
                      <span className="h-4 w-4 shrink-0 rounded-full border border-on-surface/10" style={{ backgroundColor: s.colorHex }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-md">{s.nombre}</span>
                        <span className="block text-body-sm text-on-surface-variant">
                          {s.colorNombre} · {s.talla}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "tabular rounded-full px-2 py-0.5 text-label-md",
                          s.disponible === 0 ? "bg-error-container text-error" : "bg-warning-container text-warning",
                        )}
                      >
                        {s.disponible === 0 ? "Agotado" : `${s.disponible} pzs`}
                      </span>
                      <ChevronRight className="h-4 w-4 text-outline" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Metrica({
  to,
  titulo,
  valor,
  detalle,
  icono,
  destacada,
  tono = "neutral",
}: {
  to: string;
  titulo: string;
  valor: string;
  detalle: string;
  icono: ReactNode;
  destacada?: boolean;
  tono?: "neutral" | "warning" | "success";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col gap-1 rounded-2xl p-4 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        destacada
          ? "bg-primary-strong text-on-primary"
          : tono === "warning"
            ? "bg-warning-container"
            : tono === "success"
              ? "bg-success-container"
              : "bg-surface-container-lowest",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-label-md",
          destacada ? "text-on-primary/90" : tono === "warning" ? "text-warning" : tono === "success" ? "text-success" : "text-on-surface-variant",
        )}
      >
        {icono}
        {titulo}
      </span>
      <span className="tabular text-metric">{valor}</span>
      <span className={cn("text-body-sm", destacada ? "text-on-primary/85" : "text-on-surface-variant")}>{detalle}</span>
    </Link>
  );
}

function Barras({ datos }: { datos: { dia: string; total: number }[] }) {
  const max = Math.max(1, ...datos.map((d) => d.total));
  return (
    <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label={`Ventas: ${datos.map((d) => `${d.dia} ${formatMXN(d.total)}`).join(", ")}`}>
      {datos.map((d, i) => {
        const hoy = i === datos.length - 1;
        return (
          <div key={d.dia} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="tabular text-[10px] text-on-surface-variant">{d.total ? formatMXN(d.total) : ""}</span>
            <div
              className={cn("w-full max-w-10 rounded-t-lg transition-[height] duration-500", hoy ? "bg-primary" : "bg-primary-rubor")}
              style={{ height: `${Math.max(4, (d.total / max) * 100)}px` }}
            />
            <span className={cn("text-label-sm capitalize", hoy ? "text-on-surface" : "text-on-surface-variant")}>
              {hoy ? "Hoy" : DIA_CORTO.format(new Date(`${d.dia}T12:00:00Z`)).replace(".", "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
