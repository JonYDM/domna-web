import { useState } from "react";
import toast from "react-hot-toast";
import type { Personal, SucursalId } from "@/types/api";
import { Button, Drawer, Input, Select } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { useCrearCajera } from "../hooks";

const SUCURSALES: { value: SucursalId; label: string }[] = [
  { value: "temixco", label: "Temixco" },
  { value: "azteca", label: "La Azteca" },
];

/** Alta de cajera: nombre, teléfono (su acceso), PIN inicial de 6 dígitos y su sucursal. */
export function NuevaCajeraDrawer({ open, onClose, onCreada }: { open: boolean; onClose: () => void; onCreada: (c: Personal) => void }) {
  const crear = useCrearCajera();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pin, setPin] = useState("");
  const [sucursal, setSucursal] = useState<SucursalId>("temixco");
  const digitos = telefono.replace(/\D/g, "").length;
  const pinOk = /^\d{6}$/.test(pin);
  const valido = nombre.trim().length >= 2 && digitos === 10 && pinOk;

  function guardar() {
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
      title="Nueva cajera"
      descripcion="Con el teléfono y el PIN entra a la caja de su sucursal."
      pie={
        <Button size="lg" fullWidth disabled={!valido} loading={crear.isPending} onClick={guardar}>
          Dar acceso
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
        <Input
          label="PIN inicial (6 dígitos)"
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="135790"
          error={pin && !pinOk ? "Debe ser de 6 dígitos" : undefined}
        />
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
