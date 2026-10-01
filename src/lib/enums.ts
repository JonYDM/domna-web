import type {
  EstadoApartado,
  EstadoEntrega,
  FamiliaColor,
  MetodoPago,
  ModalidadApartado,
  OrdenCatalogo,
  Silueta,
} from "@/types/api";

/** Etiquetas y tonos de los enums de dominio (una sola fuente). */

export type Tono = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const ESTADO_APARTADO: Record<EstadoApartado, { label: string; tono: Tono }> = {
  activo: { label: "Activo", tono: "primary" },
  liquidado: { label: "Liquidado", tono: "success" },
  vencido: { label: "Vencido", tono: "warning" },
  cancelado: { label: "Cancelado", tono: "neutral" },
};

export const ESTADO_ENTREGA: Record<EstadoEntrega, { label: string; tono: Tono }> = {
  en_origen: { label: "En sucursal de origen", tono: "neutral" },
  en_traslado: { label: "En traslado", tono: "info" },
  listo: { label: "Lista para recoger", tono: "success" },
  entregado: { label: "Entregado", tono: "neutral" },
};

export const SIGUIENTE_ENTREGA: Partial<Record<EstadoEntrega, { estado: EstadoEntrega; accion: string }>> = {
  en_origen: { estado: "en_traslado", accion: "Enviar a la otra sucursal" },
  en_traslado: { estado: "listo", accion: "Marcar como recibida" },
  listo: { estado: "entregado", accion: "Marcar como entregada" },
};

export const MODALIDAD: Record<ModalidadApartado, string> = {
  sin_anticipo: "Apartado sin anticipo",
  anticipo: "Apartado con anticipo",
  compra: "Compra de contado",
};

/** Estado visible: una compra pagada se muestra como "Pagada" (no "Liquidado"). */
export function estadoVisible(a: { estado: EstadoApartado; modalidad: ModalidadApartado }) {
  if (a.modalidad === "compra" && a.estado === "liquidado") return { label: "Pagada", tono: "success" as Tono };
  return ESTADO_APARTADO[a.estado];
}

/** Sigue "en curso" para la clienta: apartado activo o pagado sin entregar. */
export function enCurso(a: { estado: EstadoApartado; estadoEntrega: EstadoEntrega }): boolean {
  return a.estado === "activo" || (a.estado === "liquidado" && a.estadoEntrega !== "entregado");
}

export const METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export const ORDEN_CATALOGO: Record<OrdenCatalogo, string> = {
  nuevos: "Lo más nuevo",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
};

export const FAMILIAS_COLOR: { id: FamiliaColor; nombre: string; hex: string }[] = [
  { id: "negro", nombre: "Negro", hex: "#1F1B24" },
  { id: "blanco", nombre: "Blanco", hex: "#F6F3EE" },
  { id: "beige", nombre: "Beige", hex: "#D9C4A5" },
  { id: "cafe", nombre: "Café", hex: "#9A6B47" },
  { id: "gris", nombre: "Gris", hex: "#8C8790" },
  { id: "rojo", nombre: "Rojo", hex: "#C0283E" },
  { id: "rosa", nombre: "Rosa", hex: "#F2A7B5" },
  { id: "azul", nombre: "Azul", hex: "#4A6A92" },
  { id: "verde", nombre: "Verde", hex: "#5E7A4E" },
];

export const SILUETAS: { id: Silueta; nombre: string }[] = [
  { id: "vestido", nombre: "Vestido" },
  { id: "blusa", nombre: "Blusa / top" },
  { id: "pantalon", nombre: "Pantalón" },
  { id: "falda", nombre: "Falda" },
  { id: "chamarra", nombre: "Blazer / chamarra" },
  { id: "conjunto", nombre: "Conjunto" },
  { id: "bolsa", nombre: "Bolsa / accesorio" },
];

/** Tallas estándar del catálogo de atributos. */
export const TALLAS_ROPA = ["CH", "M", "G", "XG"];
export const TALLAS_NUMERICAS = ["3", "5", "7", "9", "11"];
export const TALLA_UNICA = ["Única"];

/** Umbral para "Quedan pocas". */
export const STOCK_BAJO = 2;
