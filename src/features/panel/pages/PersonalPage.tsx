import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { Personal } from "@/types/api";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Avatar, Badge, Button, Skeleton } from "@/components/ui";
import { formatHace } from "@/lib/format";
import { mensajeError } from "@/lib/errores";
import { usePersonal } from "../hooks";
import { NuevaCajeraDrawer } from "../components/NuevaCajeraDrawer";

const NOMBRE_SUCURSAL: Record<string, string> = { temixco: "Temixco", azteca: "La Azteca" };

/** Equipo con acceso al sistema: la dueña y las cajeras. Solo la dueña entra aquí. */
export default function PersonalPage() {
  const personal = usePersonal();
  const [alta, setAlta] = useState(false);
  const lista = personal.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-marca text-headline-lg">Personal</h1>
          <p className="text-body-sm text-on-surface-variant">Quién tiene acceso a tu tienda y a la caja.</p>
        </div>
        <Button size="sm" onClick={() => setAlta(true)}>
          <UserPlus className="h-4 w-4" aria-hidden />
          Nueva cajera
        </Button>
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
            <FilaPersonal key={p.id} p={p} />
          ))}
        </ul>
      )}

      <NuevaCajeraDrawer open={alta} onClose={() => setAlta(false)} onCreada={() => setAlta(false)} />
    </div>
  );
}

function FilaPersonal({ p }: { p: Personal }) {
  const esDuena = p.rol === "duena";
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-soft">
      <Avatar nombre={p.nombre} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-lg">{p.nombre}</p>
        <p className="truncate text-body-sm text-on-surface-variant">
          {p.telefono} · se unió {formatHace(p.creada).toLowerCase()}
        </p>
      </div>
      <Badge tono={esDuena ? "primary" : "neutral"}>
        {esDuena ? "Dueña" : `Cajera · ${NOMBRE_SUCURSAL[p.sucursalCajera ?? ""] ?? p.sucursalCajera}`}
      </Badge>
    </li>
  );
}
