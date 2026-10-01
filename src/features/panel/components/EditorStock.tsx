import { useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeftRight, Minus, Plus, RefreshCw } from "lucide-react";
import type { CambioStock, ProductoDetalle, SucursalId, VarianteDisponible } from "@/types/api";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/cn";
import { mensajeError } from "@/lib/errores";
import { useGuardarStock } from "../hooks";
import { GuardarStockDrawer, type CambioVista } from "./GuardarStockDrawer";
import { MoverStockDrawer } from "./MoverStockDrawer";

const SUCURSALES: { id: SucursalId; nombre: string }[] = [
  { id: "temixco", nombre: "Temixco" },
  { id: "azteca", nombre: "La Azteca" },
];

const clave = (varianteId: string, s: SucursalId) => `${varianteId}|${s}`;

/**
 * Editor de stock por variante:
 * 1. Borrador: se edita con +/− o escribiendo y NADA se guarda hasta confirmar (un solo request).
 * 2. Motivo obligatorio al guardar (historial de movimientos).
 * 3. Mover piezas disponibles entre sucursales.
 * 4. Un color a la vez; cada celda muestra físico, apartadas y disponibles; atajos por color.
 */
export function EditorStock({ producto: p }: { producto: ProductoDetalle }) {
  const [colorId, setColorId] = useState(p.colores[0].id);
  const [borrador, setBorrador] = useState<Record<string, number>>({});
  const [confirmar, setConfirmar] = useState(false);
  const [mover, setMover] = useState<VarianteDisponible | null>(null);
  const guardar = useGuardarStock(p.id);

  const valor = (v: VarianteDisponible, s: SucursalId) => borrador[clave(v.id, s)] ?? v.stock[s];
  const dispFinal = (v: VarianteDisponible) =>
    SUCURSALES.reduce((n, s) => n + Math.max(0, valor(v, s.id) - v.reservadoPorSucursal[s.id]), 0);

  function fijar(v: VarianteDisponible, s: SucursalId, n: number) {
    const limpio = Math.max(0, Math.min(999, Math.floor(Number.isFinite(n) ? n : 0)));
    setBorrador((b) => {
      const k = clave(v.id, s);
      const sig = { ...b };
      if (limpio === v.stock[s]) delete sig[k];
      else sig[k] = limpio;
      return sig;
    });
  }

  // Lista de cambios (para la barra, el resumen y el guardado).
  const cambios = useMemo<CambioVista[]>(() => {
    return p.variantes.flatMap((v) =>
      SUCURSALES.flatMap((s) => {
        const nuevo = borrador[clave(v.id, s.id)];
        if (nuevo === undefined) return [];
        const color = p.colores.find((c) => c.id === v.colorId)!;
        return [
          {
            varianteId: v.id,
            sucursal: s.id,
            nuevo,
            antes: v.stock[s.id],
            talla: v.talla,
            colorNombre: color.nombre,
            colorHex: color.hex,
            sucursalNombre: s.nombre,
            invalido: nuevo < v.reservadoPorSucursal[s.id],
          },
        ];
      }),
    );
  }, [borrador, p]);
  const invalidos = cambios.filter((c) => c.invalido).length;
  const reabastecera = p.variantes.some((v) => v.disponible === 0 && dispFinal(v) > 0);
  const hayCambios = cambios.length > 0;

  // Cambios sin guardar: confirmar antes de salir (navegación interna y cierre de pestaña).
  const blocker = useBlocker(hayCambios && !guardar.isPending);
  useEffect(() => {
    if (!hayCambios) return;
    const fn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [hayCambios]);

  const variantes = p.variantes.filter((v) => v.colorId === colorId);

  function atajoSumar(s: SucursalId) {
    variantes.forEach((v) => fijar(v, s, valor(v, s) + 1));
  }
  function atajoAgotar() {
    // Deja solo lo apartado (no se puede bajar de ahí).
    variantes.forEach((v) => SUCURSALES.forEach((s) => fijar(v, s.id, v.reservadoPorSucursal[s.id])));
  }

  function onGuardar(motivo: Parameters<typeof guardar.mutate>[0]["motivo"]) {
    const payload: CambioStock[] = cambios.map(({ varianteId, sucursal, nuevo }) => ({ varianteId, sucursal, nuevo }));
    guardar.mutate(
      { cambios: payload, motivo },
      {
        onSuccess: (n) => {
          setBorrador({});
          setConfirmar(false);
          toast.success(`Stock actualizado · ${n} ${n === 1 ? "cambio" : "cambios"}`);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <section aria-label="Stock por variante" className={cn("rounded-2xl bg-surface-container-lowest p-4 shadow-soft", hayCambios && "mb-28")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-label-lg">Stock por variante</h2>
          <p className="text-body-sm text-on-surface-variant">Edita y guarda todo junto. Las apartadas no se pueden quitar.</p>
        </div>
      </div>

      {/* Colores */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Color">
        {p.colores.map((c) => {
          const vs = p.variantes.filter((v) => v.colorId === c.id);
          const disp = vs.reduce((n, v) => n + dispFinal(v), 0);
          const editado = cambios.some((x) => vs.some((v) => v.id === x.varianteId));
          const activo = c.id === colorId;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setColorId(c.id)}
              className={cn(
                "relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-label-lg transition-colors",
                activo ? "border-tinta bg-tinta text-on-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low",
              )}
            >
              <span className="h-7 w-7 rounded-full border border-on-surface/15" style={{ backgroundColor: c.hex }} aria-hidden />
              {c.nombre}
              <span className={cn("tabular text-body-sm", activo ? "text-on-primary/80" : "text-on-surface-variant")}>{disp}</span>
              {editado && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-label="con cambios" />}
            </button>
          );
        })}
      </div>

      {/* Atajos del color */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="toolbar" aria-label="Atajos del color">
        {SUCURSALES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => atajoSumar(s.id)}
            aria-label={`Sumar una pieza a cada talla en ${s.nombre}`}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-surface-container px-3 text-label-md text-on-surface hover:bg-surface-container-high"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />1 todas · {s.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={atajoAgotar}
          className="inline-flex h-9 shrink-0 items-center rounded-full px-3 text-label-md text-on-surface-variant hover:bg-surface-container"
        >
          Agotar color
        </button>
      </div>

      {/* Matriz talla × sucursal */}
      <div className="mt-3" role="table" aria-label="Stock del color seleccionado">
        <div role="row" className="grid grid-cols-[2.25rem_1fr_1fr_2.75rem] items-end gap-2 pb-1.5 text-label-md text-on-surface-variant">
          <span role="columnheader">Talla</span>
          {SUCURSALES.map((s) => (
            <span key={s.id} role="columnheader" className="text-center">
              {s.nombre}
            </span>
          ))}
          <span role="columnheader" className="sr-only">
            Mover
          </span>
        </div>
        {variantes.map((v) => (
          <div key={v.id} role="row" className="grid grid-cols-[2.25rem_1fr_1fr_2.75rem] items-start gap-2 border-t border-outline-variant/40 py-2.5">
            <span role="rowheader" className="pt-2.5 text-label-lg">
              {v.talla}
            </span>
            {SUCURSALES.map((s) => (
              <Celda
                key={s.id}
                talla={v.talla}
                sucursal={s.nombre}
                valor={valor(v, s.id)}
                original={v.stock[s.id]}
                apartadas={v.reservadoPorSucursal[s.id]}
                onCambiar={(n) => fijar(v, s.id, n)}
              />
            ))}
            <div role="cell" className="flex justify-center">
              <button
                type="button"
                onClick={() => setMover(v)}
                disabled={hayCambios || v.disponible === 0}
                title={hayCambios ? "Guarda o descarta tus cambios para mover piezas" : "Mover entre sucursales"}
                aria-label={`Mover talla ${v.talla} entre sucursales`}
                className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>

      {reabastecera && (
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-success-container px-3 py-2.5 text-body-sm text-success">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Al guardar, la prenda saldrá 7 días en “De vuelta en stock” de la tienda.
        </p>
      )}

      {/* Barra de cambios pendientes */}
      {hayCambios && (
        <div className="fixed inset-x-0 bottom-[6.25rem] z-30 px-4 md:bottom-6">
          <div className="anim-sube mx-auto flex max-w-3xl items-center gap-2 rounded-2xl bg-tinta p-2 pl-4 text-on-primary shadow-float">
            <span className="min-w-0 flex-1 text-label-lg">
              {cambios.length} {cambios.length === 1 ? "cambio" : "cambios"}
              {invalidos > 0 && <span className="block text-body-sm text-primary-rubor">Corrige {invalidos} (menos que lo apartado)</span>}
            </span>
            <Button variant="ghost" size="sm" className="text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary" onClick={() => setBorrador({})}>
              Descartar
            </Button>
            <Button size="sm" disabled={invalidos > 0} onClick={() => setConfirmar(true)}>
              Guardar
            </Button>
          </div>
        </div>
      )}

      <GuardarStockDrawer
        open={confirmar}
        onClose={() => setConfirmar(false)}
        cambios={cambios}
        reabastecera={reabastecera}
        guardando={guardar.isPending}
        onGuardar={onGuardar}
      />

      {mover && (
        <MoverStockDrawer
          key={mover.id}
          productoId={p.id}
          variante={mover}
          colorNombre={p.colores.find((c) => c.id === mover.colorId)?.nombre ?? ""}
          onClose={() => setMover(null)}
        />
      )}

      {blocker.state === "blocked" && (
        <Drawer open onClose={() => blocker.reset()} title="Tienes cambios sin guardar">
          <p className="text-body-md text-on-surface-variant">
            Si sales ahora se pierden {cambios.length} {cambios.length === 1 ? "cambio" : "cambios"} de stock.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" onClick={() => blocker.proceed()}>
              Salir sin guardar
            </Button>
            <Button fullWidth onClick={() => blocker.reset()}>
              Seguir editando
            </Button>
          </div>
        </Drawer>
      )}
    </section>
  );
}

function Celda({
  talla,
  sucursal,
  valor,
  original,
  apartadas,
  onCambiar,
}: {
  talla: string;
  sucursal: string;
  valor: number;
  original: number;
  apartadas: number;
  onCambiar: (n: number) => void;
}) {
  const delta = valor - original;
  const invalido = valor < apartadas;
  const disponibles = Math.max(0, valor - apartadas);
  return (
    <div role="cell" className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-colors",
          invalido ? "border-error bg-error-container/40" : delta !== 0 ? "border-tinta bg-surface-container-low" : "border-outline-variant",
        )}
      >
        <button
          type="button"
          onClick={() => onCambiar(valor - 1)}
          disabled={valor <= apartadas}
          className="grid h-10 w-8 place-items-center text-on-surface-variant disabled:opacity-30"
          aria-label={`Quitar una pieza, talla ${talla}, ${sucursal}`}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={valor}
          onChange={(e) => onCambiar(Number(e.target.value.replace(/\D/g, "") || 0))}
          onFocus={(e) => e.target.select()}
          aria-label={`Piezas talla ${talla} en ${sucursal}`}
          aria-invalid={invalido}
          className="tabular h-10 w-9 bg-transparent text-center text-body-lg font-semibold text-on-surface focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onCambiar(valor + 1)}
          className="grid h-10 w-8 place-items-center text-on-surface-variant"
          aria-label={`Agregar una pieza, talla ${talla}, ${sucursal}`}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        {delta !== 0 && (
          <span
            className={cn(
              "tabular absolute -right-1.5 -top-2 rounded-full px-1.5 text-[10px] font-bold text-on-primary",
              delta > 0 ? "bg-success" : "bg-error",
            )}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <span className={cn("tabular text-[11px] leading-tight", invalido ? "font-semibold text-error" : "text-on-surface-variant")}>
        {invalido ? `mín. ${apartadas}` : apartadas > 0 ? `${apartadas} apart. · ${disponibles} disp.` : `${disponibles} disp.`}
      </span>
    </div>
  );
}
