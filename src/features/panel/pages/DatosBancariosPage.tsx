import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Info } from "lucide-react";
import { Button, Input, Skeleton } from "@/components/ui";
import { EmptyState } from "@/components/molecules/EmptyState";
import { mensajeError } from "@/lib/errores";
import { useDatosBancarios, useGuardarDatosBancarios } from "@/features/apartados/hooks";

/** La dueña captura la cuenta donde recibe transferencias. La ven las clientas que eligen pagar así. */
export default function DatosBancariosPage() {
  const datos = useDatosBancarios();
  const guardar = useGuardarDatosBancarios();
  const [titular, setTitular] = useState("");
  const [banco, setBanco] = useState("");
  const [clabe, setClabe] = useState("");
  const [cargado, setCargado] = useState(false);

  // Rellena el formulario una sola vez con lo que ya hay guardado.
  useEffect(() => {
    if (datos.data && !cargado) {
      setTitular(datos.data.titular);
      setBanco(datos.data.banco);
      setClabe(datos.data.clabe);
      setCargado(true);
    }
  }, [datos.data, cargado]);

  const vacio = !titular.trim() && !banco.trim() && !clabe;
  const sinCambios =
    !!datos.data && titular.trim() === datos.data.titular && banco.trim() === datos.data.banco && clabe === datos.data.clabe;

  function enviar(e: FormEvent) {
    e.preventDefault();
    guardar.mutate(
      { titular, banco, clabe },
      {
        onSuccess: (d) => toast.success(d.configurados ? "Datos guardados" : "Datos borrados"),
        onError: (err) => toast.error(mensajeError(err)),
      },
    );
  }

  if (datos.isPending) return <Skeleton className="mx-auto h-72 w-full max-w-lg rounded-2xl" />;
  if (datos.isError) {
    return (
      <EmptyState
        expresion="triste"
        titulo="No pudimos cargar tus datos"
        texto={mensajeError(datos.error)}
        accion={<Button onClick={() => datos.refetch()}>Reintentar</Button>}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <header>
        <h1 className="font-marca text-headline-lg">Cuenta para transferencias</h1>
        <p className="text-body-md text-on-surface-variant">
          Es lo que ven tus clientas cuando eligen pagar por transferencia. Pueden copiar cada dato.
        </p>
      </header>

      <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <Input label="Titular de la cuenta" value={titular} onChange={(e) => setTitular(e.target.value)} autoComplete="off" maxLength={80} />
        <Input label="Banco" value={banco} onChange={(e) => setBanco(e.target.value)} autoComplete="off" maxLength={40} />
        <Input
          label="CLABE interbancaria"
          inputMode="numeric"
          autoComplete="off"
          value={clabe}
          onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
          hint={`${clabe.length}/18 dígitos`}
        />
        <Button type="submit" size="lg" loading={guardar.isPending} disabled={sinCambios}>
          {vacio && datos.data?.configurados ? "Borrar datos" : "Guardar"}
        </Button>
      </form>

      <p className="flex items-start gap-2 rounded-xl bg-info-container px-3 py-2.5 text-body-sm text-info">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Revisamos que la CLABE sea válida (18 dígitos y su dígito verificador). Solo quienes tienen sesión ven estos datos.
      </p>
    </div>
  );
}
