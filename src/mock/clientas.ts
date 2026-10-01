import type {
  Clienta,
  ClientaResumen,
  CuentaGoogle,
  FiltroClientas,
  NuevaClientaInput,
  ResumenClientas,
} from "@/types/api";
import { ApiError } from "@/lib/errores";
import type { DbState } from "./db";
import { pagado } from "./dominio";

/**
 * Reglas de clientas (puras). En el backend:
 * - La identidad de Google se valida con GoogleJsonWebSignature y se guarda por `sub`, no por correo.
 * - El teléfono es la llave del negocio (WhatsApp, entregas): único por boutique.
 */

const DIA_MS = 86_400_000;
export const DIAS_CLIENTA_NUEVA = 7;

/** Normaliza a "777 123 4567". Lanza 400 si no son 10 dígitos. */
export function normalizarTelefono(t: string): string {
  const d = t.replace(/\D/g, "").replace(/^52(?=\d{10}$)/, "");
  if (d.length !== 10) throw new ApiError(400, "El teléfono debe tener 10 dígitos.");
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function normalizarEmail(e: string): string {
  const v = e.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ApiError(400, "Correo inválido.");
  return v;
}

function porTelefono(db: DbState, tel: string, excepto?: string) {
  return db.clientas.find((c) => c.telefono === tel && c.id !== excepto);
}

function nuevoId(db: DbState): string {
  return `c-${Date.now().toString(36)}-${db.clientas.length}`;
}

/** Alta en mostrador (la hace la dueña o una vendedora). */
export function crearClienta(db: DbState, input: NuevaClientaInput, hoy: Date): Clienta {
  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  if (nombre.length < 3) throw new ApiError(400, "Escribe el nombre completo.");
  const telefono = normalizarTelefono(input.telefono);
  if (porTelefono(db, telefono)) throw new ApiError(409, "Ya hay una clienta con ese teléfono.");
  const email = input.email?.trim() ? normalizarEmail(input.email) : undefined;
  if (email && db.clientas.some((c) => c.email === email)) throw new ApiError(409, "Ya hay una clienta con ese correo.");
  const c: Clienta = {
    id: nuevoId(db),
    nombre,
    telefono,
    email,
    origen: "mostrador",
    creada: hoy.toISOString(),
    penalizacionPendiente: 0,
  };
  db.clientas.unshift(c);
  return c;
}

/**
 * "Continuar con Google": si ya existe una clienta con ese correo, entra; si no, se crea su cuenta
 * (sin teléfono todavía). `nueva` indica si hay que pedirle el WhatsApp.
 */
export function entrarConGoogle(db: DbState, cuenta: CuentaGoogle, hoy: Date): { clienta: Clienta; nueva: boolean } {
  const email = normalizarEmail(cuenta.email);
  const existente = db.clientas.find((c) => c.email === email);
  if (existente) {
    existente.ultimoAcceso = hoy.toISOString();
    return { clienta: existente, nueva: !existente.telefono };
  }
  const c: Clienta = {
    id: nuevoId(db),
    nombre: cuenta.nombre.trim() || email.split("@")[0],
    telefono: "",
    email,
    origen: "google",
    creada: hoy.toISOString(),
    ultimoAcceso: hoy.toISOString(),
    penalizacionPendiente: 0,
  };
  db.clientas.unshift(c);
  return { clienta: c, nueva: true };
}

/**
 * Guarda el WhatsApp de una clienta que entró con Google. Si la tienda ya la tenía dada de alta en
 * mostrador con ese teléfono (y sin correo), se ENLAZAN: se conserva la ficha de mostrador (con su
 * historial y cargos) y se le agrega el correo. Devuelve la clienta final.
 */
export function guardarTelefono(db: DbState, clientaId: string, telefono: string, hoy: Date): { clienta: Clienta; enlazada: boolean } {
  const actual = db.clientas.find((c) => c.id === clientaId);
  if (!actual) throw new ApiError(404, "Clienta no encontrada.");
  const tel = normalizarTelefono(telefono);
  const otra = porTelefono(db, tel, clientaId);
  if (!otra) {
    actual.telefono = tel;
    return { clienta: actual, enlazada: false };
  }
  if (otra.email && otra.email !== actual.email) {
    throw new ApiError(409, "Ese teléfono ya está ligado a otra cuenta. Pide ayuda en la tienda.");
  }
  // Enlazar: la ficha de mostrador absorbe la cuenta de Google.
  otra.email = actual.email;
  otra.ultimoAcceso = hoy.toISOString();
  otra.penalizacionPendiente += actual.penalizacionPendiente;
  for (const a of db.apartados) if (a.clientaId === actual.id) a.clientaId = otra.id;
  db.clientas = db.clientas.filter((c) => c.id !== actual.id);
  return { clienta: otra, enlazada: true };
}

/** Entrar con teléfono (en producción: con un código por SMS/WhatsApp). */
export function entrarConTelefono(db: DbState, telefono: string, hoy: Date): Clienta {
  const tel = normalizarTelefono(telefono);
  const c = porTelefono(db, tel);
  if (!c) throw new ApiError(404, "No encontramos ese teléfono. Entra con Google o pide tu alta en la tienda.");
  c.ultimoAcceso = hoy.toISOString();
  return c;
}

function esNueva(c: Clienta, hoy: Date): boolean {
  return hoy.getTime() - new Date(c.creada).getTime() < DIAS_CLIENTA_NUEVA * DIA_MS;
}

export function resumenDe(db: DbState, c: Clienta): ClientaResumen {
  const suyos = db.apartados.filter((a) => a.clientaId === c.id);
  const activos = suyos.filter((a) => a.estado === "activo");
  return {
    ...c,
    apartadosActivos: activos.length,
    porRecoger: suyos.filter((a) => a.estado === "liquidado" && a.estadoEntrega !== "entregado").length,
    totalComprado: suyos.filter((a) => a.estado === "liquidado").reduce((n, a) => n + a.total, 0),
    saldoPendiente: activos.reduce((n, a) => n + (a.total - pagado(a)), 0),
    pedidos: suyos.length,
    ultimoPedido: suyos.map((a) => a.creado).sort().at(-1),
  };
}

export function listarClientas(db: DbState, filtro: FiltroClientas, texto: string, hoy: Date): ClientaResumen[] {
  const t = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const digitos = t.replace(/\D/g, "");
  return db.clientas
    .map((c) => resumenDe(db, c))
    .filter((c) => {
      if (filtro === "activas" && c.apartadosActivos === 0) return false;
      if (filtro === "nuevas" && !esNueva(c, hoy)) return false;
      if (filtro === "cargo" && c.penalizacionPendiente === 0) return false;
      if (!t) return true;
      const hay = `${c.nombre} ${c.email ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return hay.includes(t) || (digitos.length >= 3 && c.telefono.replace(/\D/g, "").includes(digitos));
    })
    .sort((a, b) => (b.ultimoPedido ?? b.creada).localeCompare(a.ultimoPedido ?? a.creada));
}

export function resumenClientas(db: DbState, hoy: Date): ResumenClientas {
  const r: ResumenClientas = {
    total: db.clientas.length,
    nuevasSemana: 0,
    conApartadoActivo: 0,
    conCargo: 0,
    porOrigen: { google: 0, telefono: 0, mostrador: 0 },
  };
  const conActivo = new Set(db.apartados.filter((a) => a.estado === "activo").map((a) => a.clientaId));
  for (const c of db.clientas) {
    if (esNueva(c, hoy)) r.nuevasSemana++;
    if (conActivo.has(c.id)) r.conApartadoActivo++;
    if (c.penalizacionPendiente > 0) r.conCargo++;
    r.porOrigen[c.origen]++;
  }
  return r;
}
