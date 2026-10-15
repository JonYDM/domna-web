import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useEnLinea } from "@/lib/useEnLinea";

/**
 * Banner discreto de conexión (role=status, aria-live polite):
 * - Sin red: "Sin conexión. Verás lo último que se guardó." (se mantiene mientras no haya red).
 * - Al volver: "De vuelta en línea" por unos segundos y luego desaparece.
 *
 * Flota fijo bajo el encabezado (position fixed) para NO empujar el contenido de la página.
 * El respeto a prefers-reduced-motion viene del CSS global (desactiva transiciones).
 */
export function BannerConexion() {
  const enLinea = useEnLinea();
  const [visible, setVisible] = useState(false);
  const [modo, setModo] = useState<"offline" | "online">("offline");
  const estuvoOffline = useRef(false);

  useEffect(() => {
    if (!enLinea) {
      estuvoOffline.current = true;
      setModo("offline");
      setVisible(true);
      return;
    }
    // Volvió la red: solo avisamos si antes se había caído.
    if (estuvoOffline.current) {
      estuvoOffline.current = false;
      setModo("online");
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2600);
      return () => clearTimeout(t);
    }
  }, [enLinea]);

  const offline = modo === "offline";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-label-md shadow-lift transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        } ${offline ? "bg-tinta text-on-primary" : "bg-success-container text-success"}`}
      >
        {offline ? (
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Wifi className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span>{offline ? "Sin conexión. Verás lo último que se guardó." : "De vuelta en línea"}</span>
      </div>
    </div>
  );
}
