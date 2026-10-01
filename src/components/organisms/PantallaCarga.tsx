import { DomiImagen } from "@/components/ilustraciones/DomiImagen";

/** Carga de ruta (lazy). */
export function PantallaCarga() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-label="Cargando">
      <DomiImagen ancho={88} prioridad animar />
    </div>
  );
}
