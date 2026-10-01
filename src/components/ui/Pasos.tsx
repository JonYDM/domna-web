import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface Paso {
  titulo: string;
  contenido: ReactNode;
  /** false bloquea "Continuar" (validación del paso). */
  valido?: boolean;
}

interface PasosProps {
  pasos: Paso[];
  onFinalizar: () => void;
  guardando?: boolean;
  textoFinal?: string;
  /** Edición: se puede saltar a cualquier paso. */
  libre?: boolean;
}

/** Wizard corto (1–3 campos por paso) dentro del Drawer. */
export function Pasos({ pasos, onFinalizar, guardando = false, textoFinal = "Guardar", libre = false }: PasosProps) {
  const [actual, setActual] = useState(0);
  const [maxVisto, setMaxVisto] = useState(0);
  const paso = pasos[actual];
  const esUltimo = actual === pasos.length - 1;
  const puede = paso.valido !== false;

  function ir(i: number) {
    setActual(i);
    setMaxVisto((m) => Math.max(m, i));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-1.5">
          {pasos.map((p, i) => {
            const accesible = libre || i <= maxVisto;
            return (
              <button
                key={p.titulo}
                type="button"
                onClick={() => accesible && ir(i)}
                disabled={!accesible}
                aria-label={`Paso ${i + 1}: ${p.titulo}`}
                aria-current={i === actual ? "step" : undefined}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= actual ? "bg-primary" : "bg-surface-container-high",
                )}
              />
            );
          })}
        </div>
        <p className="mt-2 text-label-md text-on-surface-variant">
          Paso {actual + 1} de {pasos.length} · <span className="text-on-surface">{paso.titulo}</span>
        </p>
      </div>

      <div key={actual} className="anim-sube">
        {paso.contenido}
      </div>

      <div className="flex gap-2">
        {actual > 0 && (
          <Button variant="ghost" onClick={() => ir(actual - 1)} disabled={guardando}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Atrás
          </Button>
        )}
        <Button
          fullWidth
          disabled={!puede}
          loading={guardando}
          onClick={() => (esUltimo ? onFinalizar() : ir(actual + 1))}
        >
          {esUltimo ? (
            <>
              {!guardando && <Check className="h-4 w-4" aria-hidden />}
              {textoFinal}
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
