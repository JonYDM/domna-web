/**
 * Nombres conocidos POR DISPOSITIVO. Tras un login/registro exitoso guardamos el nombre de la
 * clienta ligado a su teléfono, SOLO en este equipo (localStorage). Así, cuando vuelva a entrar
 * desde el mismo dispositivo, podemos saludarla por su nombre sin preguntarle nada al servidor
 * (patrón tipo WhatsApp). No expone datos de nadie: solo recordamos a quien ya inició sesión aquí.
 */

const CLAVE = "domna.conocidas";

/** Normaliza el teléfono a solo dígitos (10) para usarlo como llave estable. */
function llave(telefono: string): string {
  return telefono.replace(/\D/g, "").replace(/^52(?=\d{10}$)/, "");
}

function leerMapa(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Nombre recordado para ese teléfono en este dispositivo, o null si nunca ha entrado aquí. */
export function nombreConocido(telefono: string): string | null {
  const k = llave(telefono);
  if (k.length !== 10) return null;
  return leerMapa()[k] ?? null;
}

/** Recuerda el nombre de pila ligado al teléfono (tras login/registro exitoso). */
export function recordarNombre(telefono: string, nombre: string): void {
  const k = llave(telefono);
  if (k.length !== 10 || !nombre.trim()) return;
  try {
    const mapa = leerMapa();
    mapa[k] = nombre.trim().split(" ")[0]; // solo el primer nombre, para el saludo
    localStorage.setItem(CLAVE, JSON.stringify(mapa));
  } catch {
    // Si localStorage falla (modo privado, etc.), simplemente no recordamos: no es crítico.
  }
}
