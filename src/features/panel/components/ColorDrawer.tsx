import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Pipette, Trash2 } from "lucide-react";
import type { ColorCatalogo } from "@/types/api";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { Button, Chip, Drawer, Input } from "@/components/ui";
import { FAMILIAS_COLOR } from "@/lib/enums";
import { mensajeError } from "@/lib/errores";
import { familiaDeHex } from "@/lib/color";
import { aplicarColorDeFoto, hexDeNombre, nombreDeHex } from "@/lib/colorMuestra";
import { useEliminarColor, useGuardarColor } from "../hooks";
import { ColorDeFoto, type FotoParaColor } from "./ColorDeFoto";

const HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Campos de color reutilizables (nombre + selector + vista previa). También se usan en el alta de
 * producto.
 *
 * - No hay un color de arranque: un color "sin elegir" no se puede guardar (antes arrancaba en
 *   verde menta y era fácil guardar un "Marfil" verde sin darse cuenta).
 * - Si el nombre es uno conocido ("Marfil"), se propone su tono mientras no se haya elegido otro.
 * - `onTomarDeFoto` abre la vista para tomar el color tocando la foto de la prenda.
 */
export function CamposColor({
  nombre,
  hex,
  onNombre,
  onHex,
  onTomarDeFoto,
}: {
  nombre: string;
  hex: string;
  onNombre: (v: string) => void;
  onHex: (v: string) => void;
  onTomarDeFoto?: () => void;
}) {
  const valido = HEX.test(hex);
  const familia = valido ? FAMILIAS_COLOR.find((f) => f.id === familiaDeHex(hex))?.nombre : undefined;
  const sugerido = valido ? nombreDeHex(hex) : "";
  /** Último tono puesto automáticamente por el nombre: solo ese se puede reemplazar sin preguntar. */
  const automatico = useRef<string | null>(null);

  useEffect(() => {
    const referencia = hexDeNombre(nombre);
    const sinElegir = hex === "" || hex.toUpperCase() === automatico.current;
    if (!sinElegir) return; // la persona ya eligió su color: no se le pisa
    if (referencia) {
      automatico.current = referencia;
      if (referencia !== hex.toUpperCase()) onHex(referencia);
    } else if (automatico.current) {
      automatico.current = null;
      onHex("");
    }
    // Solo reacciona al nombre: si reaccionara al hex, borrar el código a mano lo volvería a llenar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre]);

  const hayTonoPorNombre = valido && hex.toUpperCase() === automatico.current;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Input label="Nombre" value={nombre} onChange={(e) => onNombre(e.target.value)} placeholder="Verde menta" maxLength={24} />
        {sugerido && nombre.trim().toLowerCase() !== sugerido.toLowerCase() && (
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span>Se parece a</span>
            <Chip onClick={() => onNombre(sugerido)}>{sugerido}</Chip>
          </div>
        )}
      </div>

      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-on-surface-variant">Color</span>
          <input
            type="color"
            value={valido ? hex : "#E0E0E0"}
            onChange={(e) => onHex(e.target.value.toUpperCase())}
            className={cn2(valido, "h-12 w-16 cursor-pointer rounded-xl border border-outline-variant bg-surface-container-lowest p-1")}
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

      {!valido && !hex && (
        <p className="-mt-2 text-body-sm text-on-surface-variant">
          Aún no eliges el color. Tócalo arriba, escribe su código o tómalo de una foto de la prenda.
        </p>
      )}
      {hayTonoPorNombre && (
        <p className="-mt-2 text-body-sm text-on-surface-variant">
          Es un tono de referencia para «{nombre.trim()}». Cámbialo si tu prenda se ve distinta.
        </p>
      )}

      {onTomarDeFoto && (
        <Button type="button" variant="ghost" onClick={onTomarDeFoto}>
          <Pipette className="h-4 w-4" aria-hidden />
          Tomar el color de una foto
        </Button>
      )}

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

/** Atenúa el cuadro de color mientras no hay uno elegido. */
function cn2(valido: boolean, base: string): string {
  return valido ? base : `${base} opacity-50`;
}

/** Alta y edición de un color del catálogo. */
export function ColorDrawer({ color, onClose }: { color: ColorCatalogo | null; onClose: () => void }) {
  const [nombre, setNombre] = useState(color?.nombre ?? "");
  const [hex, setHex] = useState(color?.hex ?? "");
  const [vista, setVista] = useState<"formulario" | "foto">("formulario");
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const guardar = useGuardarColor();
  const eliminar = useEliminarColor();
  const valido = nombre.trim().length >= 2 && HEX.test(hex);
  const fotos: FotoParaColor[] = [];

  return (
    <Drawer
      open
      onClose={onClose}
      title={vista === "foto" ? "Color de la foto" : color ? "Editar color" : "Nuevo color"}
      descripcion={vista === "foto" ? undefined : "Las prendas que ya lo usan guardan su propia copia del color."}
      pie={
        vista === "foto" ? undefined : (
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
        )
      }
    >
      {vista === "foto" && (
        <ColorDeFoto
          fotos={fotos}
          onVolver={() => setVista("formulario")}
          onUsar={(nuevo, nombreSugerido) => {
            const r = aplicarColorDeFoto({ nombre, hex }, nuevo, nombreSugerido);
            setHex(r.hex);
            setNombre(r.nombre);
            setVista("formulario");
          }}
        />
      )}
      <div hidden={vista === "foto"} className="flex flex-col gap-5">
        <CamposColor nombre={nombre} hex={hex} onNombre={setNombre} onHex={setHex} onTomarDeFoto={() => setVista("foto")} />
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
