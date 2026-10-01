import { useNavigate } from "react-router-dom";
import { ShoppingBag, Store } from "lucide-react";
import { DomiImagen } from "@/components/ilustraciones/DomiImagen";
import { Logo } from "@/components/ilustraciones/Logo";
import { Button, ButtonLink } from "@/components/ui";
import { useSesion } from "../sesion";
import { BotonPresentacion } from "@/features/presentacion/BotonPresentacion";

/** Bienvenida de la demo: entrar como clienta (Google / teléfono) o abrir el panel de la dueña. */
export function BienvenidaPage() {
  const { entrar } = useSesion();
  const navigate = useNavigate();

  return (
    <main className="lunares relative flex min-h-dvh flex-col items-center justify-center bg-surface px-5 pb-10 pt-20">
      <BotonPresentacion className="absolute right-4 top-4" />
      <div className="anim-sube flex w-full max-w-sm flex-col items-center text-center">
        <DomiImagen ancho={196} prioridad animar alt="Domi, la catarina de Domna" />
        <Logo className="mt-6 text-[56px]" conLema />

        <div className="mt-10 w-full rounded-3xl bg-surface-container-lowest p-5 shadow-soft">
          <p className="text-label-sm uppercase text-on-surface-variant">Boutique</p>
          <p className="mt-1 font-marca text-headline-md">Jesly Boutique</p>
          <p className="text-body-sm text-on-surface-variant">Temixco · La Azteca</p>

          <div className="mt-5 flex flex-col gap-2.5">
            <ButtonLink to="/entrar" size="lg" fullWidth>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              Soy clienta
            </ButtonLink>
            <Button
              size="lg"
              variant="tinta"
              fullWidth
              onClick={() => {
                entrar("duena");
                navigate("/app");
              }}
            >
              <Store className="h-5 w-5" aria-hidden />
              Soy la dueña: abrir panel
            </Button>
          </div>
        </div>

        <p className="mt-6 text-body-sm text-on-surface-variant">
          Demo con datos de ejemplo. Puedes cambiar de rol cuando quieras.
        </p>
      </div>
    </main>
  );
}
