/**
 * Reloj de la demo. Todo "hoy", "vence", "del mes" pasa por aquí.
 * - `ahora()` respeta un desfase en días para poder "adelantar el tiempo" en la demo
 *   (mostrar vencimientos y penalizaciones sin esperar).
 * - Los cortes de día y mes se calculan en hora de México (America/Mexico_City), igual que
 *   hará el helper HoraMexico del backend.
 */

const KEY = "domna.demo.reloj";
const DIA_MS = 86_400_000;
const ZONA = "America/Mexico_City";

function leerOffset(): number {
  if (typeof localStorage === "undefined") return 0;
  const n = Number(localStorage.getItem(KEY) ?? "0");
  return Number.isFinite(n) ? n : 0;
}

export function offsetDias(): number {
  return leerOffset();
}

export function ahora(): Date {
  return new Date(Date.now() + leerOffset() * DIA_MS);
}

export function avanzarDias(n: number): void {
  localStorage.setItem(KEY, String(leerOffset() + n));
}

export function reiniciarReloj(): void {
  localStorage.removeItem(KEY);
}

export function sumarDias(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DIA_MS);
}

/** Suma días hábiles (lunes a sábado; las boutiques abren sábado). */
export function sumarDiasHabiles(d: Date, n: number): Date {
  let r = new Date(d.getTime());
  let restantes = n;
  while (restantes > 0) {
    r = sumarDias(r, 1);
    if (diaSemanaMx(r) !== 0) restantes--;
  }
  return r;
}

const partesFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

function partesMx(d: Date) {
  const p = Object.fromEntries(partesFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), wd: p.weekday as string };
}

function diaSemanaMx(d: Date): number {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partesMx(d).wd);
}

/** Clave "YYYY-MM-DD" del día en México. */
export function claveDiaMx(d: Date): string {
  const p = partesMx(d);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function esMismoMesMx(a: Date, b: Date): boolean {
  const pa = partesMx(a);
  const pb = partesMx(b);
  return pa.y === pb.y && pa.m === pb.m;
}

/** Días calendario (en México) entre hoy y la fecha. Negativo si ya pasó. */
export function diasHasta(fechaIso: string, desde: Date = ahora()): number {
  const a = new Date(`${claveDiaMx(desde)}T00:00:00Z`).getTime();
  const b = new Date(`${claveDiaMx(new Date(fechaIso))}T00:00:00Z`).getTime();
  return Math.round((b - a) / DIA_MS);
}
