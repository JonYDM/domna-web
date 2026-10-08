import type {
  Clienta,
  ClientaResumen,
  FiltroClientas,
  NuevaClientaInput,
  RegistroClientaInput,
  ResumenClientas,
} from "@/types/api";
import { ApiError } from "@/lib/errores";
import type { DbState } from "./db";
import { pagado } from "./dominio";

/**
 * Reglas de clientas (puras). En el backend:
 * - El PIN se guarda como hash BCrypt y se valida con rate-limit / bloqueo tras N intentos.
 * - El teléfono es la llave de acceso (y de negocio: WhatsApp, entregas): único por boutique.
 * - La recuperación es por correo (token de un solo uso con expiración), para no pagar SMS.
 */

const DIA_MS = 86_400_000;
export const DIAS_CLIENTA_NUEVA = 7;
/** Vigencia del enlace de recuperación de PIN. */
const RECUPERACION_MIN = 30;

/** Valida un PIN de 6 dígitos. */
function normalizarPin(pin: string): string {
  const p = pin.trim();
  if (!/^\d{6}$/.test(p)) throw new ApiError(400, "El PIN debe ser de 6 dígitos.");
  return p;
}

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
  if (nombre.length < 2) throw new ApiError(400, "Escribe el nombre.");
  const apellidos = (input.apellidos ?? "").trim().replace(/\s+/g, " ");
  const telefono = normalizarTelefono(input.telefono);
  if (porTelefono(db, telefono)) throw new ApiError(409, "Ya hay una clienta con ese teléfono.");
  const email = normalizarEmail(input.email);
  if (db.clientas.some((c) => c.email === email)) throw new ApiError(409, "Ya hay una clienta con ese correo.");
  const c: Clienta = {
    id: nuevoId(db),
    nombre,
    apellidos,
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
 * Registro propio de la clienta (sign-in): nombre, apellidos, teléfono (10 díg, +52), correo y PIN.
 * El teléfono y el correo son únicos. Si el teléfono ya existía por un alta en mostrador SIN acceso
 * (sin PIN), se "reclama" esa ficha: conserva su historial y se le fija el PIN y el correo.
 */
export function registrar(db: DbState, input: RegistroClientaInput, hoy: Date): Clienta {
  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  if (nombre.length < 2) throw new ApiError(400, "Escribe tu nombre.");
  const apellidos = (input.apellidos ?? "").trim().replace(/\s+/g, " ");
  const telefono = normalizarTelefono(input.telefono);
  const email = normalizarEmail(input.email);
  const pin = normalizarPin(input.pin);

  const existentePorTel = porTelefono(db, telefono);
  // Reclamar una ficha de mostrador que todavía no tiene acceso (sin PIN).
  if (existentePorTel && !db.pins[existentePorTel.id]) {
    if (db.clientas.some((c) => c.email === email && c.id !== existentePorTel.id)) {
      throw new ApiError(409, "Ese correo ya está en uso.");
    }
    existentePorTel.nombre = nombre;
    existentePorTel.apellidos = apellidos;
    existentePorTel.email = email;
    existentePorTel.origen = "registro";
    existentePorTel.ultimoAcceso = hoy.toISOString();
    db.pins[existentePorTel.id] = pin;
    return existentePorTel;
  }
  if (existentePorTel) throw new ApiError(409, "Ya hay una cuenta con ese teléfono. Inicia sesión.");
  if (db.clientas.some((c) => c.email === email)) throw new ApiError(409, "Ese correo ya está en uso.");

  const c: Clienta = {
    id: nuevoId(db),
    nombre,
    apellidos,
    telefono,
    email,
    origen: "registro",
    creada: hoy.toISOString(),
    ultimoAcceso: hoy.toISOString(),
    penalizacionPendiente: 0,
  };
  db.clientas.unshift(c);
  db.pins[c.id] = pin;
  return c;
}

/** Iniciar sesión con teléfono + PIN. Mensaje genérico para no filtrar qué dato falló. */
export function loginConPin(db: DbState, telefono: string, pin: string, hoy: Date): Clienta {
  const tel = normalizarTelefono(telefono);
  const p = normalizarPin(pin);
  const c = porTelefono(db, tel);
  if (!c || db.pins[c.id] !== p) {
    throw new ApiError(401, "Teléfono o PIN incorrecto.");
  }
  c.ultimoAcceso = hoy.toISOString();
  return c;
}

/**
 * Olvidé mi PIN: la clienta escribe su correo y se genera un enlace/código de recuperación.
 * Devuelve el token (en la demo se muestra en pantalla; en producción se envía por correo y NO
 * se revela si el correo existe). Si el correo no existe, no lanza error: responde en silencio.
 */
export function solicitarRecuperacion(db: DbState, email: string, hoy: Date): { token: string | null } {
  const correo = normalizarEmail(email);
  const c = db.clientas.find((x) => x.email === correo);
  if (!c) return { token: null };
  const token = `rec-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 8)}`;
  db.recuperaciones[token] = {
    clientaId: c.id,
    expira: new Date(hoy.getTime() + RECUPERACION_MIN * 60_000).toISOString(),
  };
  return { token };
}

/** Confirmar la recuperación: con el token válido y vigente, fija un PIN nuevo. */
export function confirmarRecuperacion(db: DbState, token: string, pinNuevo: string, hoy: Date): Clienta {
  const r = db.recuperaciones[token.trim()];
  if (!r || new Date(r.expira) < hoy) {
    throw new ApiError(400, "El enlace de recuperación no es válido o ya venció.");
  }
  const c = db.clientas.find((x) => x.id === r.clientaId);
  if (!c) throw new ApiError(404, "Clienta no encontrada.");
  db.pins[c.id] = normalizarPin(pinNuevo);
  delete db.recuperaciones[token.trim()]; // un solo uso
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
    porOrigen: { registro: 0, mostrador: 0 },
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
