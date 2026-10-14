import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Check, ChevronsRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const TAM_PERILLA = 52; // px
const UMBRAL = 0.9; // fracción del recorrido para dar por confirmado

/**
 * Deslizar para confirmar: evita confirmar un pago por un toque accidental. Con teclado o lector
 * de pantalla, la perilla es un control deslizable: Enter o Espacio confirman directo.
 */
export function DeslizarConfirmar({
  etiqueta,
  onConfirmar,
  cargando = false,
  disabled = false,
}: {
  etiqueta: string;
  onConfirmar: () => void;
  cargando?: boolean;
  disabled?: boolean;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ x: number; base: number } | null>(null);
  const [x, setX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  const recorrido = () => Math.max(1, (pista.current?.clientWidth ?? 0) - TAM_PERILLA - 8);
  const inactivo = disabled || cargando;

  function soltar(confirmar: boolean) {
    setArrastrando(false);
    inicio.current = null;
    if (confirmar && !inactivo) onConfirmar();
    setX(0);
  }

  function alPresionar(e: PointerEvent<HTMLButtonElement>) {
    if (inactivo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { x: e.clientX, base: x };
    setArrastrando(true);
  }

  function alMover(e: PointerEvent<HTMLButtonElement>) {
    if (!inicio.current) return;
    const dx = e.clientX - inicio.current.x + inicio.current.base;
    setX(Math.min(Math.max(0, dx), recorrido()));
  }

  function alSoltar() {
    if (!inicio.current) return;
    soltar(x >= recorrido() * UMBRAL);
  }

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>) {
    if (inactivo) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onConfirmar();
    }
  }

  const progreso = Math.round((x / recorrido()) * 100);

  return (
    <div
      ref={pista}
      className={cn(
        "relative flex h-[60px] select-none items-center overflow-hidden rounded-full bg-success-container p-1",
        inactivo && "opacity-70",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 rounded-full bg-success/20"
        style={{ width: x + TAM_PERILLA + 4 }}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-label-lg text-on-surface">
        {cargando ? "Confirmando…" : etiqueta}
      </span>
      <button
        type="button"
        role="slider"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progreso}
        aria-valuetext={cargando ? "Confirmando" : "Desliza a la derecha, o pulsa Enter, para confirmar"}
        disabled={inactivo}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => soltar(false)}
        onKeyDown={alTeclear}
        style={{ transform: `translateX(${x}px)`, width: TAM_PERILLA, height: TAM_PERILLA }}
        className={cn(
          "relative z-10 grid shrink-0 touch-none place-items-center rounded-full bg-tinta text-on-primary shadow-soft",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
          !arrastrando && "transition-transform duration-200 motion-reduce:transition-none",
          inactivo ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        )}
      >
        {cargando ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : progreso >= UMBRAL * 100 ? (
          <Check className="h-5 w-5" aria-hidden />
        ) : (
          <ChevronsRight className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
