/**
 * ¿La app corre instalada (pantalla de inicio / modo standalone) y no en una pestaña del navegador?
 * Android y escritorio lo dicen con `display-mode: standalone`; iPhone con `navigator.standalone`.
 *
 * Importa porque en un teléfono el navegador y la app instalada NO comparten sesión: el servidor
 * necesita saber cuál es cuál para decir "iPhone · App instalada" y no "iPhone · Safari" dos veces.
 */
export interface EntornoApp {
  matchMedia?: (consulta: string) => { matches: boolean };
  /** `standalone` solo existe en el Safari de iPhone, por eso se lee con cuidado. */
  navigator?: object;
}

export function detectarAppInstalada(entorno: EntornoApp | undefined = typeof window === "undefined" ? undefined : window): boolean {
  if (!entorno) return false;
  try {
    if (entorno.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch {
    // matchMedia no disponible o consulta rechazada: se intenta lo de iPhone
  }
  return (entorno.navigator as { standalone?: unknown } | undefined)?.standalone === true;
}

/** Nombre y valor de la cabecera con la que el front avisa que corre como app instalada. */
export const CABECERA_MODO_APP = "X-Modo-App";
export const VALOR_APP_INSTALADA = "instalada";
