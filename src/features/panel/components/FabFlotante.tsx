import { useFab } from "../fab";

/**
 * Botón flotante de "agregar", independiente del Dock (mismo patrón que el carrito de
 * VenderPage): esquina inferior derecha, flotando sobre el contenido y por encima del Dock.
 * Cada pantalla registra su acción con useRegistrarFab; si ninguna la registró, no se muestra.
 */
export function FabFlotante() {
  const fab = useFab();
  if (!fab) return null;
  const Icono = fab.icono;

  return (
    <button
      type="button"
      onClick={fab.onClick}
      aria-label={fab.label}
      className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary-strong text-on-primary shadow-lift transition-all active:scale-95 md:hidden"
    >
      <Icono className="h-6 w-6" aria-hidden />
    </button>
  );
}
