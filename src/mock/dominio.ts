import type {
  Apartado,
  Clienta,
  CotizacionApartado,
  CrearApartadoInput,
  EstadoEntrega,
  LineaApartado,
  RegistrarAbonoInput,
  SucursalId,
  Variante,
} from "@/types/api";
import { ApiError } from "@/lib/errores";
import { sumarDias, sumarDiasHabiles } from "@/lib/reloj";
import type { ApartadoEntidad, DbState } from "./db";

/**
 * Reglas de negocio (invariantes del dominio). Funciones puras sobre el estado: es lo que
 * se portará a las entidades ricas del backend .NET (Apartado.Abonar, Liquidar, Vencer...).
 */

export const SUCURSALES: SucursalId[] = ["temixco", "azteca"];

function otra(s: SucursalId): SucursalId {
  return s === "temixco" ? "azteca" : "temixco";
}

/** Piezas reservadas de una variante en apartados ACTIVOS, por sucursal. */
export function reservado(db: DbState, varianteId: string, sucursal: SucursalId): number {
  let n = 0;
  for (const a of db.apartados) {
    if (a.estado !== "activo") continue;
    for (const l of a.lineas) {
      if (l.varianteId === varianteId && l.sucursalOrigen === sucursal) n += l.cantidad;
    }
  }
  return n;
}

/** disponible = stockFísico − reservado (nunca negativo). */
export function disponiblePorSucursal(db: DbState, v: Variante): Record<SucursalId, number> {
  return {
    temixco: Math.max(0, v.stock.temixco - reservado(db, v.id, "temixco")),
    azteca: Math.max(0, v.stock.azteca - reservado(db, v.id, "azteca")),
  };
}

export function disponibleTotal(db: DbState, v: Variante): number {
  const d = disponiblePorSucursal(db, v);
  return d.temixco + d.azteca;
}

export function buscarVariante(db: DbState, varianteId: string) {
  for (const p of db.productos) {
    const v = p.variantes.find((x) => x.id === varianteId);
    if (v) return { producto: p, variante: v };
  }
  return null;
}

export function pagado(a: ApartadoEntidad): number {
  return a.abonos.reduce((s, x) => s + x.monto, 0);
}

export function aDto(a: ApartadoEntidad): Apartado {
  const { penalizado: _p, ...resto } = a;
  const p = pagado(a);
  return { ...resto, pagado: p, saldo: Math.max(0, a.total - p) };
}

/**
 * Vence los apartados activos cuya vigencia pasó: libera el stock (deja de contar como
 * reservado) y genera la penalización para el siguiente apartado de la clienta.
 */
export function procesarVencimientos(db: DbState, hoy: Date): boolean {
  let cambio = false;
  for (const a of db.apartados) {
    if (a.estado !== "activo" || new Date(a.venceEl) > hoy) continue;
    a.estado = "vencido";
    a.cerradoEl = a.venceEl;
    if (!a.penalizado) {
      const c = db.clientas.find((x) => x.id === a.clientaId);
      if (c) c.penalizacionPendiente += db.config.penalizacion;
      a.penalizado = true;
    }
    cambio = true;
  }
  return cambio;
}

function anticipoDe(total: number, pct: number): number {
  return Math.ceil((total * pct) / 100);
}

/** Calcula el apartado sin guardarlo (lo que la clienta ve antes de confirmar). */
export function cotizar(
  db: DbState,
  clienta: Clienta,
  input: CrearApartadoInput,
  hoy: Date,
): CotizacionApartado {
  const enc = buscarVariante(db, input.varianteId);
  if (!enc || !enc.producto.activo) throw new ApiError(404, "Esa prenda ya no está disponible.");
  if (input.cantidad < 1) throw new ApiError(400, "Cantidad inválida.");

  const disp = disponiblePorSucursal(db, enc.variante);
  let origen: SucursalId | null = null;
  if (disp[input.entrega] >= input.cantidad) origen = input.entrega;
  else if (disp[otra(input.entrega)] >= input.cantidad) origen = otra(input.entrega);

  const subtotal = enc.producto.precio * input.cantidad;
  const penalizacion = clienta.penalizacionPendiente;
  const total = subtotal + penalizacion;
  const conAnticipo = input.modalidad === "anticipo";
  const vigencia = conAnticipo
    ? db.config.vigenciaConAnticipoDias
    : db.config.vigenciaSinAnticipoDias;
  const requiereTraslado = origen !== null && origen !== input.entrega;

  return {
    subtotal,
    penalizacion,
    total,
    anticipo: conAnticipo ? anticipoDe(total, db.config.anticipoPct) : 0,
    venceEl: sumarDias(hoy, vigencia).toISOString(),
    requiereTraslado,
    listoEstimado: (requiereTraslado
      ? sumarDiasHabiles(hoy, db.config.diasTraslado)
      : hoy
    ).toISOString(),
    sucursalOrigen: origen,
  };
}

export function crearApartado(
  db: DbState,
  clientaId: string,
  input: CrearApartadoInput,
  hoy: Date,
): ApartadoEntidad {
  if (db.config.suspendida) throw new ApiError(423, "La tienda está en pausa por el momento.");
  const clienta = db.clientas.find((c) => c.id === clientaId);
  if (!clienta) throw new ApiError(404, "Clienta no encontrada.");

  const activos = db.apartados.filter(
    (a) => a.clientaId === clientaId && a.estado === "activo",
  ).length;
  if (activos >= db.config.limiteApartadosActivos) {
    throw new ApiError(
      400,
      `Ya tienes ${activos} apartados activos. Liquida uno para apartar otra prenda.`,
    );
  }

  const cot = cotizar(db, clienta, input, hoy);
  if (!cot.sucursalOrigen) throw new ApiError(409, "Ya no hay stock de esa talla. Elige otra.");

  const { producto, variante } = buscarVariante(db, input.varianteId)!;
  const color = producto.colores.find((c) => c.id === variante.colorId)!;
  const linea: LineaApartado = {
    varianteId: variante.id,
    productoId: producto.id,
    nombre: producto.nombre,
    silueta: producto.silueta,
    talla: variante.talla,
    colorNombre: color.nombre,
    colorHex: color.hex,
    precio: producto.precio, // precio congelado
    cantidad: input.cantidad,
    sucursalOrigen: cot.sucursalOrigen,
  };

  db.folioSeq += 1;
  const a: ApartadoEntidad = {
    id: `ap_${db.folioSeq}_${Math.random().toString(36).slice(2, 7)}`,
    folio: `DOM-${String(db.folioSeq).padStart(4, "0")}`,
    clientaId,
    clientaNombre: clienta.nombre,
    clientaTelefono: clienta.telefono,
    lineas: [linea],
    subtotal: cot.subtotal,
    penalizacion: cot.penalizacion,
    total: cot.total,
    modalidad: input.modalidad,
    entrega: input.entrega,
    requiereTraslado: cot.requiereTraslado,
    estadoEntrega: cot.requiereTraslado ? "en_origen" : "listo",
    abonos: [],
    creado: hoy.toISOString(),
    venceEl: cot.venceEl,
    listoEstimado: cot.listoEstimado,
    estado: "activo",
    penalizado: false,
  };
  if (cot.anticipo > 0) {
    a.abonos.push({
      id: `ab_${Date.now()}`,
      monto: cot.anticipo,
      fecha: hoy.toISOString(),
      metodo: input.metodoAnticipo ?? "transferencia",
      concepto: "anticipo",
    });
  }
  // La penalización pendiente se cobra en este apartado.
  clienta.penalizacionPendiente = 0;
  db.apartados.unshift(a);
  return a;
}

function obtener(db: DbState, id: string): ApartadoEntidad {
  const a = db.apartados.find((x) => x.id === id);
  if (!a) throw new ApiError(404, "Apartado no encontrado.");
  return a;
}

/** Abonar. Si el saldo llega a 0 se LIQUIDA: la reserva se convierte en venta. */
export function abonar(db: DbState, input: RegistrarAbonoInput, hoy: Date): ApartadoEntidad {
  const a = obtener(db, input.apartadoId);
  if (a.estado !== "activo") throw new ApiError(400, "El apartado ya no está activo.");
  const saldo = a.total - pagado(a);
  if (!(input.monto > 0) || input.monto > saldo) throw new ApiError(400, "Monto inválido.");

  const liquida = input.monto === saldo;
  a.abonos.push({
    id: `ab_${Date.now()}`,
    monto: input.monto,
    fecha: hoy.toISOString(),
    metodo: input.metodo,
    concepto: liquida ? "liquidacion" : "abono",
  });
  // Un abono convierte el "sin anticipo" (2 días) en vigencia completa.
  if (a.modalidad === "sin_anticipo" && !liquida) {
    a.modalidad = "anticipo";
    a.venceEl = sumarDias(hoy, db.config.vigenciaConAnticipoDias).toISOString();
  }
  if (liquida) liquidar(db, a, hoy);
  return a;
}

function liquidar(db: DbState, a: ApartadoEntidad, hoy: Date) {
  for (const l of a.lineas) {
    const enc = buscarVariante(db, l.varianteId);
    if (enc) enc.variante.stock[l.sucursalOrigen] -= l.cantidad; // descuenta stock físico
  }
  a.estado = "liquidado";
  a.cerradoEl = hoy.toISOString();
}

/** Cancelar no borra: cambia el estado y libera el stock. El anticipo no se devuelve. */
export function cancelar(db: DbState, id: string, hoy: Date): ApartadoEntidad {
  const a = obtener(db, id);
  if (a.estado !== "activo") throw new ApiError(400, "Solo se cancelan apartados activos.");
  a.estado = "cancelado";
  a.cerradoEl = hoy.toISOString();
  return a;
}

export function avanzarEntrega(db: DbState, id: string, siguiente: EstadoEntrega): ApartadoEntidad {
  const a = obtener(db, id);
  if (a.estado === "cancelado" || a.estado === "vencido") {
    throw new ApiError(400, "Ese apartado ya está cerrado.");
  }
  if (siguiente === "entregado" && a.estado !== "liquidado") {
    throw new ApiError(400, "Se entrega cuando el apartado está liquidado.");
  }
  a.estadoEntrega = siguiente;
  return a;
}
