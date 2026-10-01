import { Domi } from "@/components/ilustraciones/Domi";

/** Carga de ruta (lazy): Domi SVG animada (respira y parpadea). */
export function PantallaCarga() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-label="Cargando">
      <Domi size={72} expresion="feliz" />
    </div>
  );
}
