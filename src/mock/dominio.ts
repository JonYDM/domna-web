import type {
  Apartado,
  Aviso,
  CambioStock,
  Clienta,
  CotizacionApartado,
  CrearApartadoInput,
  EstadoEntrega,
  LineaApartado,
  MotivoAjuste,
  MovimientoInventario,
  Novedad,
  Producto,
  RegistrarAbonoInput,
  SucursalId,
  Variante,
} from "@/types/api";
import { ApiError } from "@/lib/errores";
import { formatFecha, formatMXN } from "@/lib/format";
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

// ── Novedades: "Nuevo" y "De vuelta en stock" se DERIVAN de fechas; caducan solas. ──

const DIA_MS = 86_400_000;

function dentroDe(fechaIso: string | undefined, dias: number, hoy: Date): boolean {
  if (!fechaIso) return false;
  const t = hoy.getTime() - new Date(fechaIso).getTime();
  return t >= 0 && t < dias * DIA_MS;
}

export function novedad(db: DbState, p: Producto, hoy: Date): Novedad {
  const dias = db.config.diasNovedad;
  const nuevo = dentroDe(p.creado, dias, hoy);
  const hayStock = p.variantes.some((v) => disponibleTotal(db, v) > 0);
  // Si es nuevo, ya sale en "Nuevos": no se duplica en "De vuelta".
  return { nuevo, reabastecido: !nuevo && hayStock && dentroDe(p.reabastecidoEl, dias, hoy) };
}

/**
 * Ajusta el stock físico. Si la variante estaba AGOTADA (disponible 0) y vuelve a tener piezas,
 * el producto queda "reabastecido" hoy. No se puede bajar por debajo de lo apartado.
 */
export function ajustarStock(db: DbState, varianteId: string, sucursal: SucursalId, delta: number, hoy: Date) {
  const enc = buscarVariante(db, varianteId);
  if (!enc) throw new ApiError(404, "Variante no encontrada.");
  const antes = disponibleTotal(db, enc.variante);
  const nuevo = enc.variante.stock[sucursal] + delta;
  if (nuevo < reservado(db, varianteId, sucursal)) {
    throw new ApiError(409, "No puedes bajar el stock por debajo de lo apartado.");
  }
  enc.variante.stock[sucursal] = nuevo;
  if (antes === 0 && disponibleTotal(db, enc.variante) > 0) enc.producto.reabastecidoEl = hoy.toISOString();
  return enc;
}

function registrarMovimiento(db: DbState, m: Omit<MovimientoInventario, "id">) {
  (db.movimientos ??= []).unshift({ ...m, id: `mv_${Date.now().toString(36)}_${db.movimientos.length}` });
}

/**
 * Guarda varios cambios de stock de un producto con un motivo. Todo o nada: primero valida todo
 * (entero ≥ 0 y ≥ lo apartado) y solo si todo es válido aplica. Usa valores absolutos.
 */
export function guardarStockLote(
  db: DbState,
  productoId: string,
  cambios: CambioStock[],
  motivo: MotivoAjuste,
  hoy: Date,
): number {
  const producto = db.productos.find((p) => p.id === productoId);
  if (!producto) throw new ApiError(404, "Producto no encontrado.");
  if (!cambios.length) throw new ApiError(400, "No hay cambios que guardar.");
  const validos = cambios.map((c) => {
    const v = producto.variantes.find((x) => x.id === c.varianteId);
    if (!v) throw new ApiError(404, "Variante no encontrada.");
    if (!Number.isInteger(c.nuevo) || c.nuevo < 0 || c.nuevo > 999) throw new ApiError(400, "Cantidad inválida.");
    const apartadas = reservado(db, v.id, c.sucursal);
    if (c.nuevo < apartadas) {
      throw new ApiError(409, `Talla ${v.talla}: no puedes dejar menos de ${apartadas} (están apartadas).`);
    }
    return { v, c };
  });
  for (const { v, c } of validos) {
    const delta = c.nuevo - v.stock[c.sucursal];
    if (delta === 0) continue;
    ajustarStock(db, v.id, c.sucursal, delta, hoy);
    registrarMovimiento(db, { fecha: hoy.toISOString(), productoId, varianteId: v.id, sucursal: c.sucursal, delta, motivo });
  }
  return validos.length;
}

/** Mueve piezas DISPONIBLES de una sucursal a otra (las apartadas no se mueven). */
export function moverStock(db: DbState, varianteId: string, desde: SucursalId, cantidad: number, hoy: Date) {
  const enc = buscarVariante(db, varianteId);
  if (!enc) throw new ApiError(404, "Variante no encontrada.");
  const hacia = otra(desde);
  const libres = enc.variante.stock[desde] - reservado(db, varianteId, desde);
  if (!Number.isInteger(cantidad) || cantidad < 1) throw new ApiError(400, "Cantidad inválida.");
  if (cantidad > libres) throw new ApiError(409, `Solo hay ${libres} disponibles para mover.`);
  enc.variante.stock[desde] -= cantidad;
  enc.variante.stock[hacia] += cantidad;
  const base = { fecha: hoy.toISOString(), productoId: enc.producto.id, varianteId, motivo: "traspaso" as const };
  registrarMovimiento(db, { ...base, sucursal: desde, delta: -cantidad });
  registrarMovimiento(db, { ...base, sucursal: hacia, delta: cantidad });
  return enc;
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
  const compra = input.modalidad === "compra";
  const conAnticipo = input.modalidad === "anticipo";
  const vigencia = compra
    ? 0
    : conAnticipo
      ? db.config.vigenciaConAnticipoDias
      : db.config.vigenciaSinAnticipoDias;
  const requiereTraslado = origen !== null && origen !== input.entrega;

  return {
    subtotal,
    penalizacion,
    total,
    anticipo: compra ? total : conAnticipo ? anticipoDe(total, db.config.anticipoPct) : 0,
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

  const compra = input.modalidad === "compra";
  const enc = buscarVariante(db, input.varianteId);
  if (!compra && enc && !enc.producto.permiteApartado) {
    throw new ApiError(400, "Esta prenda solo se vende de contado.");
  }

  // El límite de apartados activos no aplica a compras (no reservan: se venden al momento).
  if (!compra) {
    const activos = db.apartados.filter(
      (a) => a.clientaId === clientaId && a.estado === "activo",
    ).length;
    if (activos >= db.config.limiteApartadosActivos) {
      throw new ApiError(
        400,
        `Ya tienes ${activos} apartados activos. Liquida uno para apartar otra prenda.`,
      );
    }
  }

  const cot = cotizar(db, clienta, input, hoy);
  if (!cot.sucursalOrigen) throw new ApiError(409, "Ya no hay stock de esa talla. Elige otra.");

  const { producto, variante } = enc!;
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
      concepto: compra ? "compra" : "anticipo",
    });
  }
  // Compra: pago completo → venta directa, descuenta stock físico al confirmarse.
  if (compra) liquidar(db, a, hoy);
  // La penalización pendiente se cobra en esta compra o apartado.
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

// ── Avisos in-app: se DERIVAN del estado de los pedidos (no hay que "programar" envíos). ──

/** Días antes del vencimiento en que la clienta empieza a ver el aviso. */
export const DIAS_AVISO_VENCE = 3;

function nombreSucursal(s: SucursalId): string {
  return s === "temixco" ? "Temixco" : "La Azteca";
}

function diasCalendario(desde: Date, hastaIso: string): number {
  return Math.round((new Date(hastaIso).getTime() - desde.getTime()) / DIA_MS);
}

export function avisosDe(db: DbState, clientaId: string, hoy: Date): Aviso[] {
  const leidos = new Set(db.avisosLeidos[clientaId] ?? []);
  const avisos: Omit<Aviso, "leido">[] = [];

  for (const a of db.apartados) {
    if (a.clientaId !== clientaId || new Date(a.creado) > hoy) continue;
    const prenda = a.lineas[0]?.nombre ?? "tu prenda";
    const saldo = a.total - pagado(a);

    if (a.estado === "activo") {
      const dias = diasCalendario(hoy, a.venceEl);
      if (dias <= DIAS_AVISO_VENCE) {
        const cuando = dias <= 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`;
        const desde = new Date(new Date(a.venceEl).getTime() - DIAS_AVISO_VENCE * DIA_MS);
        avisos.push({
          id: `por_vencer:${a.id}`,
          tipo: "por_vencer",
          titulo: `Tu apartado vence ${cuando}`,
          texto: `${prenda} · saldo ${formatMXN(saldo)}. Abona en tienda o por transferencia con tu folio ${a.folio}.`,
          fecha: (desde > new Date(a.creado) ? desde : new Date(a.creado)).toISOString(),
          urgente: true,
          apartadoId: a.id,
        });
      }
    }

    if (a.estado === "vencido" && a.cerradoEl) {
      avisos.push({
        id: `vencido:${a.id}`,
        tipo: "vencido",
        titulo: "Tu apartado venció",
        texto: `${prenda} regresó a la tienda. Se sumará un cargo de ${formatMXN(db.config.penalizacion)} a tu siguiente compra o apartado.`,
        fecha: a.cerradoEl,
        urgente: false,
        apartadoId: a.id,
      });
    }

    // Abonos que registró la tienda (el anticipo o la compra los hizo ella misma).
    for (const ab of a.abonos) {
      if (ab.concepto !== "abono" && ab.concepto !== "liquidacion") continue;
      if (new Date(ab.fecha) > hoy) continue;
      avisos.push({
        id: `abono:${a.id}:${ab.id}`,
        tipo: "abono",
        titulo: ab.concepto === "liquidacion" ? "¡Liquidaste tu apartado!" : `Recibimos tu abono de ${formatMXN(ab.monto)}`,
        texto:
          ab.concepto === "liquidacion"
            ? `${prenda} ya es tuya. Folio ${a.folio}.`
            : `${prenda} · te quedan ${formatMXN(Math.max(0, saldo))} por pagar.`,
        fecha: ab.fecha,
        urgente: false,
        apartadoId: a.id,
      });
    }

    if (a.estadoEntrega === "en_traslado" && a.estado !== "cancelado" && a.estado !== "vencido") {
      avisos.push({
        id: `traslado:${a.id}`,
        tipo: "traslado",
        titulo: `Tu prenda va en camino a ${nombreSucursal(a.entrega)}`,
        texto: `${prenda} · llega aprox. el ${formatFecha(a.listoEstimado)}.`,
        fecha: a.creado,
        urgente: false,
        apartadoId: a.id,
      });
    }

    if (a.estado === "liquidado" && a.estadoEntrega === "listo") {
      const fecha = [a.cerradoEl ?? a.creado, a.listoEstimado].sort().at(-1)!;
      avisos.push({
        id: `lista:${a.id}`,
        tipo: "lista",
        titulo: "¡Tu prenda está lista para recoger!",
        texto: `${prenda} te espera en ${nombreSucursal(a.entrega)}. Muestra tu folio ${a.folio}.`,
        fecha,
        urgente: false,
        apartadoId: a.id,
      });
    }
  }

  return avisos
    .filter((x) => new Date(x.fecha) <= hoy)
    .map((x) => ({ ...x, leido: leidos.has(x.id) }))
    .sort((x, y) => Number(y.urgente && !y.leido) - Number(x.urgente && !x.leido) || y.fecha.localeCompare(x.fecha));
}

export function marcarAvisosLeidos(db: DbState, clientaId: string, ids: string[]): void {
  const s = new Set(db.avisosLeidos[clientaId] ?? []);
  ids.forEach((id) => s.add(id));
  db.avisosLeidos[clientaId] = [...s];
}
