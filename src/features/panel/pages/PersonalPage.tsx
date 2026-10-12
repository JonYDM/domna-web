import { useCallback, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import toast from "react-hot-toast";
import { KeyRound, MoreVertical, Pencil, Power, UserPlus } from "lucide-react";
import type { Personal } from "@/types/api";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Avatar, Badge, Skeleton } from "@/components/ui";
import { formatHace } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { cn } from "@/lib/cn";
import { useActivarCajera, usePersonal } from "../hooks";
import { useRegistrarFab } from "../fab";
import { NuevaCajeraDrawer } from "../components/NuevaCajeraDrawer";
import { ResetPinDrawer } from "../components/ResetPinDrawer";

const NOMBRE_SUCURSAL: Record<string, string> = { temixco: "Temixco", azteca: "La Azteca" };

/** Equipo con acceso al sistema: la dueña y las cajeras. Solo la dueña entra aquí. */
export default function PersonalPage() {
  const personal = usePersonal();
  const [alta, setAlta] = useState(false);
  const [editando, setEditando] = useState<Personal | null>(null);
  const [resetPin, setResetPin] = useState<Personal | null>(null);
  const lista = personal.data ?? [];

  const abrirAlta = useCallback(() => setAlta(true), []);
  useRegistrarFab("Nueva cajera", UserPlus, abrirAlta);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-marca text-headline-lg">Personal</h1>
        <p className="text-body-sm text-on-surface-variant">Quién tiene acceso a tu tienda y a la caja.</p>
      </div>

      {personal.isError ? (
        <EmptyState expresion="triste" titulo="Algo salió mal" texto={mensajeError(personal.error)} />
      ) : personal.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((p) => (
            <FilaPersonal key={p.id} p={p} onEditar={() => setEditando(p)} onResetPin={() => setResetPin(p)} />
          ))}
        </ul>
      )}

      <NuevaCajeraDrawer open={alta} onClose={() => setAlta(false)} onCreada={() => setAlta(false)} />
      {editando && (
        <NuevaCajeraDrawer open editar={editando} onClose={() => setEditando(null)} onCreada={() => setEditando(null)} />
      )}
      {resetPin && <ResetPinDrawer cajera={resetPin} onClose={() => setResetPin(null)} />}
    </div>
  );
}

function FilaPersonal({ p, onEditar, onResetPin }: { p: Personal; onEditar: () => void; onResetPin: () => void }) {
  const esDuena = p.rol === "duena";
  const activar = useActivarCajera();
  const [abierto, setAbierto] = useState(false);

  function alternarActivo() {
    activar.mutate(
      { id: p.id, activo: !p.activo },
      {
        onSuccess: () => toast.success(p.activo ? `${p.nombre} ya no puede entrar a caja` : `${p.nombre} puede entrar a caja de nuevo`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <li className={cn("flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-soft", !p.activo && "opacity-60")}>
      <Avatar nombre={p.nombre} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-lg">{p.nombre}</p>
        <p className="truncate text-body-sm text-on-surface-variant">
          {p.telefono} · se unió {formatHace(p.creada).toLowerCase()}
        </p>
      </div>
      <Badge tono={esDuena ? "primary" : p.activo ? "neutral" : "warning"}>
        {esDuena ? "Dueña" : !p.activo ? "Sin acceso" : `Cajera · ${NOMBRE_SUCURSAL[p.sucursalCajera ?? ""] ?? p.sucursalCajera}`}
      </Badge>

      {!esDuena && (
        <Popover.Root open={abierto} onOpenChange={setAbierto}>
          <Popover.Trigger
            aria-label={`Más opciones para ${p.nombre}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={6}
              className="popover-anim z-50 w-56 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-1.5 shadow-lift outline-none"
            >
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  onEditar();
                }}
                className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-label-lg text-on-surface hover:bg-surface-container"
              >
                <Pencil className="h-4 w-4 text-on-surface-variant" aria-hidden />
                Editar datos
              </button>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  onResetPin();
                }}
                className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-label-lg text-on-surface hover:bg-surface-container"
              >
                <KeyRound className="h-4 w-4 text-on-surface-variant" aria-hidden />
                Olvidó su PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  alternarActivo();
                }}
                className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-label-lg text-error hover:bg-error-container"
              >
                <Power className="h-4 w-4" aria-hidden />
                {p.activo ? "Desactivar acceso" : "Reactivar acceso"}
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </li>
  );
}
