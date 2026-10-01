import { useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Power, RotateCcw } from "lucide-react";
import { Domi } from "@/components/ilustraciones/Domi";
import { Button, Interruptor } from "@/components/ui";
import { fechaHoyLarga } from "@/lib/format";
import { offsetDias } from "@/lib/reloj";
import { mensajeError } from "@/lib/errores";
import { useConfig } from "@/features/catalogo/hooks";
import { useControlesDemo, useMetricas } from "../hooks";

/**
 * Controles de la demo (no existen en producción): adelantar el reloj para mostrar
 * vencimientos y penalizaciones, el kill switch del SaaS y reiniciar los datos.
 */
export default function DemoPage() {
  const config = useConfig();
  const metricas = useMetricas();
  const { avanzar, suspender, reiniciar, catalogoPublico } = useControlesDemo();
  const [confirmar, setConfirmar] = useState(false);
  const offset = offsetDias();
  const suspendida = config.data?.suspendida ?? false;

  function adelantar(dias: number) {
    const antes = metricas.data?.apartadosActivos ?? 0;
    avanzar.mutate(dias, {
      onSuccess: async () => {
        const despues = (await metricas.refetch()).data?.apartadosActivos ?? antes;
        const vencieron = antes - despues;
        toast.success(
          vencieron > 0
            ? `+${dias} ${dias === 1 ? "día" : "días"}: ${vencieron} ${vencieron === 1 ? "apartado venció" : "apartados vencieron"} y el stock regresó`
            : `Avanzamos ${dias} ${dias === 1 ? "día" : "días"}`,
        );
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Domi size={56} expresion="guino" />
        <div>
          <h1 className="font-marca text-headline-lg">Controles de la demo</h1>
          <p className="text-body-sm text-on-surface-variant">Para mostrar las reglas sin esperar días reales.</p>
        </div>
      </div>

      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="flex items-center gap-2 text-label-lg">
          <CalendarClock className="h-5 w-5 text-primary" aria-hidden />
          Reloj de la demo
        </h2>
        <p className="mt-1 text-body-md">
          Hoy es <strong>{fechaHoyLarga()}</strong>
          {offset > 0 && <span className="text-on-surface-variant"> (+{offset} días)</span>}
        </p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Al adelantar, los apartados sin pagar a tiempo vencen: la prenda regresa al stock y la clienta queda con un cargo
          de ${config.data?.penalizacion ?? 30} para su siguiente apartado.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 3, 15].map((d) => (
            <Button key={d} variant="outline" size="sm" loading={avanzar.isPending && avanzar.variables === d} onClick={() => adelantar(d)}>
              +{d} {d === 1 ? "día" : "días"}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <Interruptor
          checked={config.data?.catalogoPublico ?? true}
          disabled={catalogoPublico.isPending}
          onChange={(v) =>
            catalogoPublico.mutate(v, {
              onSuccess: () => toast.success(v ? "Catálogo visible para todas" : "Solo clientas con cuenta ven la tienda"),
            })
          }
          label="Catálogo visible sin cuenta"
          descripcion={
            config.data?.catalogoPublico ?? true
              ? "Cualquiera ve prendas y precios (ideal para el link de Instagram). La cuenta se pide al comprar o apartar."
              : "Privado: para ver prendas y precios hay que entrar con Google o teléfono."
          }
        />
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="flex items-center gap-2 text-label-lg">
          <Power className="h-5 w-5 text-primary" aria-hidden />
          Suscripción de la boutique (SaaS)
        </h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Si la boutique no paga la renta, el SuperAdmin la pone en pausa y la tienda deja de mostrarse a las clientas.
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant={suspendida ? "primary" : "warning"}
          loading={suspender.isPending}
          onClick={() =>
            suspender.mutate(!suspendida, {
              onSuccess: () => toast.success(suspendida ? "Tienda reactivada" : "Tienda en pausa"),
            })
          }
        >
          {suspendida ? "Reactivar tienda" : "Poner tienda en pausa"}
        </Button>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
        <h2 className="flex items-center gap-2 text-label-lg">
          <RotateCcw className="h-5 w-5 text-primary" aria-hidden />
          Reiniciar la demo
        </h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">Regresa los datos de ejemplo y el reloj a hoy.</p>
        {confirmar ? (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirmar(false)}>
              No
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={reiniciar.isPending}
              onClick={() =>
                reiniciar.mutate(undefined, {
                  onSuccess: () => {
                    setConfirmar(false);
                    toast.success("Demo reiniciada");
                  },
                })
              }
            >
              Sí, reiniciar
            </Button>
          </div>
        ) : (
          <Button className="mt-3" size="sm" variant="outline" onClick={() => setConfirmar(true)}>
            Reiniciar datos
          </Button>
        )}
      </section>

      <section className="rounded-2xl bg-primary-soft p-4">
        <h2 className="text-label-lg text-primary-on-soft">Guion sugerido</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-body-sm text-on-surface">
          <li>Como clienta: filtra Vestidos talla M y abre uno.</li>
          <li>Cambia el color (cambia la imagen) y mira las tallas agotadas.</li>
          <li>Aparta con 50% en La Azteca → folio y “¡Apartado listo!”.</li>
          <li>Como dueña: registra un abono y liquida.</li>
          <li>Aquí: +3 días → vencen apartados y regresa el stock.</li>
          <li>Pon la tienda en pausa y abre la tienda.</li>
        </ol>
      </section>
    </div>
  );
}
