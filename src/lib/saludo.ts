import { ahora } from "./reloj";

/** Saludo según la hora local: "Buenos días", "Buenas tardes", "Buenas noches". */
export function saludo(): string {
  const h = ahora().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}
