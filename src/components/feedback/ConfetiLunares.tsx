import { useMemo, type CSSProperties } from "react";
import { MARCA } from "@/lib/marca";

/** Confeti de lunares para "¡Apartado listo!". Decorativo. */
export function ConfetiLunares({ cantidad = 26 }: { cantidad?: number }) {
  const lunares = useMemo(
    () =>
      Array.from({ length: cantidad }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 10,
        dx: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.5,
        color: [MARCA.rojo, MARCA.tinta, MARCA.rubor][i % 3],
      })),
    [cantidad],
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden" aria-hidden>
      {lunares.map((l) => (
        <span
          key={l.id}
          className="lunar-confeti absolute top-0 rounded-full opacity-0"
          style={
            {
              left: `${l.left}%`,
              width: l.size,
              height: l.size,
              backgroundColor: l.color,
              animationDelay: `${l.delay}s`,
              "--dx": `${l.dx}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
