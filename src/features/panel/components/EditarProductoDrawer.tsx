import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import type { ProductoDetalle } from "@/types/api";
import { Button, Drawer, Input, Interruptor, Textarea } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useEditarProducto } from "../hooks";
import { AgregarColorForm } from "./AgregarColorForm";

/**
 * Edición de los campos simples de una prenda (nombre, descripción, precio, costo, oferta, apartable).
 * No toca colores, tallas, variantes ni stock (eso es la Fase B). Precargado con el producto actual.
 */
export function EditarProductoDrawer({
  producto,
  open,
  onClose,
}: {
  producto: ProductoDetalle;
  open: boolean;
  onClose: () => void;
}) {
  const editar = useEditarProducto(producto.id);

  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion);
  const [precio, setPrecio] = useState(String(producto.precio));
  const [costo, setCosto] = useState(String(producto.costo));
  const [enOferta, setEnOferta] = useState(producto.precioAntes != null);
  const [precioAntes, setPrecioAntes] = useState(producto.precioAntes != null ? String(producto.precioAntes) : "");
  const [permiteApartado, setPermiteApartado] = useState(producto.permiteApartado);
  const [agregandoColor, setAgregandoColor] = useState(false);

  const nPrecio = Number(precio);
  const nCosto = Number(costo) || 0;
  const nAntes = Number(precioAntes);
  const valido =
    nombre.trim().length >= 3 &&
    nPrecio > 0 &&
    (!enOferta || (nAntes > nPrecio)); // el precio anterior debe ser mayor al actual

  function guardar() {
    editar.mutate(
      {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: nPrecio,
        costo: nCosto,
        precioAntes: enOferta ? nAntes : undefined,
        permiteApartado,
      },
      {
        onSuccess: () => {
          toast.success("Prenda actualizada");
          onClose();
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <Drawer open={open} onClose={onClose} title="Editar prenda">
      <div className="flex flex-col gap-4 p-1">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Textarea label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Tela, corte, ocasión…" />
        <div className="flex gap-2">
          <Input
            label="Precio"
            type="number"
            inputMode="decimal"
            min={1}
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            icono={<span className="text-body-lg">$</span>}
          />
          <Input
            label="Costo"
            type="number"
            inputMode="decimal"
            min={0}
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            icono={<span className="text-body-lg">$</span>}
            hint="Solo tú lo ves."
          />
        </div>
        {nPrecio > 0 && nCosto > 0 && nCosto <= nPrecio && (
          <p className="tabular text-body-sm text-on-surface-variant">Ganancia por pieza: ${nPrecio - nCosto}</p>
        )}

        <Interruptor
          checked={enOferta}
          onChange={setEnOferta}
          label="En oferta"
          descripcion="Muestra un precio tachado más alto."
        />
        {enOferta && (
          <Input
            label="Precio anterior (tachado)"
            type="number"
            inputMode="decimal"
            min={nPrecio + 1}
            value={precioAntes}
            onChange={(e) => setPrecioAntes(e.target.value)}
            icono={<span className="text-body-lg">$</span>}
            error={precioAntes && nAntes <= nPrecio ? "Debe ser mayor al precio actual" : undefined}
          />
        )}

        <Interruptor
          checked={permiteApartado}
          onChange={setPermiteApartado}
          label="Se puede apartar"
          descripcion="Apágalo para venderla solo de contado."
        />

        {/* Colores actuales y sus fotos. */}
        <div className="border-t border-outline-variant/60 pt-4">
          <p className="mb-2.5 text-label-lg">Colores y fotos</p>
          <div className="flex flex-col gap-3">
            {producto.colores.map((c) => {
              const fotos = producto.imagenes.filter((i) => i.colorId === c.id);
              return (
                <div key={c.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full border border-on-surface/10" style={{ backgroundColor: c.hex }} aria-hidden />
                    <span className="text-body-sm">{c.nombre}</span>
                  </span>
                  {fotos.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fotos.map((f, i) => (
                        <img
                          key={i}
                          src={f.url}
                          alt={`${c.nombre} ${i + 1}`}
                          loading="lazy"
                          className="h-16 w-12 rounded-md object-cover ring-1 ring-black/5"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-body-sm text-on-surface-variant">Sin fotos</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agregar color: crea variantes nuevas (color × tallas) con sus fotos. */}
        <div className="border-t border-outline-variant/60 pt-4">
          {agregandoColor ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-label-lg">Agregar un color</p>
                <button type="button" onClick={() => setAgregandoColor(false)} className="text-label-md text-on-surface-variant hover:text-on-surface">
                  Cancelar
                </button>
              </div>
              <AgregarColorForm producto={producto} onListo={() => setAgregandoColor(false)} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAgregandoColor(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-label-lg text-primary-strong hover:bg-primary-soft"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Agregar un color (con sus fotos y tallas)
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button fullWidth disabled={!valido} loading={editar.isPending} onClick={guardar}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
