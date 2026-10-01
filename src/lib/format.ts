import { ahora, diasHasta } from "./reloj";

/** Formato con Intl nativo, es-MX y MXN. */

const mxnEntero = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const mxnDecimal = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

/** "$689" o "$294.50" (solo muestra centavos si los hay). */
export function formatMXN(n: number): string {
  return Number.isInteger(n) ? mxnEntero.format(n) : mxnDecimal.format(n);
}

const fechaFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "America/Mexico_City",
});
const fechaLargaFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Mexico_City",
});
const fechaHoraFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

/** "12 oct" */
export function formatFecha(iso: string): string {
  return fechaFmt.format(new Date(iso)).replace(".", "");
}

/** "12 oct, 14:30" */
export function formatFechaHora(iso: string): string {
  return fechaHoraFmt.format(new Date(iso)).replace(".", "");
}

/** "Jueves, 1 de octubre" (fecha de la demo). */
export function fechaHoyLarga(): string {
  const t = fechaLargaFmt.format(ahora());
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "Vence hoy", "Vence mañana", "Vence en 5 días", "Venció hace 2 días". */
export function textoVencimiento(iso: string): string {
  const d = diasHasta(iso);
  if (d < -1) return `Venció hace ${-d} días`;
  if (d === -1) return "Venció ayer";
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  return `Vence en ${d} días`;
}

export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

/** Tiempo relativo: "Ahora", "Hace 3 h", "Ayer", "Hace 4 días", o la fecha si es antiguo. */
export function formatHace(iso: string): string {
  const min = Math.floor((ahora().getTime() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  return formatFecha(iso);
}

/**
 * Para inputs de teléfono: solo dígitos, máximo 10, con formato "777 123 4567" mientras se escribe.
 * Si pegan "+52 777…" quita la lada del país.
 */
export function formatTelefonoInput(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("52")) d = d.slice(2);
  d = d.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
