import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button, Input, PinPad } from "@/components/ui";
import { mensajeError } from "@/lib/errores";
import { formatTelefonoInput } from "@/lib/format";
import { loginStaff } from "@/api/authSelector";
import { useSesion } from "../sesion";

/**
 * Acceso del equipo (dueña y cajera), separado del acceso público de clientas por seguridad.
 * Login real contra el backend (teléfono + PIN): el rol viene del token/servidor y según él se
 * rutea a /app (dueña) o /caja (cajera). A la dueña la siembra/da de alta el SuperAdmin; a las
 * cajeras, la dueña desde su panel. Aquí no hay registro ni accesos directos.
 */
export function AccesoStaffPage() {
  const navigate = useNavigate();
  const { entrarStaff } = useSesion();

  const [tel, setTel] = useState("");
  const [pin, setPin] = useState("");
  const [pasoPin, setPasoPin] = useState(false);
  const [cargando, setCargando] = useState(false);

  const digitos = tel.replace(/\D/g, "").length;

  async function entrar(pinValor: string) {
    setCargando(true);
    try {
      const s = await loginStaff(tel, pinValor);
      if (s.rol === "clienta") {
        // Una clienta no entra por aquí: la mandamos a su acceso.
        toast.error("Esta cuenta es de clienta. Entra desde el acceso de clientas.");
        setPin("");
        setCargando(false);
        return;
      }
      entrarStaff({ rol: s.rol, nombre: s.nombre, clientaId: s.clientaId, sucursal: s.sucursal });
      toast.success(`¡Hola, ${s.nombre.split(" ")[0]}!`);
      navigate(s.rol === "duena" ? "/app" : "/caja", { replace: true });
    } catch (e) {
      toast.error(mensajeError(e));
      setPin("");
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-surface px-5 pb-8 pt-5">
      <div className="flex w-full max-w-sm flex-1 flex-col self-center">
        <Link
          to="/"
          className="-ml-2 inline-flex h-10 w-fit items-center gap-1 rounded-full pl-1 pr-3 text-label-lg text-on-surface-variant hover:bg-surface-container"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Inicio
        </Link>

        <div className="anim-sube mt-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-tinta text-on-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-5 whitespace-pre-line font-marca text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-on-surface">
            {pasoPin ? "Escribe\ntu PIN." : "Acceso\ndel equipo."}
          </h1>
          <p className="mt-2 max-w-[22rem] text-body-md text-on-surface-variant">
            {pasoPin ? (
              <>
                Entrando como{" "}
                <button
                  type="button"
                  onClick={() => {
                    setPasoPin(false);
                    setPin("");
                  }}
                  className="font-semibold text-primary-strong hover:underline"
                >
                  {tel}
                </button>
                . Toca para cambiar.
              </>
            ) : (
              "Panel de la dueña y caja. Entra con tu teléfono y tu PIN."
            )}
          </p>
        </div>

        {!pasoPin && (
          <form
            className="anim-sube mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (digitos === 10) {
                setPin("");
                setPasoPin(true);
              }
            }}
          >
            <Input
              label="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={tel}
              onChange={(e) => setTel(formatTelefonoInput(e.target.value))}
              maxLength={12}
              placeholder="777 123 4567"
              hint="El que registró la boutique."
              autoFocus
            />
            <Button type="submit" size="lg" fullWidth disabled={digitos !== 10}>
              Continuar
            </Button>
          </form>
        )}

        {pasoPin && (
          <div className="anim-sube mt-8 flex flex-col items-center gap-6">
            <PinPad value={pin} onChange={setPin} onComplete={(p) => entrar(p)} />
            {cargando && <p className="text-body-sm text-on-surface-variant">Entrando…</p>}
          </div>
        )}

        <p className="mt-auto pt-8 text-center text-body-sm text-on-surface-variant">
          Acceso restringido al personal de la boutique.
        </p>
      </div>
    </main>
  );
}
