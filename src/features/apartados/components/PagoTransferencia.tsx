import { useRef } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Copy, ImagePlus, Landmark } from "lucide-react";
import type { Apartado } from "@/types/api";
import { Button, Skeleton } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatMXN } from "@/lib/format";
import { useDatosBancarios, useSubirComprobante } from "../hooks";

/** 012180001183597172 → "012 180 00118359717 2" (se lee y se dicta mejor). Se copia sin espacios. */
function formatClabe(c: string): string {
  return c.length === 18 ? `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 17)} ${c.slice(17)}` : c;
}

async function copiar(texto: string, que: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${que} copiado`);
  } catch {
    toast.error("No se pudo copiar. Mantén presionado el texto para copiarlo.");
  }
}

/**
 * Lo que necesita la clienta que pagará por transferencia: los datos de la cuenta (copiables) y
 * dónde adjuntar su comprobante. Aparece mientras el pedido espere ese pago, y desaparece cuando
 * la tienda lo confirma.
 */
export function PagoTransferencia({ apartado: a }: { apartado: Apartado }) {
  const pendiente = a.abonos.find((x) => x.estado === "pendiente" && x.metodo === "transferencia");
  const rechazado = !a.abonos.some((x) => x.estado === "pendiente")
    ? [...a.abonos].reverse().find((x) => x.estado === "rechazado" && x.metodo === "transferencia")
    : undefined;
  const espera = pendiente ?? rechazado;
  const visible = a.estado === "activo" && !!espera;

  const datos = useDatosBancarios(visible);
  const subir = useSubirComprobante(a.id);
  const entrada = useRef<HTMLInputElement>(null);

  if (!visible || !espera) return null;
  const enRevision = !!pendiente?.tieneComprobante;

  function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    subir.mutate(archivo, {
      onSuccess: () => toast.success("Comprobante enviado. La tienda lo revisará."),
      onError: (e) => toast.error(mensajeError(e)),
    });
    if (entrada.current) entrada.current.value = ""; // permite elegir el mismo archivo otra vez
  }

  return (
    <section aria-labelledby="titulo-transferencia" className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
      <h2 id="titulo-transferencia" className="flex items-center gap-2 text-label-lg">
        <Landmark className="h-4 w-4 text-primary" aria-hidden />
        Paga por transferencia
      </h2>

      {datos.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : datos.isError || !datos.data?.configurados ? (
        <p className="rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
          La tienda aún no tiene su cuenta en la app. Pregúntale en tienda con tu folio cómo transferir.
        </p>
      ) : (
        <dl className="flex flex-col divide-y divide-outline-variant/50 rounded-xl bg-surface-container-low px-3">
          <Fila etiqueta="Titular" valor={datos.data.titular} />
          <Fila etiqueta="Banco" valor={datos.data.banco} />
          <Fila etiqueta="CLABE" valor={formatClabe(datos.data.clabe)} copiable={datos.data.clabe} destacar />
          <Fila etiqueta="Monto" valor={formatMXN(espera.monto)} copiable={String(espera.monto)} />
          <Fila etiqueta="Concepto" valor={a.folio} copiable={a.folio} />
        </dl>
      )}

      {rechazado && !pendiente && (
        <p className="rounded-xl bg-error-container px-3 py-2.5 text-body-sm text-error">
          La tienda no pudo confirmar tu pago anterior. Haz tu transferencia y sube un comprobante nuevo.
        </p>
      )}

      {enRevision ? (
        <p className="flex items-start gap-2 rounded-xl bg-success-container px-3 py-2.5 text-body-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>Recibimos tu comprobante.</strong> La tienda lo está revisando; en cuanto lo confirme, verás tu pedido pagado.
          </span>
        </p>
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          Cuando hagas tu transferencia, adjunta una foto o captura del comprobante. Solo la tienda puede verlo.
        </p>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Elegir comprobante"
        onChange={(e) => alElegir(e.target.files?.[0])}
      />
      <Button
        variant={enRevision ? "ghost" : "tinta"}
        size="lg"
        loading={subir.isPending}
        onClick={() => entrada.current?.click()}
      >
        <ImagePlus className="h-5 w-5" aria-hidden />
        {enRevision ? "Cambiar comprobante" : "Adjuntar comprobante"}
      </Button>
    </section>
  );
}

function Fila({ etiqueta, valor, copiable, destacar }: { etiqueta: string; valor: string; copiable?: string; destacar?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-2.5">
      <dt className="w-20 shrink-0 text-body-sm text-on-surface-variant">{etiqueta}</dt>
      <dd className={destacar ? "tabular min-w-0 flex-1 break-all text-label-lg" : "tabular min-w-0 flex-1 break-words text-body-md"}>{valor}</dd>
      {copiable !== undefined && (
        <button
          type="button"
          onClick={() => copiar(copiable, etiqueta)}
          aria-label={`Copiar ${etiqueta.toLowerCase()}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Copy className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
