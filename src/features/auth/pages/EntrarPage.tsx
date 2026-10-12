import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound, Mail } from "lucide-react";
import type { Clienta } from "@/types/api";
import { Button, Input, PinPad } from "@/components/ui";
import { BotonInstalar } from "@/components/organisms/BotonInstalar";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { useSesion } from "../sesion";
import { useConfirmarRecuperacion, useRegistrar, useSolicitarRecuperacion } from "../hooks";
import { usandoApi, existeTelefono, loginUnificado } from "@/api/authSelector";
import { nombreConocido, recordarNombre } from "../conocidas";

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
 * Campo de teléfono con la lada +52 fija a la izquierda (no editable ni seleccionable), al estilo de
 * un prefijo pegado. El usuario solo escribe los 10 dígitos; +52 es parte visual del campo.
 */
function CampoTelefono({
  value,
  onChange,
  hint,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <Input
      label="Teléfono"
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      value={value}
      onChange={(e) => onChange(formatTelefonoInput(e.target.value))}
      maxLength={12}
      placeholder="777 123 4567"
      hint={hint}
      error={error}
      autoFocus={autoFocus}
      className="pl-[4.25rem]"
      icono={
        <span className="flex select-none items-center gap-2 text-body-lg text-on-surface" aria-hidden>
          <span className="font-medium">+52</span>
          <span className="h-5 w-px bg-outline-variant" />
        </span>
      }
    />
  );
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
  const { entrarComoClienta, entrarStaff } = useSesion();

  const registro = useRegistrar();
  const solicitar = useSolicitarRecuperacion();
  const confirmar = useConfirmarRecuperacion();

  const [fase, setFase] = useState<Fase>("login");
  /** Sub-paso del login: primero teléfono, luego el keypad del PIN. */
  const [pasoPin, setPasoPin] = useState(false);
  /** Nombre para saludar en el paso del PIN (solo si ya entró en este dispositivo). */
  const [saludoNombre, setSaludoNombre] = useState<string | null>(null);
  /** El teléfono no tiene cuenta: no avanzamos, invitamos a registrarse. */
  const [noExiste, setNoExiste] = useState(false);
  /** Consultando al servidor si el teléfono existe (spinner del botón Continuar). */
  const [verificando, setVerificando] = useState(false);
  /** Enviando el login (del keypad del PIN). */
  const [entrando, setEntrando] = useState(false);
  /** Sub-paso del registro: primero los datos, luego el keypad para crear el PIN. */
  const [pasoPinReg, setPasoPinReg] = useState(false);

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
    recordarNombre(c.telefono, c.nombre); // para saludarla por nombre la próxima vez en este equipo
    entrarComoClienta(c);
    toast.success(mensaje);
    navigate(destino, { replace: true });
  }
  /**
   * Al tocar Continuar: verifica si el teléfono tiene cuenta.
   * - No existe → no avanza; invita a crear cuenta.
   * - Existe → avanza al PIN; si ya entró en este dispositivo, lo saluda por su nombre.
   */
  async function continuarLogin() {
    if (digitos !== 10 || verificando) return;
    setNoExiste(false);
    setVerificando(true);
    let existe = false;
    try {
      existe = await existeTelefono(tel);
    } catch {
      // Si la verificación falla (red), dejamos pasar al PIN: el login dará el veredicto real.
      existe = true;
    }
    setVerificando(false);

    if (!existe) {
      setNoExiste(true);
      return;
    }
    setPin("");
    setSaludoNombre(nombreConocido(tel)); // nombre solo si ya entró aquí antes
    setPasoPin(true);
  }


  async function entrar(pinValor: string = pin) {
    setEntrando(true);
    try {
      const s = await loginUnificado(tel, pinValor);
      recordarNombre(tel, s.nombre); // saludo por nombre la próxima vez en este equipo
      if (s.rol === "duena" || s.rol === "cajera") {
        entrarStaff({ rol: s.rol, nombre: s.nombre, clientaId: s.clientaId, sucursal: s.sucursal });
        toast.success(`¡Hola, ${s.nombre.split(" ")[0]}!`);
        navigate(s.rol === "duena" ? "/app" : "/caja", { replace: true });
      } else {
        entrarComoClienta({ id: s.clientaId, nombre: s.nombre });
        toast.success(`¡Hola, ${s.nombre.split(" ")[0]}!`);
        navigate(destino, { replace: true });
      }
    } catch (e) {
      toast.error(mensajeError(e));
      setPin(""); // vacía el keypad para reintentar
    } finally {
      setEntrando(false);
    }
  }

  function registrar(pinValor: string = pin) {
    registro.mutate(
      { nombre, apellidos, telefono: tel, email: email.trim(), pin: pinValor },
      {
        onSuccess: (c) => terminar(c, `¡Bienvenida, ${c.nombre}!`),
        onError: (e) => {
          toast.error(mensajeError(e));
          setPin(""); // vacía el keypad para reintentar
        },
      },
    );
  }

  function pedirEnlace() {
    solicitar.mutate(email.trim(), {
      onSuccess: ({ token }) => {
        if (usandoApi) {
          // Con backend real: el código llega por correo; pasamos a pegarlo (no lo revelamos aquí).
          setTokenRec("");
          setFase("recuperar-pin");
          toast.success("Si ese correo tiene cuenta, te enviamos un código para restablecer tu PIN.");
        } else if (token) {
          // Mock: mostramos el enlace/código en pantalla.
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

  const datosRegValidos = nombre.trim().length >= 2 && digitos === 10 && EMAIL_RE.test(email.trim());

  /** Cambia de fase reseteando los sub-pasos del keypad para no quedar atascado. */
  function cambiarFase(f: Fase) {
    setFase(f);
    setPasoPin(false);
    setPasoPinReg(false);
    setPin("");
    setNoExiste(false);
    setSaludoNombre(null);
    setVerificando(false);
  }

  return (
    <main className="lunares relative flex min-h-dvh flex-col bg-surface px-5 pb-8 pt-5">
      {/* Velo cálido: la crema se intensifica abajo para asentar la tarjeta. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface to-transparent"
      />

      <div className="relative flex w-full max-w-sm flex-1 flex-col self-center">
        <header className="flex items-center justify-between gap-2">
          <BotonInstalar compacto />
        </header>

        {/* Marca del tenant (white-label): nombre de la boutique, sin logo de Domna. */}
        <div className="anim-sube mt-7">
          <p className="font-marca text-[32px] leading-none text-on-surface">Jesly Boutique</p>
          <h1 className="mt-6 whitespace-pre-line font-marca text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-on-surface">
            {fase === "login" && !pasoPin && "Qué gusto\nverte de nuevo."}
            {fase === "login" && pasoPin && (saludoNombre ? `Hola,\n${saludoNombre} 👋` : "Escribe\ntu PIN.")}
            {fase === "registro" && !pasoPinReg && "Crea tu\ncuenta."}
            {fase === "registro" && pasoPinReg && "Elige\ntu PIN."}
            {fase === "recuperar" && "Recupera\ntu PIN."}
            {fase === "recuperar-pin" && "Elige un\nPIN nuevo."}
          </h1>
          <p className="mt-2 max-w-[22rem] text-body-md text-on-surface-variant">
            {fase === "login" && !pasoPin && "Primero tu teléfono. Luego tu PIN de 6 dígitos."}
            {fase === "login" && pasoPin && (
              <>
                Entrando como{" "}
                <button
                  type="button"
                  onClick={() => {
                    setPasoPin(false);
                    setPin("");
                    setSaludoNombre(null);
                  }}
                  className="font-semibold text-primary-strong hover:underline"
                >
                  {tel}
                </button>
                . Toca para cambiar.
              </>
            )}
            {fase === "registro" && !pasoPinReg && "Unos datos y listo: podrás apartar y seguir tus pedidos."}
            {fase === "registro" && pasoPinReg && "Un PIN de 6 dígitos para entrar rápido la próxima vez."}
            {fase === "recuperar" && "Te mandamos un enlace a tu correo para crear uno nuevo."}
            {fase === "recuperar-pin" && "Último paso para volver a entrar a tu cuenta."}
          </p>
        </div>

        {/* ── LOGIN: dos pasos, sin tarjeta. Teléfono → keypad del PIN. ── */}
        {fase === "login" && !pasoPin && (
          <form
            className="anim-sube mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              continuarLogin();
            }}
          >
            <CampoTelefono
              value={tel}
              onChange={(v) => {
                setTel(v);
                if (noExiste) setNoExiste(false);
              }}
              hint="Escribe tus 10 dígitos."
              error={noExiste ? "No encontramos una cuenta con ese número." : undefined}
              autoFocus
            />
            {noExiste ? (
              <div className="rounded-2xl bg-primary-soft p-4 text-center">
                <p className="text-body-md text-primary-on-soft">
                  Parece que es tu primera vez. Crea tu cuenta en un minuto.
                </p>
                <Button type="button" size="lg" fullWidth className="mt-3" onClick={() => cambiarFase("registro")}>
                  Crear mi cuenta
                </Button>
              </div>
            ) : (
              <Button type="submit" size="lg" fullWidth disabled={digitos !== 10} loading={verificando}>
                Continuar
              </Button>
            )}
            {!noExiste && (
              <p className="mt-1 text-center text-body-sm text-on-surface-variant">
                ¿Primera vez?{" "}
                <button type="button" onClick={() => cambiarFase("registro")} className="font-semibold text-primary-strong hover:underline">
                  Crea tu cuenta
                </button>
              </p>
            )}
          </form>
        )}

        {fase === "login" && pasoPin && (
          <div className="anim-sube mt-8 flex flex-col items-center gap-6">
            <PinPad
              value={pin}
              onChange={setPin}
              onComplete={(p) => entrar(p)}
            />
            {entrando && <p className="text-body-sm text-on-surface-variant">Entrando…</p>}
            <button
              type="button"
              onClick={() => cambiarFase("recuperar")}
              className="text-label-md text-primary-on-soft/80 transition-colors hover:text-primary-strong"
            >
              Olvidé mi PIN
            </button>
          </div>
        )}

        {/* ── REGISTRO: dos pasos, sin tarjeta. Datos → keypad para crear el PIN. ── */}
        {fase === "registro" && !pasoPinReg && (
          <form
            className="anim-sube mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (datosRegValidos) {
                setPin("");
                setPasoPinReg(true);
              }
            }}
          >
            <div className="flex gap-2">
              <Input label="Nombre(s)" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" autoFocus />
              <Input label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} autoComplete="family-name" />
            </div>
            <CampoTelefono
              value={tel}
              onChange={setTel}
              hint="Será tu usuario."
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
            <div className="mt-1 flex gap-2">
              <Button variant="ghost" onClick={() => cambiarFase("login")}>
                Atrás
              </Button>
              <Button type="submit" fullWidth disabled={!datosRegValidos}>
                Continuar
              </Button>
            </div>
          </form>
        )}

        {fase === "registro" && pasoPinReg && (
          <div className="anim-sube mt-8 flex flex-col items-center gap-6">
            <PinPad value={pin} onChange={setPin} error={registro.isError} onComplete={(p) => registrar(p)} />
            {registro.isPending && <p className="text-body-sm text-on-surface-variant">Creando tu cuenta…</p>}
            <button
              type="button"
              onClick={() => {
                setPasoPinReg(false);
                setPin("");
              }}
              className="text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
            >
              ← Volver a mis datos
            </button>
          </div>
        )}

        {/* ── RECUPERACIÓN: formularios en tarjeta ── */}
        {(fase === "recuperar" || fase === "recuperar-pin") && (
        <section className="anim-sube mt-7 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-lift">
          {fase === "recuperar" && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (EMAIL_RE.test(email.trim())) pedirEnlace();
              }}
            >
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
                <Button variant="ghost" onClick={() => cambiarFase("login")}>
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
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (pinNuevo.length === 6) fijarPin();
              }}
            >
              {usandoApi ? (
                <p className="rounded-xl bg-primary-soft px-3 py-2 text-body-sm text-primary-on-soft">
                  Te enviamos un código a tu correo. Pégalo aquí y elige tu PIN nuevo.
                </p>
              ) : (
                <p className="rounded-xl bg-primary-soft px-3 py-2 text-body-sm text-primary-on-soft">
                  Tu enlace es <code className="font-medium">{tokenRec}</code>. En la app real llega a tu correo.
                </p>
              )}
              {usandoApi && (
                <Input
                  label="Código de recuperación"
                  value={tokenRec}
                  onChange={(e) => setTokenRec(e.target.value)}
                  placeholder="rec-..."
                  autoFocus
                />
              )}
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
                autoFocus={!usandoApi}
              />
              <Button type="submit" size="lg" fullWidth disabled={pinNuevo.length !== 6 || !tokenRec.trim()} loading={confirmar.isPending}>
                Guardar y entrar
              </Button>
            </form>
          )}
        </section>
        )}

        {fase === "login" && !pasoPin && (
          <Link
            to="/tienda"
            className="anim-sube mt-4 text-center text-label-lg text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Solo quiero ver el catálogo →
          </Link>
        )}

        <div className="mt-auto pt-8 text-center">
          <p className="text-body-sm text-on-surface-variant">
            Al continuar aceptas el aviso de privacidad de Jesly Boutique.
          </p>
        </div>
      </div>
    </main>
  );
}
