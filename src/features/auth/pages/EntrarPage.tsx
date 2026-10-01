import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, MessageCircle, Phone } from "lucide-react";
import type { Clienta, CuentaGoogle } from "@/types/api";
import { DomiImagen } from "@/components/ilustraciones/DomiImagen";
import { GoogleLogo } from "@/components/ilustraciones/GoogleLogo";
import { Logo } from "@/components/ilustraciones/Logo";
import { Button, Input } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { useSesion } from "../sesion";
import { useEntrarConGoogle, useEntrarConTelefono, useGuardarTelefono } from "../hooks";
import { SelectorCuentaGoogle } from "../components/SelectorCuentaGoogle";

type Fase = "inicio" | "telefono" | "whatsapp";

/** Solo rutas internas de la tienda (evita redirecciones abiertas con ?volver=). */
function destinoSeguro(v: string | null): string {
  return v && v.startsWith("/tienda") ? v : "/tienda";
}

/**
 * Entrar como clienta: "Continuar con Google" (1 toque) o con teléfono. A quien es nueva se le pide
 * su WhatsApp una sola vez; si la tienda ya la tenía registrada con ese número, las cuentas se enlazan.
 */
export default function EntrarPage() {
  const [params] = useSearchParams();
  const destino = destinoSeguro(params.get("volver"));
  const navigate = useNavigate();
  const { entrarComoClienta } = useSesion();
  const google = useEntrarConGoogle();
  const telefonoLogin = useEntrarConTelefono();
  const guardarTel = useGuardarTelefono();

  const [fase, setFase] = useState<Fase>("inicio");
  const [selector, setSelector] = useState(false);
  const [pendiente, setPendiente] = useState<Clienta | null>(null);
  const [tel, setTel] = useState("");

  function terminar(c: Clienta, mensaje: string) {
    entrarComoClienta(c);
    toast.success(mensaje);
    navigate(destino, { replace: true });
  }

  function elegirCuenta(cuenta: CuentaGoogle) {
    google.mutate(cuenta, {
      onSuccess: ({ clienta, nueva }) => {
        setSelector(false);
        if (nueva) {
          setPendiente(clienta);
          setFase("whatsapp");
        } else terminar(clienta, `¡Hola de nuevo, ${clienta.nombre.split(" ")[0]}!`);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  function guardarWhatsapp() {
    if (!pendiente) return;
    guardarTel.mutate(
      { clientaId: pendiente.id, telefono: tel },
      {
        onSuccess: ({ clienta, enlazada }) =>
          terminar(
            clienta,
            enlazada
              ? "¡Listo! Ligamos tu cuenta con tu registro de la tienda."
              : `¡Bienvenida, ${clienta.nombre.split(" ")[0]}!`,
          ),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  function entrarTelefono() {
    telefonoLogin.mutate(tel, {
      onSuccess: (c) => terminar(c, `¡Hola, ${c.nombre.split(" ")[0]}!`),
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  const digitos = tel.replace(/\D/g, "").length;

  return (
    <main className="lunares flex min-h-dvh flex-col items-center bg-surface px-5 py-6">
      <div className="flex w-full max-w-sm flex-1 flex-col">
        <Link
          to="/"
          className="-ml-2 inline-flex h-10 w-fit items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Inicio
        </Link>

        <div className="anim-sube mt-6 flex flex-col items-center text-center">
          <DomiImagen ancho={132} prioridad animar alt="Domi, la catarina de Domna" />
          <Logo className="mt-4 text-[40px]" />
        </div>

        <section className="mt-8 rounded-3xl bg-surface-container-lowest p-5 shadow-soft">
          {fase === "inicio" && (
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <h1 className="font-marca text-headline-md">Entra para comprar y apartar</h1>
                <p className="mt-1 text-body-md text-on-surface-variant">Sin contraseñas, en un toque.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelector(true)}
                className="mt-2 inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-body-lg font-semibold text-on-surface shadow-xs transition hover:bg-surface-container-low active:scale-[0.98]"
              >
                <GoogleLogo className="h-5 w-5" />
                Continuar con Google
              </button>
              <Button size="lg" variant="soft" fullWidth onClick={() => setFase("telefono")}>
                <Phone className="h-5 w-5" aria-hidden />
                Entrar con mi teléfono
              </Button>
              <Link to="/tienda" className="mt-1 text-center text-label-lg text-primary-strong hover:underline">
                Solo quiero ver el catálogo
              </Link>
            </div>
          )}

          {fase === "telefono" && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (digitos >= 10) entrarTelefono();
              }}
            >
              <h1 className="font-marca text-headline-md">Entra con tu teléfono</h1>
              <Input
                label="Teléfono (10 dígitos)"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={tel}
                onChange={(e) => setTel(formatTelefonoInput(e.target.value))}
                maxLength={12}
                placeholder="777 123 4567"
                hint="Prueba con 777 123 4567 (María) o 777 345 6789 (Sofía, registrada en la tienda)."
                autoFocus
              />
              <p className="text-body-sm text-on-surface-variant">
                En la app real te llegará un código por SMS para confirmar que es tu número.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setFase("inicio")}>
                  Atrás
                </Button>
                <Button type="submit" fullWidth disabled={digitos < 10} loading={telefonoLogin.isPending}>
                  Entrar
                </Button>
              </div>
            </form>
          )}

          {fase === "whatsapp" && pendiente && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (digitos >= 10) guardarWhatsapp();
              }}
            >
              <h1 className="font-marca text-headline-md">Un último dato, {pendiente.nombre.split(" ")[0]}</h1>
              <p className="text-body-md text-on-surface-variant">
                Tu WhatsApp es para avisarte cuando tu prenda esté lista y para tus apartados. Solo te lo pedimos una vez.
              </p>
              <Input
                label="WhatsApp (10 dígitos)"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={tel}
                onChange={(e) => setTel(formatTelefonoInput(e.target.value))}
                maxLength={12}
                placeholder="777 123 4567"
                icono={<MessageCircle className="h-5 w-5" />}
                hint="Si ya compraste en la tienda, usa el mismo número y ligamos tu historial. Prueba: 777 111 2233."
                autoFocus
              />
              <Button type="submit" size="lg" fullWidth disabled={digitos < 10} loading={guardarTel.isPending}>
                Guardar y entrar
              </Button>
            </form>
          )}
        </section>

        <p className="mt-auto pt-6 text-center text-body-sm text-on-surface-variant">
          Al continuar aceptas el aviso de privacidad de Jesly Boutique.
        </p>
      </div>

      <SelectorCuentaGoogle open={selector} onClose={() => setSelector(false)} onElegir={elegirCuenta} cargando={google.isPending} />
    </main>
  );
}
