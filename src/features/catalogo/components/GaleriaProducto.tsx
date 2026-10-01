import { useRef, useState } from "react";
import type { Silueta } from "@/types/api";
import { PrendaImagen, type VistaPrenda } from "@/components/ilustraciones/PrendaImagen";
import { cn } from "@/lib/cn";

const VISTAS: { id: VistaPrenda; label: string }[] = [
  { id: "frente", label: "Frente" },
  { id: "espalda", label: "Espalda" },
  { id: "detalle", label: "Detalle" },
];

interface GaleriaProps {
  silueta: Silueta;
  hex: string;
  nombre: string;
  colorNombre: string;
  urls?: string[];
}

/** Galería con swipe (scroll-snap) en móvil y miniaturas en escritorio. Cambia con el color. */
export function GaleriaProducto({ silueta, hex, nombre, colorNombre, urls = [] }: GaleriaProps) {
  const [indice, setIndice] = useState(0);
  const pista = useRef<HTMLDivElement>(null);
  const slides = urls.length ? urls.map((u, i) => ({ id: `${i}`, url: u, vista: "frente" as VistaPrenda, label: `Foto ${i + 1}` })) : VISTAS.map((v) => ({ ...v, url: undefined, vista: v.id }));

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
              <PrendaImagen
                silueta={silueta}
                hex={hex}
                vista={s.vista}
                url={s.url}
                alt={`${nombre} en ${colorNombre}, ${s.label.toLowerCase()}`}
                prioridad={i === 0}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={cn("h-1.5 rounded-full transition-all", i === indice ? "w-5 bg-tinta" : "w-1.5 bg-tinta/30")}
            />
          ))}
        </div>
      </div>
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
            <PrendaImagen silueta={silueta} hex={hex} vista={s.vista} url={s.url} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
