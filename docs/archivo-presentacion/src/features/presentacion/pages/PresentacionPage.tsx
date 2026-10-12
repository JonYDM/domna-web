import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Automatico,
  Cierre,
  Clientas,
  Comparativa,
  Control,
  Duena,
  Empezamos,
  Portada,
  Problema,
  Solucion,
  Valor,
} from "../Diapositivas";

/** Tiempo por diapositiva en reproducción automática (ms). */
const DURACION = [7000, 9000, 8000, 10000, 10000, 10000, 10000, 9000, 9000, 9000, 0];
const TITULOS = [
  "Domna",
  "El problema",
  "La solución",
  "Para tus clientas",
  "Para ti",
  "Trabaja sola",
  "Por qué Domna",
  "El valor real",
  "Control",
  "Cómo empezamos",
  "¿Empezamos?",
];

/**
 * Presentación para la dueña: diapositivas con animaciones CSS, avance automático pausable,
 * flechas del teclado, deslizar en el celular y puntos de navegación.
 */
export default function PresentacionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // ?d=4 abre directo en la diapositiva 4 (para compartir una en específico).
  const [i, setI] = useState(() => Math.max(0, Math.min(TITULOS.length - 1, (Number(params.get("d")) || 1) - 1)));
  const [dir, setDir] = useState(1);
  const reducir = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [reproduciendo, setReproduciendo] = useState(!reducir);
  const total = TITULOS.length;
  const toque = useRef<number | null>(null);

  const ir = useCallback(
    (n: number) => {
      const sig = Math.max(0, Math.min(total - 1, n));
      setDir(sig >= i ? 1 : -1);
      setI(sig);
    },
    [i, total],
  );

  // Avance automático (se detiene en la última).
  useEffect(() => {
    if (!reproduciendo || i >= total - 1) return;
    const t = setTimeout(() => ir(i + 1), DURACION[i]);
    return () => clearTimeout(t);
  }, [i, reproduciendo, ir, total]);

  // Teclado: ← → navegan, Espacio pausa, Esc sale.
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") ir(i + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") ir(i - 1);
      else if (e.key === " ") {
        e.preventDefault();
        setReproduciendo((r) => !r);
      } else if (e.key === "Escape") navigate(-1);
    };
    addEventListener("keydown", fn);
    return () => removeEventListener("keydown", fn);
  }, [i, ir, navigate]);

  const diapositivas = [
    <Portada key="0" />,
    <Problema key="1" />,
    <Solucion key="2" />,
    <Clientas key="3" />,
    <Duena key="4" />,
    <Automatico key="5" />,
    <Comparativa key="6" />,
    <Valor key="7" />,
    <Control key="8" />,
    <Empezamos key="9" />,
    <Cierre
      key="10"
      onVerDemo={() => navigate("/")}
      onRepetir={() => {
        setI(0);
        setReproduciendo(true);
      }}
    />,
  ];

  return (
    <main
      className={cn("lunares relative flex min-h-dvh flex-col overflow-x-hidden bg-surface", !reproduciendo && "pausado")}
      aria-roledescription="presentación"
      aria-label="Qué es Domna"
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque.current === null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        toque.current = null;
        if (Math.abs(dx) > 50) {
          setReproduciendo(false);
          ir(i + (dx < 0 ? 1 : -1));
        }
      }}
    >
      {/* Progreso por diapositiva */}
      <div className="flex gap-1 px-4 pt-3" aria-hidden>
        {TITULOS.map((t, n) => (
          <span key={t} className="h-1 flex-1 overflow-hidden rounded-full bg-on-surface/10">
            {n < i && <span className="block h-full w-full rounded-full bg-primary" />}
            {n === i && (
              <span
                key={`${i}-${reproduciendo}`}
                className={cn("block h-full w-full rounded-full bg-primary", reproduciendo && DURACION[n] ? "progreso-activo" : "")}
                style={{ "--dur": `${DURACION[n]}ms` } as CSSProperties}
              />
            )}
          </span>
        ))}
      </div>

      <header className="flex items-center justify-between px-4 pt-2">
        <p className="text-label-md text-on-surface-variant" aria-live="polite">
          {i + 1} / {total} · {TITULOS[i]}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Cerrar presentación"
          className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Diapositiva: el key reinicia las animaciones de entrada */}
      <section
        key={i}
        className="entra-diapo mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col justify-center px-5 pb-32 pt-4 md:px-8"
        style={{ "--dir": `${dir * 24}px` } as CSSProperties}
        aria-roledescription="diapositiva"
        aria-label={`${i + 1} de ${total}: ${TITULOS[i]}`}
      >
        {diapositivas[i]}
      </section>

      {/* Controles */}
      <nav
        aria-label="Navegación de la presentación"
        className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-2 px-4 pt-2"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-1 rounded-full bg-surface-container-lowest p-1.5 shadow-lift">
          <BotonRedondo etiqueta="Anterior" onClick={() => (setReproduciendo(false), ir(i - 1))} disabled={i === 0}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </BotonRedondo>
          <BotonRedondo etiqueta={reproduciendo ? "Pausar" : "Reproducir"} onClick={() => setReproduciendo((r) => !r)} activo>
            {reproduciendo ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          </BotonRedondo>
          <div className="mx-1 hidden items-center gap-1.5 sm:flex">
            {TITULOS.map((t, n) => (
              <button
                key={t}
                type="button"
                onClick={() => (setReproduciendo(false), ir(n))}
                aria-label={`Ir a ${t}`}
                aria-current={n === i ? "step" : undefined}
                className={cn("h-2 rounded-full transition-all", n === i ? "w-6 bg-tinta" : "w-2 bg-on-surface/20 hover:bg-on-surface/40")}
              />
            ))}
          </div>
          <BotonRedondo etiqueta="Siguiente" onClick={() => (setReproduciendo(false), ir(i + 1))} disabled={i === total - 1}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </BotonRedondo>
        </div>
      </nav>
    </main>
  );
}

function BotonRedondo({
  etiqueta,
  onClick,
  disabled,
  activo,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  disabled?: boolean;
  activo?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full transition-colors disabled:opacity-30",
        activo ? "bg-tinta text-on-primary hover:bg-tinta-hover" : "text-on-surface hover:bg-surface-container",
      )}
    >
      {children}
    </button>
  );
}
