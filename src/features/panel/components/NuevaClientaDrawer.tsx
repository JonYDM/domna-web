import { useState } from "react";
import toast from "react-hot-toast";
import type { Clienta } from "@/types/api";
import { Button, Drawer, Input } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { useCrearClienta } from "../hooks";

/** Alta en mostrador: nombre y teléfono (el correo es opcional). */
export function NuevaClientaDrawer({ open, onClose, onCreada }: { open: boolean; onClose: () => void; onCreada: (c: Clienta) => void }) {
  const crear = useCrearClienta();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const digitos = telefono.replace(/\D/g, "").length;
  const valido = nombre.trim().length >= 3 && digitos === 10;

  function guardar() {
    crear.mutate(
      { nombre, telefono, email: email || undefined },
      {
        onSuccess: (c) => {
          toast.success(`${c.nombre.split(" ")[0]} quedó registrada`);
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
      title="Nueva clienta"
      descripcion="Para quien compra en tienda. Si después entra con Google y usa este teléfono, su cuenta se liga sola."
      pie={
        <Button size="lg" fullWidth disabled={!valido} loading={crear.isPending} onClick={guardar}>
          Registrar clienta
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
        <Input label="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" autoFocus />
        <Input
          label="WhatsApp (10 dígitos)"
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(formatTelefonoInput(e.target.value))}
          maxLength={12}
          placeholder="777 123 4567"
          error={telefono && digitos !== 10 ? "Debe tener 10 dígitos" : undefined}
        />
        <Input
          label="Correo (opcional)"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@gmail.com"
        />
        <button type="submit" hidden aria-hidden />
      </form>
    </Drawer>
  );
}
