import { useRef, useState } from "react";
import { FotoPrenda } from "@/components/FotoPrenda";
import { VisorImagen } from "@/components/organisms/VisorImagen";
import { cn } from "@/lib/cn";

interface GaleriaProps {
  hex: string;
  nombre: string;
  colorNombre: string;
  urls?: string[];
}

/**
 * Galería con swipe (scroll-snap) en móvil y miniaturas en escritorio. Cambia con el color.
 * Solo la primera foto es prioritaria; las demás esperan a que se deslicen cerca, y las miniaturas
 * de escritorio bajan la versión chica. La versión de alta resolución se pide al ampliar.
 */
export function GaleriaProducto({ hex, nombre, colorNombre, urls = [] }: GaleriaProps) {
  const [indice, setIndice] = useState(0);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const pista = useRef<HTMLDivElement>(null);
  const hayFotos = urls.length > 0;
  const slides = hayFotos ? urls.map((u, i) => ({ id: `${i}`, url: u, label: `Foto ${i + 1}` })) : [{ id: "sin-foto", url: undefined, label: "Foto" }];

  function ir(i: number) {
    const el = pista.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row-reverse">
      <div className="relative min-w-0 flex-1">
        <div
          ref={pista}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndice(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-3xl"
          aria-roledescription="carrusel"
          aria-label={`Fotos de ${nombre}`}
        >
          {slides.map((s, i) => (
            <div key={s.id} className="w-full shrink-0 snap-center" aria-label={`${i + 1} de ${slides.length}`}>
              {hayFotos ? (
                <button
                  type="button"
                  onClick={() => { setIndice(i); setVisorAbierto(true); }}
                  aria-label={`Ampliar foto ${i + 1} de ${nombre}`}
                  className="block w-full cursor-zoom-in focus-visible:outline-none"
                >
                  <FotoPrenda
                    hex={hex}
                    url={s.url}
                    tamano="completa"
                    alt={`${nombre} en ${colorNombre}, ${s.label.toLowerCase()}`}
                    prioridad={i === 0}
                  />
                </button>
              ) : (
                <FotoPrenda hex={hex} alt={`${nombre} en ${colorNombre}`} prioridad />
              )}
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
            {slides.map((s, i) => (
              <span
                key={s.id}
                className={cn("h-1.5 rounded-full transition-all", i === indice ? "w-5 bg-tinta" : "w-1.5 bg-tinta/30")}
              />
            ))}
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div className="hidden flex-col gap-2 md:flex">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver ${s.label.toLowerCase()}`}
              aria-current={i === indice}
              className={cn(
                "w-20 overflow-hidden rounded-xl ring-offset-2 ring-offset-surface transition",
                i === indice ? "ring-2 ring-tinta" : "opacity-70 hover:opacity-100",
              )}
            >
              <FotoPrenda hex={hex} url={s.url} alt="" />
            </button>
          ))}
        </div>
      )}

      {visorAbierto && hayFotos && (
        <VisorImagen
          imagenes={urls}
          indice={indice}
          alt={`${nombre} en ${colorNombre}`}
          onClose={() => setVisorAbierto(false)}
        />
      )}
    </div>
  );
}