import { createContext, useContext } from "react";
import type { Silueta } from "@/types/api";

/** Una línea del carrito de la clienta (datos para mostrar y para armar el pedido). */
export interface LineaCarritoClienta {
  varianteId: string;
  productoId: string;
  nombre: string;
  silueta: Silueta;
  precio: number;
  talla: string;
  colorNombre: string;
  colorHex: string;
  /** Si la prenda NO se puede apartar (oferta): fuerza "comprar" en el carrito. */
  permiteApartado: boolean;
  cantidad: number;
}

export type ItemCarrito = Omit<LineaCarritoClienta, "cantidad">;

export interface CarritoValor {
  lineas: LineaCarritoClienta[];
  piezas: number;
  total: number;
  /** true si alguna prenda del carrito es solo de contado (fuerza comprar). */
  soloContado: boolean;
  agregar: (item: ItemCarrito, cantidad?: number) => void;
  cambiarCantidad: (varianteId: string, delta: number) => void;
  quitar: (varianteId: string) => void;
  limpiar: () => void;
}

export const CarritoContext = createContext<CarritoValor | null>(null);

export function useCarrito(): CarritoValor {
  const v = useContext(CarritoContext);
  if (!v) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return v;
}

const STORAGE = "domna.carrito";

/** Carrito por clienta: `domna.carrito.<clientaId>` (invitada: `domna.carrito.invitada`). */
export function claveCarrito(clientaId: string | undefined): string {
  return `${STORAGE}.${clientaId ?? "invitada"}`;
}

export function leerCarrito(k: string): LineaCarritoClienta[] {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as LineaCarritoClienta[]) : [];
  } catch {
    return [];
  }
}
