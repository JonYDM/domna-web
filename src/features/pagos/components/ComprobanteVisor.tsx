import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { useVerComprobante } from "@/features/apartados/hooks";

/**
 * Abre el comprobante de una transferencia. Es un documento privado con datos bancarios: pide el
 * PIN de quien lo abre y lo muestra solo mientras dura el enlace (2 min); después se oculta solo.
 */
export function ComprobanteVisor({ apartadoId, abonoId }: { apartadoId: string; abonoId: string }) {
  const ver = useVerComprobante();
  const [pidiendoPin, setPidiendoPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imagen, setImagen] = useState<{ url: string; segundos: number } | null>(null);

  // Cuenta regresiva: al llegar a 0 la imagen desaparece (el enlace ya habría expirado igual).
  useEffect(() => {
    if (!imagen) return;
    if (imagen.segundos <= 0) {
      setImagen(null);
      return;
    }
    const t = window.setTimeout(() => setImagen((i) => (i ? { ...i, segundos: i.segundos - 1 } : i)), 1000);
    return () => window.clearTimeout(t);
  }, [imagen]);

  function abrir(e: FormEvent) {
    e.preventDefault();
    setError(null);
    ver.mutate(
      { apartadoId, abonoId, pin },
      {
        onSuccess: (r) => {
          setPin("");
          setPidiendoPin(false);
          setImagen({ url: r.url, segundos: r.expiraEnSegundos });
        },
        onError: (err) => {
          setPin("");
          setError(mensajeError(err));
        },
      },
    );
  }

  function cerrar() {
    setImagen(null);
    setPidiendoPin(false);
    setPin("");
    setError(null);
  }

  if (imagen) {
    const min = Math.floor(imagen.segundos / 60);
    const seg = String(imagen.segundos % 60).padStart(2, "0");
    return (
      <section aria-label="Comprobante de transferencia" className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
        <div className="max-h-[55vh] overflow-auto rounded-lg bg-surface-container-lowest">
          <img
            src={imagen.url}
            alt="Comprobante de transferencia de la clienta"
            referrerPolicy="no-referrer"
            draggable={false}
            className="mx-auto block h-auto max-w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="tabular text-body-sm text-on-surface-variant" role="timer" aria-live="off">
            Se oculta en {min}:{seg}
          </p>
          <Button variant="ghost" size="sm" onClick={cerrar}>
            <EyeOff className="h-4 w-4" aria-hidden />
            Ocultar
          </Button>
        </div>
      </section>
    );
  }

  if (pidiendoPin) {
    return (
      <form onSubmit={abrir} className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3">
        <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          El comprobante es privado. Escribe tu PIN para abrirlo.
        </p>
        <Input
          label="Tu PIN"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          error={error ?? undefined}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={cerrar} disabled={ver.isPending}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth loading={ver.isPending} disabled={pin.length !== 6}>
            Abrir comprobante
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Button variant="tinta" onClick={() => setPidiendoPin(true)}>
      <Eye className="h-5 w-5" aria-hidden />
      Ver comprobante
    </Button>
  );
}
