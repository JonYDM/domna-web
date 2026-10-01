/**
 * Contratos de la API (los mismos que expondrá el backend .NET).
 * Hoy los implementa el mock (src/mock/server.ts). Dinero en MXN (pesos enteros en la demo).
 * Fechas: ISO 8601 en UTC.
 */

export type SucursalId = "temixco" | "azteca";

export interface Sucursal {
  id: SucursalId;
  nombre: string;
  direccion: string;
}

export interface ConfigBoutique {
  nombre: string;
  slug: string;
  /** % de anticipo de la modalidad "con anticipo". */
  anticipoPct: number;
  vigenciaSinAnticipoDias: number;
  vigenciaConAnticipoDias: number;
  /** Cargo por dejar vencer un apartado (se suma al siguiente). */
  penalizacion: number;
  limiteApartadosActivos: number;
  /** Días hábiles de traslado entre sucursales. */
  diasTraslado: number;
  /** Kill switch del SaaS: si la boutique no pagó la renta. */
  suspendida: boolean;
  /** Días que una prenda se muestra como "Nuevo" o "De vuelta" (default 7). */
  diasNovedad: number;
  sucursales: Sucursal[];
}

export interface Categoria {
  id: string;
  nombre: string;
}

export type Silueta = "vestido" | "blusa" | "pantalon" | "falda" | "chamarra" | "bolsa" | "conjunto";

export type FamiliaColor =
  | "negro"
  | "blanco"
  | "beige"
  | "cafe"
  | "gris"
  | "rojo"
  | "rosa"
  | "azul"
  | "verde";

export interface ColorProducto {
  id: string;
  nombre: string;
  hex: string;
  familia: FamiliaColor;
}

export interface ImagenProducto {
  url: string;
  /** Si está ligada a un color, la galería la muestra al elegirlo. */
  colorId?: string;
}

export interface Variante {
  id: string;
  productoId: string;
  talla: string;
  colorId: string;
  sku: string;
  /** Stock físico por sucursal. */
  stock: Record<SucursalId, number>;
}

export interface VarianteDisponible extends Variante {
  /** disponible = stock físico − reservado en apartados activos. */
  disponible: number;
  disponiblePorSucursal: Record<SucursalId, number>;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  silueta: Silueta;
  precio: number;
  /** Precio tachado (oferta). */
  precioAntes?: number;
  activo: boolean;
  /** false = solo se vende de contado (p. ej. ofertas). */
  permiteApartado: boolean;
  colores: ColorProducto[];
  tallas: string[];
  variantes: Variante[];
  imagenes: ImagenProducto[];
  /** Fecha de alta (UTC). "Nuevo" se DERIVA de aquí, no se guarda. */
  creado: string;
  /** Última vez que una variante agotada volvió a tener stock (UTC). */
  reabastecidoEl?: string;
}

/** Banderas derivadas por el servidor con la fecha actual (no se guardan). */
export interface Novedad {
  /** Creado hace menos de `diasNovedad` días. */
  nuevo: boolean;
  /** Reabastecido hace menos de `diasNovedad` días (y no es nuevo). */
  reabastecido: boolean;
}

/** Item del grid del catálogo. */
export interface ProductoResumen extends Novedad {
  id: string;
  nombre: string;
  categoriaId: string;
  silueta: Silueta;
  precio: number;
  precioAntes?: number;
  activo: boolean;
  permiteApartado: boolean;
  colores: ColorProducto[];
  tallas: string[];
  imagenes: ImagenProducto[];
  disponibleTotal: number;
  stockFisicoTotal: number;
}

export interface ProductoDetalle extends Omit<Producto, "variantes">, Novedad {
  variantes: VarianteDisponible[];
}

export type OrdenCatalogo = "nuevos" | "precio-asc" | "precio-desc";

/** Secciones del catálogo: recién llegados o de vuelta en stock. */
export type SeccionCatalogo = "nuevos" | "reabastecidos";

export interface FiltrosCatalogo {
  texto?: string;
  categoria?: string;
  talla?: string;
  color?: FamiliaColor;
  precioMax?: number;
  orden?: OrdenCatalogo;
  seccion?: SeccionCatalogo;
  /** Solo para el panel de la dueña: incluir inactivos. */
  incluirInactivos?: boolean;
}

// ── Apartados ──

export type EstadoApartado = "activo" | "liquidado" | "vencido" | "cancelado";
/** "compra" = pago completo al momento (venta directa); las otras dos son apartados. */
export type ModalidadApartado = "sin_anticipo" | "anticipo" | "compra";
export type EstadoEntrega = "en_origen" | "en_traslado" | "listo" | "entregado";
export type MetodoPago = "efectivo" | "transferencia" | "tarjeta";

export interface LineaApartado {
  varianteId: string;
  productoId: string;
  nombre: string;
  silueta: Silueta;
  talla: string;
  colorNombre: string;
  colorHex: string;
  /** Precio congelado al apartar. */
  precio: number;
  cantidad: number;
  sucursalOrigen: SucursalId;
}

export interface Abono {
  id: string;
  monto: number;
  fecha: string;
  metodo: MetodoPago;
  concepto: "anticipo" | "abono" | "liquidacion" | "compra";
}

export interface Apartado {
  id: string;
  folio: string;
  clientaId: string;
  clientaNombre: string;
  clientaTelefono: string;
  lineas: LineaApartado[];
  subtotal: number;
  /** Penalización de un apartado vencido anterior, cobrada en este. */
  penalizacion: number;
  total: number;
  modalidad: ModalidadApartado;
  entrega: SucursalId;
  requiereTraslado: boolean;
  estadoEntrega: EstadoEntrega;
  abonos: Abono[];
  pagado: number;
  saldo: number;
  creado: string;
  venceEl: string;
  /** Fecha estimada en que estará lista en la sucursal de entrega. */
  listoEstimado: string;
  estado: EstadoApartado;
  cerradoEl?: string;
}

export interface Clienta {
  id: string;
  nombre: string;
  telefono: string;
  penalizacionPendiente: number;
}

export interface CrearApartadoInput {
  varianteId: string;
  cantidad: number;
  modalidad: ModalidadApartado;
  entrega: SucursalId;
  metodoAnticipo?: MetodoPago;
}

export interface CotizacionApartado {
  subtotal: number;
  penalizacion: number;
  total: number;
  /** Lo que se paga hoy (anticipo o el total si es compra). */
  anticipo: number;
  venceEl: string;
  requiereTraslado: boolean;
  listoEstimado: string;
  sucursalOrigen: SucursalId | null;
}

export interface RegistrarAbonoInput {
  apartadoId: string;
  monto: number;
  metodo: MetodoPago;
}

/** por_entregar = pagado (liquidado) y aún no entregado. */
export type FiltroEstadoApartado = EstadoApartado | "por_vencer" | "por_entregar";

// ── Panel de la dueña ──

export interface StockBajoItem {
  productoId: string;
  nombre: string;
  talla: string;
  colorNombre: string;
  colorHex: string;
  disponible: number;
}

export interface Metricas {
  apartadosActivos: number;
  montoActivos: number;
  saldoPorCobrar: number;
  porVencer: number;
  ventasMes: number;
  piezasVendidasMes: number;
  /** % de apartados cerrados que se liquidaron. */
  conversion: number;
  porEntregar: number;
  comprasMes: number;
  penalizacionesMes: number;
  stockBajo: StockBajoItem[];
  topProductos: { productoId: string; nombre: string; silueta: Silueta; colorHex: string; unidades: number }[];
  ventasUltimos7: { dia: string; total: number }[];
}

export interface NuevoProductoInput {
  nombre: string;
  descripcion: string;
  categoriaId: string;
  silueta: Silueta;
  precio: number;
  colores: Omit<ColorProducto, "id">[];
  tallas: string[];
  /** stock[talla][colorIndex] en la sucursal elegida. */
  stock: Record<string, number[]>;
  sucursal: SucursalId;
  permiteApartado: boolean;
}

// ── Avisos in-app (notificaciones de la clienta) ──

export type TipoAviso = "por_vencer" | "vencido" | "abono" | "traslado" | "lista";

export interface Aviso {
  /** Estable: tipo + pedido (+ abono). Sirve para marcarlo como leído. */
  id: string;
  tipo: TipoAviso;
  titulo: string;
  texto: string;
  /** Cuándo se volvió relevante (UTC). */
  fecha: string;
  leido: boolean;
  /** Requiere acción pronto (vence en ≤ 3 días). */
  urgente: boolean;
  apartadoId: string;
}
