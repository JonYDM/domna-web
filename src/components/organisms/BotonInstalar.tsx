import { useState } from "react";
import { Download, Plus, Share } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useInstalarPwa } from "@/lib/useInstalarPwa";

/**
 * Botón "Instalar app". En Android/escritorio lanza el instalador nativo (beforeinstallprompt).
 * En iPhone/iPad abre un instructivo (Compartir → Agregar a inicio), porque iOS no permite
 * instalar por código. Se oculta si la app ya corre instalada (standalone).
 */
export function BotonInstalar({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const { puedeInstalar, esIOS, instalar } = useInstalarPwa();
  const [instructivo, setInstructivo] = useState(false);

  if (!puedeInstalar) return null;

  async function onClick() {
    if (esIOS) {
      setInstructivo(true);
      return;
    }
    const ok = await instalar();
    if (ok) toast.success("¡Listo! Jesly Boutique quedó en tu pantalla de inicio.");
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Instalar la app de Jesly Boutique"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 text-label-md text-on-surface transition-colors hover:bg-surface-container",
          compacto ? "h-9" : "h-10",
          className,
        )}
      >
        <Download className="h-4 w-4 text-primary" aria-hidden />
        {compacto ? "Instalar" : "Instalar app"}
      </button>

      <Drawer
        open={instructivo}
        onClose={() => setInstructivo(false)}
        title="Instala Jesly Boutique en tu iPhone"
        descripcion="Para abrirla como app, en dos pasos desde Safari:"
      >
        <ol className="flex flex-col gap-3">
          <li className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-on-soft">1</span>
            <span className="flex-1 text-body-md">
              Toca el botón <strong>Compartir</strong>{" "}
              <Share className="inline h-4 w-4 align-text-bottom text-primary" aria-hidden /> en la barra de Safari
              (abajo).
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-on-soft">2</span>
            <span className="flex-1 text-body-md">
              Elige <strong>Agregar a inicio</strong>{" "}
              <Plus className="inline h-4 w-4 align-text-bottom text-primary" aria-hidden /> y confirma. ¡Listo!
            </span>
          </li>
        </ol>
        <p className="mt-4 rounded-xl bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
          Así Jesly Boutique se abre a pantalla completa, como una app, y guarda tus pedidos.
        </p>
        <Button className="mt-4" size="lg" fullWidth onClick={() => setInstructivo(false)}>
          Entendido
        </Button>
      </Drawer>
    </>
  );
}
