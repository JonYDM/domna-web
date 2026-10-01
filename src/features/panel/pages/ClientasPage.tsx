import { memo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, UserPlus } from "lucide-react";
import type { ClientaResumen, FiltroClientas } from "@/types/api";
import { GoogleLogo } from "@/components/ilustraciones/GoogleLogo";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Avatar, Badge, Button, Chip, Skeleton } from "@/components/ui";
import { formatHace, formatMXN } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { useClientas, useResumenClientas } from "../hooks";
import { NuevaClientaDrawer } from "../components/NuevaClientaDrawer";
import { OrigenBadge } from "../components/OrigenBadge";

const FILTROS: { id: FiltroClientas; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "activas", label: "Con apartado activo" },
  { id: "nuevas", label: "Nuevas (7 días)" },
  { id: "cargo", label: "Con cargo pendiente" },
];

/** Clientas de la boutique: cuántas hay, de dónde llegaron y su actividad. */
export default function ClientasPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filtro = (FILTROS.some((f) => f.id === params.get("filtro")) ? params.get("filtro") : "todas") as FiltroClientas;
  const nueva = params.get("nueva") === "1";
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const timer = useRef<number>();
  const clientas = useClientas(filtro, busqueda);
  const resumen = useResumenClientas();

  function param(k: string, v?: string) {
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (v) n.set(k, v);
        else n.delete(k);
        return n;
      },
      { replace: true },
    );
  }

  function onTexto(v: string) {
    setTexto(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusqueda(v.trim()), 300);
  }

  const r = resumen.data;
  const lista = clientas.data ?? [];
  const pctGoogle = r && r.total ? Math.round((r.porOrigen.google / r.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-marca text-headline-lg">Clientas</h1>
        <Button size="sm" onClick={() => param("nueva", "1")}>
          <UserPlus className="h-4 w-4" aria-hidden />
          Nueva
        </Button>
      </div>

      {!r ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cifra valor={r.total} titulo="Clientas" detalle={`+${r.nuevasSemana} esta semana`} destacada onClick={() => param("filtro")} />
            <Cifra valor={r.nuevasSemana} titulo="Nuevas (7 días)" detalle="Se registraron solas o en tienda" onClick={() => param("filtro", "nuevas")} />
            <Cifra valor={r.conApartadoActivo} titulo="Con apartado activo" detalle="Tienen saldo por pagar" onClick={() => param("filtro", "activas")} />
            <Cifra valor={r.conCargo} titulo="Con cargo pendiente" detalle="Dejaron vencer un apartado" onClick={() => param("filtro", "cargo")} />
          </div>

          <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft" aria-label="Cómo llegaron">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-label-lg">Cómo llegaron</h2>
              <span className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <GoogleLogo className="h-3.5 w-3.5" />
                {pctGoogle}% con Google
              </span>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-container" role="img" aria-label={`Google ${r.porOrigen.google}, mostrador ${r.porOrigen.mostrador}, teléfono ${r.porOrigen.telefono}`}>
              <span className="bg-primary" style={{ width: `${(r.porOrigen.google / r.total) * 100}%` }} />
              <span className="bg-tinta" style={{ width: `${(r.porOrigen.mostrador / r.total) * 100}%` }} />
              <span className="bg-primary-rubor" style={{ width: `${(r.porOrigen.telefono / r.total) * 100}%` }} />
            </div>
            <ul className="tabular mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
              <Leyenda clase="bg-primary" texto={`Google · ${r.porOrigen.google}`} />
              <Leyenda clase="bg-tinta" texto={`Mostrador · ${r.porOrigen.mostrador}`} />
              <Leyenda clase="bg-primary-rubor" texto={`Teléfono · ${r.porOrigen.telefono}`} />
            </ul>
          </section>
        </>
      )}

      <BarraBusqueda valor={texto} onChange={onTexto} placeholder="Nombre, teléfono o correo" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Filtrar clientas">
        {FILTROS.map((f) => (
          <Chip key={f.id} activo={filtro === f.id} onClick={() => param("filtro", f.id === "todas" ? undefined : f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {clientas.isError ? (
        <EmptyState expresion="triste" titulo="Algo salió mal" texto={mensajeError(clientas.error)} />
      ) : clientas.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          expresion="curiosa"
          titulo={busqueda ? "Sin resultados" : "Nadie por aquí"}
          texto={busqueda ? `No hay clientas que coincidan con "${busqueda}".` : "No hay clientas con este filtro."}
        />
      ) : (
        <>
          <p className="tabular -mb-1 text-body-sm text-on-surface-variant">
            {lista.length} {lista.length === 1 ? "clienta" : "clientas"}
          </p>
          <ul className="grid gap-2 md:grid-cols-2" style={{ opacity: clientas.isPlaceholderData ? 0.6 : 1 }}>
            {lista.map((c) => (
              <li key={c.id}>
                <FilaClienta c={c} />
              </li>
            ))}
          </ul>
        </>
      )}

      {nueva && (
        <NuevaClientaDrawer
          open
          onClose={() => param("nueva")}
          onCreada={(c) => navigate(`/app/clientas/${c.id}`, { replace: true })}
        />
      )}
    </div>
  );
}

const FilaClienta = memo(function FilaClienta({ c }: { c: ClientaResumen }) {
  return (
    <Link
      to={`/app/clientas/${c.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-soft hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <Avatar nombre={c.nombre} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-lg">{c.nombre}</p>
        <p className="truncate text-body-sm text-on-surface-variant">
          {c.telefono || "Sin WhatsApp"} · se unió {formatHace(c.creada).toLowerCase()}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <OrigenBadge origen={c.origen} />
          {c.apartadosActivos > 0 && <Badge tono="primary">{c.apartadosActivos} activo{c.apartadosActivos > 1 ? "s" : ""}</Badge>}
          {c.penalizacionPendiente > 0 && <Badge tono="warning">Cargo {formatMXN(c.penalizacionPendiente)}</Badge>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular text-label-lg">{formatMXN(c.totalComprado)}</p>
        <p className="text-label-sm text-on-surface-variant">{c.pedidos} pedidos</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-outline" aria-hidden />
    </Link>
  );
});

function Cifra({
  valor,
  titulo,
  detalle,
  destacada,
  onClick,
}: {
  valor: number;
  titulo: string;
  detalle: string;
  destacada?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        destacada
          ? "flex flex-col gap-0.5 rounded-2xl bg-primary-strong p-4 text-left text-on-primary shadow-soft"
          : "flex flex-col gap-0.5 rounded-2xl bg-surface-container-lowest p-4 text-left shadow-soft hover:shadow-lift"
      }
    >
      <span className={destacada ? "text-label-md text-on-primary/90" : "text-label-md text-on-surface-variant"}>{titulo}</span>
      <span className="tabular text-metric">{valor}</span>
      <span className={destacada ? "text-body-sm text-on-primary/85" : "text-body-sm text-on-surface-variant"}>{detalle}</span>
    </button>
  );
}

function Leyenda({ clase, texto }: { clase: string; texto: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${clase}`} aria-hidden />
      {texto}
    </li>
  );
}
