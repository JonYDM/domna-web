import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CarritoContext,
  claveCarrito,
  leerCarrito,
  type CarritoValor,
  type ItemCarrito,
  type LineaCarritoClienta,
} from "./carrito";

/**
 * Carrito de la clienta. Persiste en localStorage por clientaId (sobrevive al refresh).
 * El dominio ya acepta pedidos multi-línea (ver mock/dominio.ts), así que al confirmar se manda
 * `lineas: [{ varianteId, cantidad }]` a `crearApartado`.
 */
export function CarritoProvider({ clientaId, children }: { clientaId: string | undefined; children: ReactNode }) {
  const k = claveCarrito(clientaId);
  const [lineas, setLineas] = useState<LineaCarritoClienta[]>(() => leerCarrito(k));

  // Al cambiar de clienta (login/logout), carga su carrito.
  useEffect(() => {
    setLineas(leerCarrito(k));
  }, [k]);

  // Persiste en cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(k, JSON.stringify(lineas));
    } catch {
      /* cuota llena: ignora */
    }
  }, [k, lineas]);

  const agregar = useCallback((item: ItemCarrito, cantidad = 1) => {
    setLineas((ls) => {
      const i = ls.findIndex((l) => l.varianteId === item.varianteId);
      if (i >= 0) {
        const copia = [...ls];
        copia[i] = { ...copia[i], cantidad: copia[i].cantidad + cantidad };
        return copia;
      }
      return [...ls, { ...item, cantidad }];
    });
  }, []);

  const cambiarCantidad = useCallback((varianteId: string, delta: number) => {
    setLineas((ls) =>
      ls
        .map((l) => (l.varianteId === varianteId ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0),
    );
  }, []);

  const quitar = useCallback((varianteId: string) => {
    setLineas((ls) => ls.filter((l) => l.varianteId !== varianteId));
  }, []);

  const limpiar = useCallback(() => setLineas([]), []);

  const valor = useMemo<CarritoValor>(() => {
    const piezas = lineas.reduce((n, l) => n + l.cantidad, 0);
    const total = lineas.reduce((n, l) => n + l.precio * l.cantidad, 0);
    const soloContado = lineas.some((l) => !l.permiteApartado);
    return { lineas, piezas, total, soloContado, agregar, cambiarCantidad, quitar, limpiar };
  }, [lineas, agregar, cambiarCantidad, quitar, limpiar]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
