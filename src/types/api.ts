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
  nuevo: boolean;
  colores: ColorProducto[];
  tallas: string[];
  variantes: Variante[];
  imagenes: ImagenProducto[];
  creado: string;
}

/** Item del grid del catálogo. */
export interface ProductoResumen {
  id: string;
  nombre: string;
  categoriaId: string;
  silueta: Silueta;
  precio: number;
  precioAntes?: number;
  nuevo: boolean;
  activo: boolean;
  colores: ColorProducto[];
  tallas: string[];
  imagenes: ImagenProducto[];
  disponibleTotal: number;
  stockFisicoTotal: number;
}

export interface ProductoDetalle extends Omit<Producto, "variantes"> {
  variantes: VarianteDisponible[];
}

export type OrdenCatalogo = "nuevos" | "precio-asc" | "precio-desc";

export interface FiltrosCatalogo {
  texto?: string;
  categoria?: string;
  talla?: string;
  color?: FamiliaColor;
  precioMax?: number;
  orden?: OrdenCatalogo;
  /** Solo para el panel de la dueña: incluir inactivos. */
  incluirInactivos?: boolean;
}

// ── Apartados ──

export type EstadoApartado = "activo" | "liquidado" | "vencido" | "cancelado";
export type ModalidadApartado = "sin_anticipo" | "anticipo";
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
  concepto: "anticipo" | "abono" | "liquidacion";
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

export type FiltroEstadoApartado = EstadoApartado | "por_vencer";

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
  conversion: number;
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
}
