import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Pipette, Trash2 } from "lucide-react";
import type { ColorCatalogo } from "@/types/api";
import { Button, Chip, Drawer, Input, Interruptor } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { cn } from "@/lib/cn";
import { esClaro } from "@/lib/color";
import { aplicarColorDeFoto, hexDeNombre, nombreDeHex } from "@/lib/colorMuestra";
import { cambioElColor, ofrecerAplicarAPrendas, textoPrendas } from "@/lib/colorPrendas";
import { useEliminarColor, useGuardarColor, useUsoColor } from "../hooks";
import { SelectorDeColor } from "@/components/molecules/SelectorDeColor";
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
    // Solo reacciona al nombre: si reaccionara al hex, mover el selector volvería a llenar el tono.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre]);

  const hayTonoPorNombre = valido && hex.toUpperCase() === automatico.current;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => onNombre(e.target.value)}
          placeholder="Verde menta"
          maxLength={24}
          // Un puntito con el color que llevas: la única vista previa, sin ocupar una sección.
          icono={
            <span
              className={cn(
                "h-5 w-5 rounded-full border",
                valido ? (esClaro(hex) ? "border-outline-variant" : "border-transparent") : "border-dashed border-outline",
              )}
              style={valido ? { backgroundColor: hex } : undefined}
              aria-hidden
            />
          }
        />
        {sugerido && nombre.trim().toLowerCase() !== sugerido.toLowerCase() && (
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span>Se parece a</span>
            <Chip onClick={() => onNombre(sugerido)}>{sugerido}</Chip>
          </div>
        )}
      </div>

      {/* Lo más fácil para igualar la tela va primero. */}
      {onTomarDeFoto && (
        <>
          <Button type="button" variant="outline" size="lg" fullWidth onClick={onTomarDeFoto}>
            <Pipette className="h-5 w-5" aria-hidden />
            Tomar el color de una foto
          </Button>
          <div className="flex items-center gap-3 text-body-sm text-on-surface-variant" aria-hidden>
            <span className="h-px flex-1 bg-outline-variant/60" />
            o elígelo a mano
            <span className="h-px flex-1 bg-outline-variant/60" />
          </div>
        </>
      )}

      <SelectorDeColor hex={hex} onChange={onHex} />

      {hayTonoPorNombre && (
        <p className="text-body-sm text-on-surface-variant">
          Es un tono de referencia para «{nombre.trim()}». Muévelo si tu prenda se ve distinta.
        </p>
      )}
    </div>
  );
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

  // Cada prenda guarda su PROPIA copia del color: editar el catálogo no la toca. Si el color se usa en
  // prendas y se está cambiando, se ofrece llevar el cambio también ahí (activado por defecto).
  const uso = useUsoColor(color?.id);
  const [aplicar, setAplicar] = useState(true);
  const prendas = uso.data?.prendas ?? 0;
  const desactualizadas = uso.data?.desactualizadas ?? 0;
  const ofrecerPrendas = ofrecerAplicarAPrendas({ original: color, nombre, hex, valido, prendas, desactualizadas });
  // Sin cambios pero con prendas atrasadas: la oferta es "ponerlas al día", y cuenta solo esas.
  const soloPonerAlDia = !!color && !cambioElColor(color, nombre, hex);
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
                { id: color?.id ?? null, input: { nombre, hex, aplicarAPrendas: ofrecerPrendas && aplicar } },
                {
                  onSuccess: (c) => {
                    const n = c.prendasActualizadas ?? 0;
                    toast.success(
                      !color
                        ? `Color “${c.nombre}” agregado`
                        : n > 0
                          ? `Color actualizado · también en ${textoPrendas(n)}`
                          : "Color actualizado",
                    );
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
        {ofrecerPrendas && (
          <Interruptor
            checked={aplicar}
            onChange={setAplicar}
            label={soloPonerAlDia ? `Poner al día ${textoPrendas(desactualizadas)}` : `Cambiarlo también en ${textoPrendas(prendas)}`}
            descripcion={
              soloPonerAlDia
                ? "Estas prendas todavía muestran un tono anterior de este color. Cada prenda guarda su propia copia: actívalo para que se vean como está en el catálogo."
                : "Cada prenda guarda su propia copia del color. Actívalo para que estas prendas se vean con el color nuevo; si no, solo cambia en el catálogo."
            }
          />
        )}
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
