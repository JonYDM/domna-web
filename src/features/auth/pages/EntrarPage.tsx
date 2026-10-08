import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, KeyRound, Mail } from "lucide-react";
import type { Clienta } from "@/types/api";
import { DomiImagen } from "@/components/ilustraciones/DomiImagen";
import { Logo } from "@/components/ilustraciones/Logo";
import { Button, Input } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { useSesion } from "../sesion";
import { useConfirmarRecuperacion, useLoginConPin, useRegistrar, useSolicitarRecuperacion } from "../hooks";
import { BotonPresentacion } from "@/features/presentacion/BotonPresentacion";

type Fase = "login" | "registro" | "recuperar" | "recuperar-pin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solo rutas internas de la tienda (evita redirecciones abiertas con ?volver=). */
function destinoSeguro(v: string | null): string {
  return v && v.startsWith("/tienda") ? v : "/tienda";
}

/** Solo dígitos, máximo 6 (para el PIN). */
function soloPin(v: string): string {
  return v.replace(/\D/g, "").slice(0, 6);
}

/**
 * Acceso de la clienta con cuenta propia de Domna:
 * - Iniciar sesión con teléfono + PIN de 6 dígitos.
 * - Registrarse (nombre, apellidos, teléfono +52, correo y PIN).
 * - Recuperar el PIN por correo (en la demo el enlace se muestra en pantalla).
 */
export default function EntrarPage() {
  const [params] = useSearchParams();
  const destino = destinoSeguro(params.get("volver"));
  const navigate = useNavigate();
  const { entrarComoClienta } = useSesion();

  const login = useLoginConPin();
  const registro = useRegistrar();
  const solicitar = useSolicitarRecuperacion();
  const confirmar = useConfirmarRecuperacion();

  const [fase, setFase] = useState<Fase>("login");

  // Campos compartidos / de cada formulario.
  const [tel, setTel] = useState("");
  const [pin, setPin] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [tokenRec, setTokenRec] = useState("");
  const [pinNuevo, setPinNuevo] = useState("");

  const digitos = tel.replace(/\D/g, "").length;

  function terminar(c: Clienta, mensaje: string) {
    entrarComoClienta(c);
    toast.success(mensaje);
    navigate(destino, { replace: true });
  }

  function entrar() {
    login.mutate(
      { telefono: tel, pin },
      {
        onSuccess: (c) => terminar(c, `¡Hola, ${c.nombre}!`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  function registrar() {
    registro.mutate(
      { nombre, apellidos, telefono: tel, email: email.trim(), pin },
      {
        onSuccess: (c) => terminar(c, `¡Bienvenida, ${c.nombre}!`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  function pedirEnlace() {
    solicitar.mutate(email.trim(), {
      onSuccess: ({ token }) => {
        // En la demo mostramos el enlace/código (en producción llega por correo).
        if (token) {
          setTokenRec(token);
          setFase("recuperar-pin");
          toast.success("Te enviamos un enlace a tu correo (demo: ya lo cargamos).");
        } else {
          toast.success("Si ese correo tiene cuenta, te enviamos un enlace para restablecer tu PIN.");
        }
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  }

  function fijarPin() {
    confirmar.mutate(
      { token: tokenRec, pin: pinNuevo },
      {
        onSuccess: (c) => terminar(c, "¡Listo! Tu PIN quedó actualizado."),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  }

  const loginValido = digitos === 10 && pin.length === 6;
  const registroValido =
    nombre.trim().length >= 2 && digitos === 10 && EMAIL_RE.test(email.trim()) && pin.length === 6;

  return (
    <main className="lunares flex min-h-dvh flex-col items-center bg-surface px-5 py-6">
      <div className="flex w-full max-w-sm flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="-ml-2 inline-flex h-10 w-fit items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Inicio
          </Link>
          <BotonPresentacion />
        </div>

        <div className="anim-sube mt-6 flex flex-col items-center text-center">
          <DomiImagen ancho={132} prioridad animar alt="Domi, la catarina de Domna" />
          <Logo className="mt-4 text-[40px]" />
        </div>

        <section className="mt-8 rounded-3xl bg-surface-container-lowest p-5 shadow-soft">
          {fase === "login" && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (loginValido) entrar();
              }}
            >
              <div className="text-center">
                <h1 className="font-marca text-headline-md">Entra a tu cuenta</h1>
                <p className="mt-1 text-body-md text-on-surface-variant">Con tu teléfono y tu PIN.</p>
              </div>
              <Input
                label="Teléfono (10 dígitos)"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={tel}
                onChange={(e) => setTel(formatTelefonoInput(e.target.value))}
                maxLength={12}
                placeholder="777 123 4567"
                hint="Prueba con 777 123 4567 y PIN 123456 (María)."
                autoFocus
              />
              <Input
                label="PIN (6 dígitos)"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(soloPin(e.target.value))}
                maxLength={6}
                placeholder="••••••"
                icono={<KeyRound className="h-5 w-5" />}
              />
              <button
                type="button"
                onClick={() => setFase("recuperar")}
                className="w-fit text-label-lg text-primary-strong hover:underline"
              >
                Olvidé mi PIN
              </button>
              <Button type="submit" size="lg" fullWidth disabled={!loginValido} loading={login.isPending}>
                Entrar
              </Button>
              <p className="mt-1 text-center text-body-sm text-on-surface-variant">
                ¿Primera vez?{" "}
                <button type="button" onClick={() => setFase("registro")} className="text-label-lg text-primary-strong hover:underline">
                  Crea tu cuenta
                </button>
              </p>
              <Link to="/tienda" className="mt-1 text-center text-label-lg text-on-surface-variant hover:underline">
                Solo quiero ver el catálogo
              </Link>
            </form>
          )}

          {fase === "registro" && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (registroValido) registrar();
              }}
            >
              <h1 className="font-marca text-headline-md">Crea tu cuenta</h1>
              <div className="flex gap-2">
                <Input label="Nombre(s)" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" autoFocus />
                <Input label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} autoComplete="family-name" />
              </div>
              <Input
                label="Teléfono (10 dígitos)"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={tel}
                onChange={(e) => setTel(formatTelefonoInput(e.target.value))}
                maxLength={12}
                placeholder="777 123 4567"
                hint="Se usa como tu usuario. Lada +52."
                error={tel && digitos !== 10 ? "Debe tener 10 dígitos" : undefined}
              />
              <Input
                label="Correo"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@gmail.com"
                icono={<Mail className="h-5 w-5" />}
                hint="Para recuperar tu PIN si lo olvidas."
                error={email && !EMAIL_RE.test(email.trim()) ? "Correo inválido" : undefined}
              />
              <Input
                label="Crea tu PIN (6 dígitos)"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={pin}
                onChange={(e) => setPin(soloPin(e.target.value))}
                maxLength={6}
                placeholder="••••••"
                icono={<KeyRound className="h-5 w-5" />}
              />
              <div className="mt-1 flex gap-2">
                <Button variant="ghost" onClick={() => setFase("login")}>
                  Atrás
                </Button>
                <Button type="submit" fullWidth disabled={!registroValido} loading={registro.isPending}>
                  Crear cuenta y entrar
                </Button>
              </div>
            </form>
          )}

          {fase === "recuperar" && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (EMAIL_RE.test(email.trim())) pedirEnlace();
              }}
            >
              <h1 className="font-marca text-headline-md">Recupera tu PIN</h1>
              <p className="text-body-md text-on-surface-variant">
                Escribe tu correo y te enviaremos un enlace para crear un PIN nuevo.
              </p>
              <Input
                label="Correo de tu cuenta"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@gmail.com"
                icono={<Mail className="h-5 w-5" />}
                autoFocus
              />
              <div className="mt-1 flex gap-2">
                <Button variant="ghost" onClick={() => setFase("login")}>
                  Atrás
                </Button>
                <Button type="submit" fullWidth disabled={!EMAIL_RE.test(email.trim())} loading={solicitar.isPending}>
                  Enviar enlace
                </Button>
              </div>
            </form>
          )}

          {fase === "recuperar-pin" && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (pinNuevo.length === 6) fijarPin();
              }}
            >
              <h1 className="font-marca text-headline-md">Crea tu PIN nuevo</h1>
              <p className="text-body-sm text-on-surface-variant">
                Demo: tu enlace de recuperación es <code className="rounded bg-surface-container px-1">{tokenRec}</code>.
                En la app real llega a tu correo.
              </p>
              <Input
                label="Nuevo PIN (6 dígitos)"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={pinNuevo}
                onChange={(e) => setPinNuevo(soloPin(e.target.value))}
                maxLength={6}
                placeholder="••••••"
                icono={<KeyRound className="h-5 w-5" />}
                autoFocus
              />
              <Button type="submit" size="lg" fullWidth disabled={pinNuevo.length !== 6} loading={confirmar.isPending}>
                Guardar y entrar
              </Button>
            </form>
          )}
        </section>

        <p className="mt-auto pt-6 text-center text-body-sm text-on-surface-variant">
          Al continuar aceptas el aviso de privacidad de Jesly Boutique.
        </p>
      </div>
    </main>
  );
}
