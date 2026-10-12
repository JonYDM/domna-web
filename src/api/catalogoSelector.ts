import type {
  Categoria,
  CategoriaInput,
  ColorCatalogo,
  ColorInput,
  AgregarColorInput,
  ConfigBoutique,
  EditarProductoInput,
  FiltrosCatalogo,
  NuevoProductoInput,
  Producto,
  ProductoDetalle,
  ProductoResumen,
  ResultadoCodigo,
} from "@/types/api";
import { apiActiva } from "./http";
import * as real from "./catalogo";
import * as config from "./config";
import * as mock from "@/mock/server";

/**
 * Selector del catálogo: usa el backend real si VITE_API_URL está definida, si no el mock.
 * Solo cubre lo que el backend ya soporta (categorías, colores, productos CRUD). El resto
 * (métricas, clientas, stock en lote, config, demo) sigue en el mock hasta que el backend lo tenga.
 */

export function listarProductos(f: FiltrosCatalogo): Promise<ProductoResumen[]> {
  return apiActiva ? real.listarProductos(f) : mock.listarProductos(f);
}

export function obtenerProducto(id: string, opciones: { incluirInactivo?: boolean } = {}): Promise<ProductoDetalle> {
  return apiActiva ? real.obtenerProducto(id, opciones) : mock.obtenerProducto(id, opciones);
}

export function crearProducto(input: NuevoProductoInput): Promise<Producto> {
  return apiActiva ? real.crearProducto(input) : mock.crearProducto(input);
}

export function editarProducto(id: string, input: EditarProductoInput): Promise<ProductoDetalle> {
  if (apiActiva) return real.editarProducto(id, input);
  // Mock: aplica lo que soporta (permiteApartado) y devuelve el detalle actualizado.
  return mock.cambiarPermiteApartado(id, input.permiteApartado).then(() => mock.obtenerProducto(id));
}

/** Agregar un color (con fotos, tallas y stock) a un producto. Requiere la API real. */
export function agregarColor(id: string, input: AgregarColorInput): Promise<ProductoDetalle> {
  return real.agregarColor(id, input); // solo API real (el mock no soporta agregar variantes)
}

/** Edición de galería (solo API real). */
export function quitarImagen(id: string, url: string): Promise<ProductoDetalle> {
  return real.quitarImagen(id, url);
}
export function agregarImagenesColor(id: string, colorId: string, urls: string[]): Promise<ProductoDetalle> {
  return real.agregarImagenesColor(id, colorId, urls);
}
export function quitarColor(id: string, colorId: string): Promise<ProductoDetalle> {
  return real.quitarColor(id, colorId);
}

export function cambiarEstadoProducto(id: string, activo: boolean): Promise<void> {
  return apiActiva ? real.cambiarEstadoProducto(id, activo) : mock.cambiarEstadoProducto(id, activo);
}

export function eliminarProductoPermanente(id: string): Promise<void> {
  return apiActiva ? real.eliminarProductoPermanente(id) : mock.eliminarProductoPermanente(id);
}

export function cambiarPermiteApartado(id: string, permite: boolean): Promise<void> {
  return apiActiva ? real.cambiarPermiteApartado(id, permite) : mock.cambiarPermiteApartado(id, permite);
}

export function obtenerCategorias(): Promise<Categoria[]> {
  return apiActiva ? real.obtenerCategorias() : mock.obtenerCategorias();
}

export function guardarCategoria(id: string | null, input: CategoriaInput): Promise<Categoria> {
  return apiActiva ? real.guardarCategoria(id, input) : mock.guardarCategoria(id, input);
}

export function eliminarCategoria(id: string): Promise<void> {
  return apiActiva ? real.eliminarCategoria(id) : mock.eliminarCategoria(id);
}

export function obtenerColores(): Promise<ColorCatalogo[]> {
  return apiActiva ? real.obtenerColores() : mock.obtenerColores();
}

export function guardarColor(id: string | null, input: ColorInput): Promise<ColorCatalogo> {
  return apiActiva ? real.guardarColor(id, input) : mock.guardarColor(id, input);
}

export function eliminarColor(id: string): Promise<void> {
  return apiActiva ? real.eliminarColor(id) : mock.eliminarColor(id);
}

/** Config de la boutique: datos reales (nombre, vigencias, kill switch, etc.). */
export function obtenerConfig(): Promise<ConfigBoutique> {
  return apiActiva ? config.obtenerConfig() : mock.obtenerConfig();
}

/** Pausar/reanudar la tienda (kill switch del SaaS): dato real, persistido. */
export function demoSuspender(suspendida: boolean): Promise<void> {
  return apiActiva ? config.demoSuspender(suspendida) : mock.demoSuspender(suspendida);
}

/** Catálogo público u oculto sin cuenta: dato real, persistido. */
export function demoCatalogoPublico(publico: boolean): Promise<void> {
  return apiActiva ? config.demoCatalogoPublico(publico) : mock.demoCatalogoPublico(publico);
}

/** Busca una variante por su código de barras físico (POS/escáner). */
export function buscarPorCodigo(codigo: string): Promise<ResultadoCodigo> {
  return apiActiva ? real.buscarPorCodigo(codigo) : mock.buscarPorCodigo(codigo);
}
