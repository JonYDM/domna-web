import type {
  Categoria,
  CategoriaInput,
  AgregarColorInput,
  ColorCatalogo,
  ColorGuardado,
  ColorInput,
  EditarProductoInput,
  NuevoProductoInput,
  Producto,
  ProductoDetalle,
  ProductoResumen,
  ResultadoCodigo,
  Variante,
  VarianteDisponible,
} from "@/types/api";
import { http } from "./http";

/**
 * Las lecturas del catálogo revalidan siempre con el servidor (ETag → 304 si no cambió). El API
 * las marca con max-age corto para otros clientes, pero esta app no debe recibir la lista vieja de
 * la caché del navegador justo después de publicar o editar algo.
 */
const REVALIDAR = { cache: "no-cache" } as const;

/**
 * Catálogo contra el backend (domna-api). El backend devuelve un ProductoDto; aquí lo adaptamos a las
 * formas que la UI espera (ProductoResumen / ProductoDetalle), derivando lo que haga falta.
 */

const DIAS_NOVEDAD = 7;

/** DTO de producto tal como lo entrega el backend. */
interface ProductoDto {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  silueta: string;
  precio: number;
  costo: number;
  precioAntes?: number | null;
  codigoBarras?: string | null;
  activo: boolean;
  permiteApartado: boolean;
  colores: { id: string; nombre: string; hex: string; familia: string }[];
  tallas: string[];
  variantes: {
    id: string;
    productoId: string;
    talla: string;
    colorId: string;
    sku: string;
    codigoBarras?: string | null;
    stock: Record<string, number>;
    disponible: number;
    disponiblePorSucursal: Record<string, number>;
    reservadoPorSucursal: Record<string, number>;
  }[];
  imagenes?: { url: string; colorId?: string | null }[];
  creado: string;
  reabastecidoEl?: string | null;
}

function esNuevo(creado: string, ahora: number): boolean {
  return ahora - new Date(creado).getTime() < DIAS_NOVEDAD * 86_400_000;
}

function stockTotalDto(p: ProductoDto): number {
  return p.variantes.reduce((n, v) => n + (v.stock.temixco ?? 0) + (v.stock.azteca ?? 0), 0);
}

/** DTO → VarianteDisponible, usando el disponible/reservado real que ya calcula el backend. */
function aVarianteDisponible(v: ProductoDto["variantes"][number]): VarianteDisponible {
  const temixco = v.stock.temixco ?? 0;
  const azteca = v.stock.azteca ?? 0;
  const base: Variante = {
    id: v.id,
    productoId: v.productoId,
    talla: v.talla,
    colorId: v.colorId,
    sku: v.sku,
    codigoBarras: v.codigoBarras ?? undefined,
    stock: { temixco, azteca },
  };
  return {
    ...base,
    disponible: v.disponible,
    disponiblePorSucursal: {
      temixco: v.disponiblePorSucursal.temixco ?? 0,
      azteca: v.disponiblePorSucursal.azteca ?? 0,
    },
    reservadoPorSucursal: {
      temixco: v.reservadoPorSucursal.temixco ?? 0,
      azteca: v.reservadoPorSucursal.azteca ?? 0,
    },
  };
}

function aProductoDetalle(p: ProductoDto, ahora: number): ProductoDetalle {
  const nuevo = esNuevo(p.creado, ahora);
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    categoriaId: p.categoriaId,
    silueta: p.silueta as ProductoDetalle["silueta"],
    precio: p.precio,
    costo: p.costo,
    precioAntes: p.precioAntes ?? undefined,
    codigoBarras: p.codigoBarras ?? undefined,
    activo: p.activo,
    permiteApartado: p.permiteApartado,
    colores: p.colores.map((c) => ({ ...c, familia: c.familia as ColorCatalogo["familia"] })),
    tallas: p.tallas,
    imagenes: (p.imagenes ?? []).map((i) => ({ url: i.url, colorId: i.colorId ?? undefined })),
    creado: p.creado,
    reabastecidoEl: p.reabastecidoEl ?? undefined,
    nuevo,
    reabastecido:
      !nuevo && !!p.reabastecidoEl && ahora - new Date(p.reabastecidoEl).getTime() < DIAS_NOVEDAD * 86_400_000,
    variantes: p.variantes.map(aVarianteDisponible),
  };
}

function aProductoResumen(p: ProductoDto, ahora: number): ProductoResumen {
  const d = aProductoDetalle(p, ahora);
  const disponibleTotal = d.variantes.reduce((n, v) => n + v.disponible, 0);
  return {
    id: d.id,
    nombre: d.nombre,
    categoriaId: d.categoriaId,
    silueta: d.silueta,
    precio: d.precio,
    precioAntes: d.precioAntes,
    activo: d.activo,
    permiteApartado: d.permiteApartado,
    colores: d.colores,
    tallas: d.tallas,
    imagenes: d.imagenes,
    disponibleTotal,
    stockFisicoTotal: stockTotalDto(p),
    nuevo: d.nuevo,
    reabastecido: d.reabastecido,
  };
}

// ── Categorías ──

export async function obtenerCategorias(): Promise<Categoria[]> {
  const dtos = await http.get<{ id: string; nombre: string; tallas: string[]; productos: number }[]>("/api/categorias", REVALIDAR);
  return dtos;
}

export async function guardarCategoria(id: string | null, input: CategoriaInput): Promise<Categoria> {
  return id
    ? http.put<Categoria>(`/api/categorias/${id}`, input)
    : http.post<Categoria>("/api/categorias", input);
}

export async function eliminarCategoria(id: string): Promise<void> {
  await http.del<void>(`/api/categorias/${id}`);
}

// ── Colores ──

export async function obtenerColores(): Promise<ColorCatalogo[]> {
  return http.get<ColorCatalogo[]>("/api/colores", REVALIDAR);
}

export async function guardarColor(id: string | null, input: ColorInput): Promise<ColorGuardado> {
  return id ? http.put<ColorGuardado>(`/api/colores/${id}`, input) : http.post<ColorGuardado>("/api/colores", input);
}

/** Uso de un color: en cuántas prendas está. */
export interface UsoColor {
  prendas: number;
}

/** En cuántas prendas se usa un color del catálogo (se reconoce por nombre). */
export async function usoColor(id: string): Promise<UsoColor> {
  return http.get<UsoColor>(`/api/colores/${encodeURIComponent(id)}/uso`);
}

export async function eliminarColor(id: string): Promise<void> {
  await http.del<void>(`/api/colores/${id}`);
}

// ── Productos ──

/**
 * Todo el catálogo, el más reciente primero. Los filtros (color, talla, precio, sección…) se aplican después en
 * el cliente con `aplicarFiltros`: la lista es chica y así cambiar un filtro no vuelve a pedir nada.
 */
export async function listarProductos(incluirInactivos = false): Promise<ProductoResumen[]> {
  const dtos = await http.get<ProductoDto[]>(`/api/productos?incluirInactivos=${incluirInactivos ? "true" : "false"}`, REVALIDAR);
  const ahora = Date.now();
  return dtos.map((p) => aProductoResumen(p, ahora));
}

export async function obtenerProducto(
  id: string,
  _opciones: { incluirInactivo?: boolean } = {},
): Promise<ProductoDetalle> {
  const dto = await http.get<ProductoDto>(`/api/productos/${id}`, REVALIDAR);
  return aProductoDetalle(dto, Date.now());
}

export async function crearProducto(input: NuevoProductoInput): Promise<Producto> {
  // El backend ignora/deriva campos extra; enviamos el input tal cual (incluye silueta por compat).
  return http.post<Producto>("/api/productos", input);
}

export async function agregarColor(id: string, input: AgregarColorInput): Promise<ProductoDetalle> {
  const dto = await http.post<ProductoDto>(`/api/productos/${id}/colores`, {
    color: input.color,
    tallas: input.tallas,
    stock: input.stock,
    fotos: input.fotos ?? [],
  });
  return aProductoDetalle(dto, Date.now());
}


export async function quitarImagen(id: string, url: string): Promise<ProductoDetalle> {
  const dto = await http.del<ProductoDto>(`/api/productos/${id}/imagenes`, { body: { url } });
  return aProductoDetalle(dto, Date.now());
}

export async function agregarImagenesColor(id: string, colorId: string, urls: string[]): Promise<ProductoDetalle> {
  const dto = await http.post<ProductoDto>(`/api/productos/${id}/colores/${colorId}/imagenes`, { urls });
  return aProductoDetalle(dto, Date.now());
}

export async function quitarColor(id: string, colorId: string): Promise<ProductoDetalle> {
  const dto = await http.del<ProductoDto>(`/api/productos/${id}/colores/${colorId}`);
  return aProductoDetalle(dto, Date.now());
}


export async function editarProducto(id: string, input: EditarProductoInput): Promise<ProductoDetalle> {
  const dto = await http.put<ProductoDto>(`/api/productos/${id}`, {
    nombre: input.nombre,
    descripcion: input.descripcion,
    precio: input.precio,
    costo: input.costo,
    precioAntes: input.precioAntes ?? null,
    permiteApartado: input.permiteApartado,
  });
  return aProductoDetalle(dto, Date.now());
}

export async function cambiarEstadoProducto(id: string, activo: boolean): Promise<void> {
  if (activo) await http.post<void>(`/api/productos/${id}/activar`);
  else await http.del<void>(`/api/productos/${id}`);
}

/** Borrado físico permanente (irreversible): solo si está inactiva y sin stock físico. */
export async function eliminarProductoPermanente(id: string): Promise<void> {
  await http.del<void>(`/api/productos/${id}/permanente`);
}

export async function cambiarPermiteApartado(id: string, permite: boolean): Promise<void> {
  // Edición parcial vía PUT: el backend reusa EditarProductoInput; se obtiene y reenvía.
  const dto = await http.get<ProductoDto>(`/api/productos/${id}`, REVALIDAR);
  await http.put(`/api/productos/${id}`, {
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    precio: dto.precio,
    costo: dto.costo,
    precioAntes: dto.precioAntes ?? null,
    permiteApartado: permite,
  });
}

/** Busca una variante por su código de barras físico (POS/escáner). */
export async function buscarPorCodigo(codigo: string): Promise<ResultadoCodigo> {
  const dto = await http.get<ProductoDto>(`/api/productos/codigo/${encodeURIComponent(codigo)}`);
  const v = dto.variantes.find((x) => x.codigoBarras === codigo);
  if (!v) throw new Error("Código no encontrado en la prenda devuelta.");
  const color = dto.colores.find((c) => c.id === v.colorId);
  return {
    productoId: dto.id,
    varianteId: v.id,
    nombre: dto.nombre,
    precio: dto.precio,
    talla: v.talla,
    colorNombre: color?.nombre ?? "",
    colorHex: color?.hex ?? "#000000",
    disponible: v.disponible,
    disponiblePorSucursal: v.disponiblePorSucursal as Record<"temixco" | "azteca", number>,
  };
}
