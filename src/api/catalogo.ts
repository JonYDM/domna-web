import type {
  Categoria,
  CategoriaInput,
  AgregarColorInput,
  ColorCatalogo,
  ColorInput,
  EditarProductoInput,
  FiltrosCatalogo,
  NuevoProductoInput,
  Producto,
  ProductoDetalle,
  ProductoResumen,
  Variante,
  VarianteDisponible,
} from "@/types/api";
import { http } from "./http";

/**
 * Catálogo contra el backend real (domna-api). Mismas firmas que el mock para que el selector
 * intercambie sin tocar los hooks. El backend devuelve un ProductoDto; aquí lo adaptamos a las
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

/** DTO → VarianteDisponible (sin reservas del backend aún: disponible = stock físico). */
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
    disponible: temixco + azteca,
    disponiblePorSucursal: { temixco, azteca },
    reservadoPorSucursal: { temixco: 0, azteca: 0 },
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
  const dtos = await http.get<{ id: string; nombre: string; tallas: string[]; productos: number }[]>("/api/categorias");
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
  return http.get<ColorCatalogo[]>("/api/colores");
}

export async function guardarColor(id: string | null, input: ColorInput): Promise<ColorCatalogo> {
  return id ? http.put<ColorCatalogo>(`/api/colores/${id}`, input) : http.post<ColorCatalogo>("/api/colores", input);
}

export async function eliminarColor(id: string): Promise<void> {
  await http.del<void>(`/api/colores/${id}`);
}

// ── Productos ──

export async function listarProductos(f: FiltrosCatalogo): Promise<ProductoResumen[]> {
  const dtos = await http.get<ProductoDto[]>(`/api/productos?incluirInactivos=${f.incluirInactivos ? "true" : "false"}`);
  const ahora = Date.now();
  let lista = dtos.map((p) => aProductoResumen(p, ahora));

  // Filtros del lado del cliente (el backend aún no los aplica).
  if (f.texto) {
    const t = f.texto.toLowerCase();
    lista = lista.filter((p) => p.nombre.toLowerCase().includes(t));
  }
  if (f.categoria) lista = lista.filter((p) => p.categoriaId === f.categoria);
  if (f.talla) lista = lista.filter((p) => p.tallas.includes(f.talla!));
  if (f.precioMax) lista = lista.filter((p) => p.precio <= f.precioMax!);
  if (f.orden === "precio-asc") lista.sort((a, b) => a.precio - b.precio);
  else if (f.orden === "precio-desc") lista.sort((a, b) => b.precio - a.precio);
  return lista;
}

export async function obtenerProducto(
  id: string,
  _opciones: { incluirInactivo?: boolean } = {},
): Promise<ProductoDetalle> {
  const dto = await http.get<ProductoDto>(`/api/productos/${id}`);
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
  const dto = await http.get<ProductoDto>(`/api/productos/${id}`);
  await http.put(`/api/productos/${id}`, {
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    precio: dto.precio,
    costo: dto.costo,
    precioAntes: dto.precioAntes ?? null,
    permiteApartado: permite,
  });
}
