import { useState } from "react";
import toast from "react-hot-toast";
import type { Personal } from "@/types/api";
import { Button, Drawer, Input } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useResetPinCajera } from "../hooks";

/** La cajera olvidó su PIN: la dueña le fija uno nuevo de 6 dígitos. */
export function ResetPinDrawer({ cajera, onClose }: { cajera: Personal; onClose: () => void }) {
  const resetear = useResetPinCajera();
  const [pin, setPin] = useState("");
  const pinOk = /^\d{6}$/.test(pin);

  function guardar() {
    resetear.mutate(
      { id: cajera.id, pin },
      {
        onSuccess: () => {
          toast.success(`PIN nuevo guardado para ${cajera.nombre}`);
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
      title="Nuevo PIN"
      descripcion={`Dile a ${cajera.nombre} su PIN nuevo para que entre a caja.`}
      pie={
        <Button size="lg" fullWidth disabled={!pinOk} loading={resetear.isPending} onClick={guardar}>
          Guardar PIN
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (pinOk) guardar();
        }}
      >
        <Input
          label="PIN nuevo (6 dígitos)"
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          autoFocus
          error={pin && !pinOk ? "Debe ser de 6 dígitos" : undefined}
        />
        <button type="submit" hidden aria-hidden />
      </form>
    </Drawer>
  );
}
