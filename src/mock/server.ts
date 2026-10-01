import type {
  Apartado,
  Categoria,
  Clienta,
  ConfigBoutique,
  CotizacionApartado,
  CrearApartadoInput,
  EstadoEntrega,
  FiltroEstadoApartado,
  FiltrosCatalogo,
  Metricas,
  NuevoProductoInput,
  Producto,
  ProductoDetalle,
  ProductoResumen,
  RegistrarAbonoInput,
} from "@/types/api";
import { ApiError } from "@/lib/errores";
import { STOCK_BAJO } from "@/lib/enums";
import {
  ahora,
  avanzarDias,
  claveDiaMx,
  diasHasta,
  esMismoMesMx,
  reiniciarReloj,
  sumarDias,
} from "@/lib/reloj";
import { borrar, cargar, guardar, type DbState } from "./db";
import * as dom from "./dominio";
import { crearSeed } from "./seed";

/**
 * Mock service layer: simula el API REST del backend (.NET) con latencia, errores
 * (400/404/409/423) y persistencia en localStorage. Mismo contrato que src/types/api.ts.
 * Para conectar el backend real: reimplementar estas funciones con fetch, sin tocar páginas.
 */

let db: DbState | null = null;

function estado(): DbState {
  if (!db) {
    db = cargar() ?? crearSeed(ahora());
    guardar(db);
  }
  // Toda lectura ignora apartados vencidos aunque el "job" no haya corrido.
  if (dom.procesarVencimientos(db, ahora())) guardar(db);
  return db;
}

function persistir() {
  if (db) guardar(db);
}

const esperar = (min = 220, max = 520) =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

/** Clona para que la UI nunca mute el "servidor". */
const copia = <T,>(x: T): T => structuredClone(x);

async function responder<T>(fn: () => T, lento = false): Promise<T> {
  await esperar(lento ? 600 : 220, lento ? 1000 : 520);
  return copia(fn());
}

// ── Boutique ──

export function obtenerConfig(): Promise<ConfigBoutique> {
  return responder(() => estado().config);
}

export function obtenerCategorias(): Promise<Categoria[]> {
  return responder(() => estado().categorias);
}

// ── Catálogo ──

function resumen(s: DbState, p: Producto): ProductoResumen {
  return {
    id: p.id,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    silueta: p.silueta,
    precio: p.precio,
    precioAntes: p.precioAntes,
    nuevo: p.nuevo,
    activo: p.activo,
    colores: p.colores,
    tallas: p.tallas,
    imagenes: p.imagenes,
    disponibleTotal: p.variantes.reduce((n, v) => n + dom.disponibleTotal(s, v), 0),
    stockFisicoTotal: p.variantes.reduce((n, v) => n + v.stock.temixco + v.stock.azteca, 0),
  };
}

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function listarProductos(f: FiltrosCatalogo): Promise<ProductoResumen[]> {
  return responder(() => {
    const s = estado();
    const texto = f.texto ? normalizar(f.texto.trim()) : "";
    let lista = s.productos.filter((p) => {
      if (!f.incluirInactivos && !p.activo) return false;
      if (f.categoria && p.categoriaId !== f.categoria) return false;
      if (f.precioMax && p.precio > f.precioMax) return false;
      if (texto) {
        const cat = s.categorias.find((c) => c.id === p.categoriaId)?.nombre ?? "";
        const hay = normalizar(`${p.nombre} ${cat} ${p.colores.map((c) => c.nombre).join(" ")}`);
        if (!texto.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      // Talla y color: solo si hay al menos una variante DISPONIBLE que cumpla ambos.
      if (f.talla || f.color) {
        const ok = p.variantes.some((v) => {
          if (f.talla && v.talla !== f.talla) return false;
          if (f.color && p.colores.find((c) => c.id === v.colorId)?.familia !== f.color) return false;
          return dom.disponibleTotal(s, v) > 0;
        });
        if (!ok) return false;
      }
      return true;
    });
    const orden = f.orden ?? "nuevos";
    lista = [...lista].sort((a, b) => {
      if (orden === "precio-asc") return a.precio - b.precio || a.nombre.localeCompare(b.nombre);
      if (orden === "precio-desc") return b.precio - a.precio || a.nombre.localeCompare(b.nombre);
      return b.creado.localeCompare(a.creado) || a.nombre.localeCompare(b.nombre);
    });
    return lista.map((p) => resumen(s, p));
  });
}

export function obtenerProducto(id: string, { incluirInactivo = false } = {}): Promise<ProductoDetalle> {
  return responder(() => {
    const s = estado();
    const p = s.productos.find((x) => x.id === id);
    if (!p || (!p.activo && !incluirInactivo)) throw new ApiError(404, "No encontramos esa prenda.");
    return {
      ...p,
      variantes: p.variantes.map((v) => {
        const porSuc = dom.disponiblePorSucursal(s, v);
        return { ...v, disponiblePorSucursal: porSuc, disponible: porSuc.temixco + porSuc.azteca };
      }),
    };
  });
}

// ── Tienda (clienta) ──

function clientaDe(s: DbState, id: string): Clienta {
  const c = s.clientas.find((x) => x.id === id);
  if (!c) throw new ApiError(404, "Clienta no encontrada.");
  return c;
}

export function obtenerClienta(id: string): Promise<Clienta> {
  return responder(() => clientaDe(estado(), id));
}

export function cotizarApartado(clientaId: string, input: CrearApartadoInput): Promise<CotizacionApartado> {
  return responder(() => {
    const s = estado();
    return dom.cotizar(s, clientaDe(s, clientaId), input, ahora());
  });
}

export async function crearApartado(clientaId: string, input: CrearApartadoInput): Promise<Apartado> {
  // Apartar NO es optimista: espera al "servidor" (valida stock en transacción).
  return responder(() => {
    const a = dom.crearApartado(estado(), clientaId, input, ahora());
    persistir();
    return dom.aDto(a);
  }, true);
}

export function misApartados(clientaId: string): Promise<Apartado[]> {
  return responder(() =>
    estado()
      .apartados.filter((a) => a.clientaId === clientaId)
      .map(dom.aDto),
  );
}

// ── Panel de la dueña ──

function porVencer(a: { estado: string; venceEl: string }): boolean {
  return a.estado === "activo" && diasHasta(a.venceEl) <= 3;
}

export function listarApartados(filtro?: FiltroEstadoApartado, texto?: string): Promise<Apartado[]> {
  return responder(() => {
    const t = texto ? normalizar(texto.trim()) : "";
    return estado()
      .apartados.filter((a) => {
        if (filtro === "por_vencer" && !porVencer(a)) return false;
        if (filtro && filtro !== "por_vencer" && a.estado !== filtro) return false;
        if (t) {
          const hay = normalizar(`${a.folio} ${a.clientaNombre} ${a.clientaTelefono} ${a.lineas.map((l) => l.nombre).join(" ")}`);
          if (!hay.includes(t)) return false;
        }
        return true;
      })
      .sort((a, b) =>
        filtro === "por_vencer" ? a.venceEl.localeCompare(b.venceEl) : b.creado.localeCompare(a.creado),
      )
      .map(dom.aDto);
  });
}

export function obtenerApartado(id: string): Promise<Apartado> {
  return responder(() => {
    const a = estado().apartados.find((x) => x.id === id);
    if (!a) throw new ApiError(404, "Apartado no encontrado.");
    return dom.aDto(a);
  });
}

export function registrarAbono(input: RegistrarAbonoInput): Promise<Apartado> {
  return responder(() => {
    const a = dom.abonar(estado(), input, ahora());
    persistir();
    return dom.aDto(a);
  }, true);
}

export function cancelarApartado(id: string): Promise<Apartado> {
  return responder(() => {
    const a = dom.cancelar(estado(), id, ahora());
    persistir();
    return dom.aDto(a);
  });
}

export function avanzarEntrega(id: string, siguiente: EstadoEntrega): Promise<Apartado> {
  return responder(() => {
    const a = dom.avanzarEntrega(estado(), id, siguiente);
    persistir();
    return dom.aDto(a);
  });
}

export function obtenerMetricas(): Promise<Metricas> {
  return responder(() => {
    const s = estado();
    const hoy = ahora();
    const activos = s.apartados.filter((a) => a.estado === "activo");
    const liquidados = s.apartados.filter((a) => a.estado === "liquidado");
    const delMes = liquidados.filter((a) => a.cerradoEl && esMismoMesMx(new Date(a.cerradoEl), hoy));
    const cerrados = s.apartados.filter((a) => a.estado !== "activo");

    const stockBajo = s.productos
      .filter((p) => p.activo)
      .flatMap((p) =>
        p.variantes.map((v) => {
          const c = p.colores.find((x) => x.id === v.colorId)!;
          return {
            productoId: p.id,
            nombre: p.nombre,
            talla: v.talla,
            colorNombre: c.nombre,
            colorHex: c.hex,
            disponible: dom.disponibleTotal(s, v),
          };
        }),
      )
      .filter((x) => x.disponible <= STOCK_BAJO)
      .sort((a, b) => a.disponible - b.disponible);

    const unidades = new Map<string, Metricas["topProductos"][number]>();
    for (const a of [...liquidados, ...activos]) {
      for (const l of a.lineas) {
        const u = unidades.get(l.productoId) ?? {
          productoId: l.productoId,
          nombre: l.nombre,
          silueta: l.silueta,
          colorHex: l.colorHex,
          unidades: 0,
        };
        u.unidades += l.cantidad;
        unidades.set(l.productoId, u);
      }
    }

    const ventasUltimos7 = Array.from({ length: 7 }, (_, i) => {
      const dia = claveDiaMx(sumarDias(hoy, i - 6));
      const total = liquidados
        .filter((a) => a.cerradoEl && claveDiaMx(new Date(a.cerradoEl)) === dia)
        .reduce((n, a) => n + a.total, 0);
      return { dia, total };
    });

    return {
      apartadosActivos: activos.length,
      montoActivos: activos.reduce((n, a) => n + a.total, 0),
      saldoPorCobrar: activos.reduce((n, a) => n + (a.total - dom.pagado(a)), 0),
      porVencer: activos.filter(porVencer).length,
      ventasMes: delMes.reduce((n, a) => n + a.total, 0),
      piezasVendidasMes: delMes.reduce((n, a) => n + a.lineas.reduce((m, l) => m + l.cantidad, 0), 0),
      conversion: cerrados.length ? Math.round((liquidados.length / cerrados.length) * 100) : 0,
      penalizacionesMes:
        s.apartados.filter(
          (a) => a.estado === "vencido" && a.cerradoEl && esMismoMesMx(new Date(a.cerradoEl), hoy),
        ).length * s.config.penalizacion,
      stockBajo,
      topProductos: [...unidades.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5),
      ventasUltimos7,
    };
  });
}

export function crearProducto(input: NuevoProductoInput): Promise<Producto> {
  return responder(() => {
    const s = estado();
    if (!input.nombre.trim()) throw new ApiError(400, "Ponle nombre a la prenda.");
    if (!(input.precio > 0)) throw new ApiError(400, "El precio debe ser mayor a 0.");
    const base =
      input.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "prenda";
    const id = s.productos.some((p) => p.id === base) ? `${base}-${Date.now() % 10000}` : base;
    const colores = input.colores.map((c, i) => ({ ...c, id: `${id}-c${i}` }));
    const p: Producto = {
      id,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion.trim(),
      categoriaId: input.categoriaId,
      silueta: input.silueta,
      precio: input.precio,
      activo: true,
      nuevo: true,
      colores,
      tallas: input.tallas,
      variantes: colores.flatMap((c, ci) =>
        input.tallas.map((t) => {
          const n = Math.max(0, Math.floor(input.stock[t]?.[ci] ?? 0));
          return {
            id: `${c.id}-${t.toLowerCase()}`,
            productoId: id,
            talla: t,
            colorId: c.id,
            sku: `${id.slice(0, 6).toUpperCase()}-${c.nombre.slice(0, 3).toUpperCase()}-${t}`,
            stock: { temixco: input.sucursal === "temixco" ? n : 0, azteca: input.sucursal === "azteca" ? n : 0 },
          };
        }),
      ),
      imagenes: [],
      creado: ahora().toISOString(),
    };
    s.productos.unshift(p);
    persistir();
    return p;
  }, true);
}

export function cambiarEstadoProducto(id: string, activo: boolean): Promise<void> {
  return responder(() => {
    const p = estado().productos.find((x) => x.id === id);
    if (!p) throw new ApiError(404, "Producto no encontrado.");
    p.activo = activo;
    persistir();
  });
}

export function ajustarStock(varianteId: string, sucursal: "temixco" | "azteca", delta: number): Promise<void> {
  return responder(() => {
    const s = estado();
    const enc = dom.buscarVariante(s, varianteId);
    if (!enc) throw new ApiError(404, "Variante no encontrada.");
    const nuevo = enc.variante.stock[sucursal] + delta;
    if (nuevo < dom.reservado(s, varianteId, sucursal)) {
      throw new ApiError(409, "No puedes bajar el stock por debajo de lo apartado.");
    }
    enc.variante.stock[sucursal] = nuevo;
    persistir();
  });
}

// ── Controles de la demo ──

export function demoAvanzarDias(dias: number): Promise<void> {
  return responder(() => {
    avanzarDias(dias);
    estado(); // procesa vencimientos con la nueva fecha
  });
}

export function demoSuspender(suspendida: boolean): Promise<void> {
  return responder(() => {
    estado().config.suspendida = suspendida;
    persistir();
  });
}

export function demoReiniciar(): Promise<void> {
  return responder(() => {
    borrar();
    reiniciarReloj();
    db = null;
    estado();
  });
}
