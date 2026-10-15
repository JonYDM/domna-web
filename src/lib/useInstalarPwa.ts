import { useEffect, useState } from "react";
import { detectarAppInstalada } from "./modoApp";

/** Evento no estándar de Chromium para instalar la PWA. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** ¿La app ya corre instalada (standalone)? Android/escritorio y iOS (navigator.standalone). */
function esStandalone(): boolean {
  return detectarAppInstalada();
}

/** iOS (iPhone/iPad), donde la instalación es manual (Compartir → Agregar a inicio). */
function esIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1; // iPad se reporta como Mac
  return /iphone|ipad|ipod/i.test(ua) || iPadOS;
}

export interface EstadoInstalarPwa {
  /** Mostrar el botón de instalar (no instalada y hay forma de hacerlo). */
  puedeInstalar: boolean;
  /** En iOS hay que mostrar instructivo en vez de lanzar un prompt. */
  esIOS: boolean;
  /** Ya está instalada / corriendo en modo app. */
  instalada: boolean;
  /** Lanza el instalador nativo (Android/escritorio). Devuelve true si la instaló. */
  instalar: () => Promise<boolean>;
}

/**
 * Estado de instalación de la PWA:
 * - Android/escritorio (Chromium): captura `beforeinstallprompt` y permite lanzar el instalador.
 * - iOS Safari: no hay prompt; se marca `esIOS` para mostrar un instructivo manual.
 * - Si ya está instalada (standalone), `puedeInstalar` es false.
 */
export function useInstalarPwa(): EstadoInstalarPwa {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(esStandalone);
  const ios = esIOS();

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault(); // evita el mini-infobar; usamos nuestro botón
      setPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalada(true);
      setPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function instalar(): Promise<boolean> {
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalada(true);
    setPrompt(null);
    return outcome === "accepted";
  }

  // En iOS se puede instalar manual (si no está ya instalada). En Chromium, solo si hay prompt.
  const puedeInstalar = !instalada && (ios || !!prompt);

  return { puedeInstalar, esIOS: ios, instalada, instalar };
}
