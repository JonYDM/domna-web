import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, X } from "lucide-react";
import type { Categoria } from "@/types/api";
import { Button, Chip, Drawer, Input } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useEliminarCategoria, useGuardarCategoria } from "../hooks";

/** Juegos de tallas frecuentes para no escribirlas una por una. */
const PRESETS: { label: string; tallas: string[] }[] = [
  { label: "Ropa", tallas: ["CH", "M", "G", "XG"] },
  { label: "Ropa extendida", tallas: ["XCH", "CH", "M", "G", "XG", "XXG"] },
  { label: "Numérica", tallas: ["3", "5", "7", "9", "11", "13"] },
  { label: "Calzado", tallas: ["22", "23", "24", "25", "26"] },
  { label: "Única", tallas: ["Única"] },
];

/** Alta y edición de categoría: nombre + su juego de tallas. */
export function CategoriaDrawer({ categoria, onClose }: { categoria: Categoria | null; onClose: () => void }) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [tallas, setTallas] = useState<string[]>(categoria?.tallas ?? ["CH", "M", "G", "XG"]);
  const [nueva, setNueva] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const guardar = useGuardarCategoria();
  const eliminar = useEliminarCategoria();
  const valido = nombre.trim().length >= 2 && tallas.length > 0;

  function agregar() {
    const t = nueva.trim().toUpperCase();
    if (!t) return;
    if (t.length > 6) return toast.error("Máximo 6 caracteres por talla.");
    if (!tallas.includes(t)) setTallas([...tallas, t]);
    setNueva("");
  }

  function onGuardar() {
    guardar.mutate(
      { id: categoria?.id ?? null, input: { nombre, tallas } },
      {
        onSuccess: (c) => {
          toast.success(categoria ? "Categoría actualizada" : `Categoría “${c.nombre}” creada`);
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
      title={categoria ? "Editar categoría" : "Nueva categoría"}
      descripcion="Las tallas se proponen al dar de alta una prenda de esta categoría."
      pie={
        <Button size="lg" fullWidth disabled={!valido} loading={guardar.isPending} onClick={onGuardar}>
          {categoria ? "Guardar cambios" : "Crear categoría"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Trajes de baño" maxLength={30} autoFocus={!categoria} />

        <fieldset>
          <legend className="mb-2 text-label-lg">Tallas</legend>
          <ul className="flex flex-wrap gap-2" aria-label="Tallas de la categoría">
            {tallas.map((t) => (
              <li key={t}>
                <span className="inline-flex h-10 items-center gap-1 rounded-full border border-tinta bg-tinta pl-3.5 pr-1.5 text-label-lg text-on-primary">
                  {t}
                  <button
                    type="button"
                    onClick={() => setTallas(tallas.filter((x) => x !== t))}
                    aria-label={`Quitar talla ${t}`}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-on-primary/15"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
            {tallas.length === 0 && <li className="text-body-sm text-error">Agrega al menos una talla.</li>}
          </ul>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              agregar();
            }}
          >
            <div className="flex-1">
              <Input
                aria-label="Nueva talla"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Agregar talla (p. ej. 28)"
                maxLength={6}
                autoCapitalize="characters"
              />
            </div>
            <Button type="submit" variant="soft" size="icon" className="h-12 w-12" aria-label="Agregar talla" disabled={!nueva.trim()}>
              <Plus className="h-5 w-5" aria-hidden />
            </Button>
          </form>

          <p className="mb-2 mt-4 text-label-md text-on-surface-variant">Usar un juego de tallas</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip key={p.label} activo={p.tallas.join() === tallas.join()} onClick={() => setTallas(p.tallas)} title={p.tallas.join(" · ")}>
                {p.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        {categoria && (
          <section className="border-t border-outline-variant/60 pt-4">
            {categoria.productos > 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Tiene {categoria.productos} {categoria.productos === 1 ? "prenda" : "prendas"}: no se puede borrar. Cambiar las tallas
                no modifica esas prendas, solo las nuevas.
              </p>
            ) : confirmarBorrar ? (
              <div className="flex items-center gap-2 rounded-2xl bg-error-container p-3">
                <p className="flex-1 text-body-sm text-error">¿Borrar “{categoria.nombre}”?</p>
                <Button variant="ghost" size="sm" onClick={() => setConfirmarBorrar(false)}>
                  No
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={eliminar.isPending}
                  onClick={() =>
                    eliminar.mutate(categoria.id, {
                      onSuccess: () => {
                        toast.success("Categoría borrada");
                        onClose();
                      },
                      onError: (e) => toast.error(mensajeError(e)),
                    })
                  }
                >
                  Sí, borrar
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="text-error" onClick={() => setConfirmarBorrar(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Borrar categoría
              </Button>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}
