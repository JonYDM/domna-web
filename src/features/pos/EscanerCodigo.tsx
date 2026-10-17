import { useEffect, useRef, useState } from "react";
import { Camera, Keyboard } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button, Drawer, Input, Segmentos } from "@/components/ui";

/** Formatos de retail (1D) + QR. Restringir acelera y evita falsos positivos. */
const FORMATOS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
];

/** Id estable del contenedor de la cámara (sin ":" que rompe querySelector). */
const REGION_ID = "escaner-camara-region";

type Modo = "camara" | "manual";

/**
 * Escáner de código de barras reutilizable (POS y alta de producto).
 * - Cámara con `html5-qrcode` (iOS Safari + Android, usa getUserMedia; requiere HTTPS y permiso).
 * - Arranque seguro: solo inicia cuando el contenedor ya está en el DOM; los errores NO tumban la app.
 * - Modo manual: escribir el código.
 */
export function EscanerCodigo({
  open,
  onClose,
  onCodigo,
  titulo = "Escanear código",
}: {
  open: boolean;
  onClose: () => void;
  onCodigo: (codigo: string) => void;
  titulo?: string;
}) {
  const [modo, setModo] = useState<Modo>("camara");
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detenerRef = useRef<(() => void) | null>(null);

  // Arranca/detiene la cámara según el modo y si el panel está abierto.
  useEffect(() => {
    if (!open || modo !== "camara") return;
    let cancelado = false;
    let scanner: Html5Qrcode | null = null;
    setError(null);

    // Espera un frame a que el Drawer monte el contenedor en el DOM.
    const raf = requestAnimationFrame(() => {
      const nodo = document.getElementById(REGION_ID);
      if (cancelado || !nodo) {
        if (!cancelado) setError("No pudimos iniciar la cámara. Usa el modo manual.");
        return;
      }
      try {
        scanner = new Html5Qrcode(REGION_ID, { formatsToSupport: FORMATOS, verbose: false });
      } catch {
        setError("No pudimos iniciar la cámara. Usa el modo manual.");
        return;
      }
      scannerRef.current = scanner;
      detenerRef.current = () => {
        const s = scannerRef.current;
        scannerRef.current = null;
        if (s) {
          s.stop()
            .then(() => s.clear())
            .catch(() => {});
        }
      };

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 160 } },
          (texto) => {
            if (!cancelado) onCodigo(texto.trim());
          },
          () => {
            /* lecturas fallidas por frame: se ignoran */
          },
        )
        .catch((e: unknown) => {
          if (cancelado) return;
          setError(
            e instanceof Error && /permission|denied|NotAllowed/i.test(String(e.message))
              ? "No diste permiso de cámara. Actívalo en tu navegador o usa el modo manual."
              : "No pudimos abrir la cámara en este dispositivo. Usa el modo manual.",
          );
        });
    });

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      detenerRef.current?.();
      detenerRef.current = null;
    };
  }, [open, modo, onCodigo]);

  function enviarManual() {
    const c = manual.trim();
    if (!c) return;
    onCodigo(c);
    setManual("");
  }

  return (
    <Drawer open={open} onClose={onClose} title={titulo} descripcion="Apunta al código de barras o escríbelo.">
      <div className="flex flex-col gap-4">
        <Segmentos
          aria-label="Modo de escaneo"
          activo={modo}
          onChange={(m) => setModo(m)}
          segmentos={[
            { id: "camara", label: "Cámara", icono: Camera },
            { id: "manual", label: "Escribir", icono: Keyboard },
          ]}
        />

        {modo === "camara" ? (
          <div className="flex flex-col gap-3">
            {/* El contenedor SIEMPRE existe mientras el modo es cámara, para que la librería lo encuentre. */}
            <div id={REGION_ID} className="min-h-[200px] overflow-hidden rounded-2xl bg-surface-container [&_video]:w-full" />
            {error ? (
              <div className="flex flex-col gap-2 rounded-xl bg-warning-container px-3 py-2.5">
                <p className="text-body-sm text-warning">{error}</p>
              </div>
            ) : (
              <p className="text-center text-body-sm text-on-surface-variant">Centra el código dentro del recuadro.</p>
            )}
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              enviarManual();
            }}
          >
            <Input
              label="Código de barras"
              inputMode="numeric"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="7501234567890"
              autoFocus
            />
            <Button type="submit" size="lg" fullWidth disabled={!manual.trim()}>
              Buscar código
            </Button>
          </form>
        )}
      </div>
    </Drawer>
  );
}
