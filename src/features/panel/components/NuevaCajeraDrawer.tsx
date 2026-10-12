import { useState } from "react";
import toast from "react-hot-toast";
import type { Personal, SucursalId } from "@/types/api";
import { Button, Drawer, Input, Select } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { useCrearCajera, useEditarCajera } from "../hooks";

const SUCURSALES: { value: SucursalId; label: string }[] = [
  { value: "temixco", label: "Temixco" },
  { value: "azteca", label: "La Azteca" },
];

/**
 * Alta o edición de una cajera. En alta pide también el PIN inicial; al editar, el PIN se cambia
 * aparte (ResetPinDrawer), porque es una acción distinta y más sensible.
 */
export function NuevaCajeraDrawer({
  open,
  onClose,
  onCreada,
  editar,
}: {
  open: boolean;
  onClose: () => void;
  onCreada: (c: Personal) => void;
  /** Si viene, el drawer edita esta cajera en vez de crear una nueva. */
  editar?: Personal;
}) {
  const crear = useCrearCajera();
  const editarCajera = useEditarCajera();
  const [nombre, setNombre] = useState(editar?.nombre ?? "");
  const [telefono, setTelefono] = useState(editar?.telefono ?? "");
  const [pin, setPin] = useState("");
  const [sucursal, setSucursal] = useState<SucursalId>(editar?.sucursalCajera ?? "temixco");
  const digitos = telefono.replace(/\D/g, "").length;
  const pinOk = /^\d{6}$/.test(pin);
  const valido = nombre.trim().length >= 2 && digitos === 10 && (editar || pinOk);
  const guardando = crear.isPending || editarCajera.isPending;

  function guardar() {
    if (editar) {
      editarCajera.mutate(
        { id: editar.id, input: { nombre, telefono, sucursal } },
        {
          onSuccess: (c) => {
            toast.success("Datos actualizados");
            onCreada(c);
          },
          onError: (e) => toast.error(mensajeError(e)),
        },
      );
      return;
    }
    crear.mutate(
      { nombre, telefono, pin, sucursal },
      {
        onSuccess: (c) => {
          toast.success(`${c.nombre} ya puede entrar a caja`);
          onCreada(c);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editar ? "Editar cajera" : "Nueva cajera"}
      descripcion={editar ? "Cambia su nombre, teléfono o sucursal." : "Con el teléfono y el PIN entra a la caja de su sucursal."}
      pie={
        <Button size="lg" fullWidth disabled={!valido} loading={guardando} onClick={guardar}>
          {editar ? "Guardar cambios" : "Dar acceso"}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) guardar();
        }}
      >
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" autoFocus />
        <Input
          label="Teléfono (10 dígitos)"
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(formatTelefonoInput(e.target.value))}
          maxLength={12}
          placeholder="777 123 4567"
          error={telefono && digitos !== 10 ? "Debe tener 10 dígitos" : undefined}
        />
        {!editar && (
          <Input
            label="PIN inicial (6 dígitos)"
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="135790"
            error={pin && !pinOk ? "Debe ser de 6 dígitos" : undefined}
          />
        )}
        <Select
          label="Sucursal"
          value={sucursal}
          onChange={(e) => setSucursal(e.target.value as SucursalId)}
          opciones={SUCURSALES}
        />
        <button type="submit" hidden aria-hidden />
      </form>
    </Drawer>
  );
}
