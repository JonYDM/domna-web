import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import type { ColorCatalogo } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { Button, Drawer, Input } from "@/components/ui";
import { FAMILIAS_COLOR } from "@/lib/enums";
import { mensajeError } from "@/lib/errores";
import { familiaDeHex } from "@/lib/color";
import { useEliminarColor, useGuardarColor } from "../hooks";

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Campos de color reutilizables (nombre + selector + vista previa). También se usan en el alta de producto. */
export function CamposColor({
  nombre,
  hex,
  onNombre,
  onHex,
}: {
  nombre: string;
  hex: string;
  onNombre: (v: string) => void;
  onHex: (v: string) => void;
}) {
  const valido = HEX.test(hex);
  const familia = valido ? FAMILIAS_COLOR.find((f) => f.id === familiaDeHex(hex))?.nombre : undefined;
  return (
    <div className="flex flex-col gap-4">
      <Input label="Nombre" value={nombre} onChange={(e) => onNombre(e.target.value)} placeholder="Verde menta" maxLength={24} />
      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-on-surface-variant">Color</span>
          <input
            type="color"
            value={valido ? hex : "#000000"}
            onChange={(e) => onHex(e.target.value.toUpperCase())}
            className="h-12 w-16 cursor-pointer rounded-xl border border-outline-variant bg-surface-container-lowest p-1"
            aria-label="Elegir color"
          />
        </label>
        <div className="flex-1">
          <Input
            label="Código"
            value={hex}
            onChange={(e) => onHex(e.target.value.trim().toUpperCase())}
            maxLength={7}
            placeholder="#A7D7C5"
            error={hex && !valido ? "Formato #RRGGBB" : undefined}
            autoCapitalize="characters"
          />
        </div>
      </div>
      {valido && (
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
          <PrendaImagen silueta="vestido" hex={hex} alt="" className="w-14 shrink-0 rounded-lg" />
          <p className="text-body-sm text-on-surface-variant">
            En el filtro de la tienda cuenta como <strong className="text-on-surface">{familia}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

/** Alta y edición de un color del catálogo. */
export function ColorDrawer({ color, onClose }: { color: ColorCatalogo | null; onClose: () => void }) {
  const [nombre, setNombre] = useState(color?.nombre ?? "");
  const [hex, setHex] = useState(color?.hex ?? "#A7D7C5");
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const guardar = useGuardarColor();
  const eliminar = useEliminarColor();
  const valido = nombre.trim().length >= 2 && HEX.test(hex);

  return (
    <Drawer
      open
      onClose={onClose}
      title={color ? "Editar color" : "Nuevo color"}
      descripcion="Las prendas que ya lo usan guardan su propia copia del color."
      pie={
        <Button
          size="lg"
          fullWidth
          disabled={!valido}
          loading={guardar.isPending}
          onClick={() =>
            guardar.mutate(
              { id: color?.id ?? null, input: { nombre, hex } },
              {
                onSuccess: (c) => {
                  toast.success(color ? "Color actualizado" : `Color “${c.nombre}” agregado`);
                  onClose();
                },
                onError: (e) => toast.error(mensajeError(e)),
              },
            )
          }
        >
          {color ? "Guardar cambios" : "Agregar color"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <CamposColor nombre={nombre} hex={hex} onNombre={setNombre} onHex={setHex} />
        {color && (
          <section className="border-t border-outline-variant/60 pt-4">
            {confirmarBorrar ? (
              <div className="flex items-center gap-2 rounded-2xl bg-error-container p-3">
                <p className="flex-1 text-body-sm text-error">¿Quitar “{color.nombre}” del catálogo?</p>
                <Button variant="ghost" size="sm" onClick={() => setConfirmarBorrar(false)}>
                  No
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={eliminar.isPending}
                  onClick={() =>
                    eliminar.mutate(color.id, {
                      onSuccess: () => {
                        toast.success("Color quitado");
                        onClose();
                      },
                      onError: (e) => toast.error(mensajeError(e)),
                    })
                  }
                >
                  Sí, quitar
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="text-error" onClick={() => setConfirmarBorrar(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Quitar del catálogo
              </Button>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}
