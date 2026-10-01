import type { CSSProperties, ReactNode } from "react";
import {
  ArrowLeftRight,
  BellRing,
  Check,
  Clock,
  Eye,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Minus,
  NotebookPen,
  Package,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";
import { Domi } from "@/components/ilustraciones/Domi";
import { DomiImagen } from "@/components/ilustraciones/DomiImagen";
import { GoogleLogo } from "@/components/ilustraciones/GoogleLogo";
import { Logo } from "@/components/ilustraciones/Logo";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/format";
import { useContador } from "@/lib/useContador";

/** Aparición escalonada: d = orden. */
const d = (n: number) => ({ "--d": n }) as CSSProperties;

function Titulo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <header className="rev" style={d(0)}>
      <p className="text-label-sm uppercase tracking-[0.14em] text-primary-strong">{etiqueta}</p>
      <h2 className="mt-1.5 font-marca text-[28px] leading-[1.1] text-on-surface md:text-[40px]">{children}</h2>
    </header>
  );
}

function Punto({ icono: Icono, titulo, texto, n }: { icono: typeof Check; titulo: string; texto: string; n: number }) {
  return (
    <li className="rev flex gap-3" style={d(n)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
        <Icono className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block text-label-lg text-on-surface">{titulo}</span>
        <span className="block text-body-md text-on-surface-variant">{texto}</span>
      </span>
    </li>
  );
}

// ── 1. Portada ──
export function Portada() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rev flotar" style={d(0)}>
        <DomiImagen ancho={190} prioridad alt="Domi, la catarina de Domna" />
      </div>
      <div className="rev mt-4" style={d(1)}>
        <Logo className="text-[64px] md:text-[88px]" conLema />
      </div>
      <p className="rev mt-6 max-w-md text-body-lg text-on-surface-variant" style={d(3)}>
        El catálogo y los apartados de <strong className="text-on-surface">Jesly Boutique</strong>, en el celular de cada clienta.
      </p>
      <div className="rev mt-4 flex flex-wrap justify-center gap-2" style={d(4)}>
        {["Temixco", "La Azteca", "Abierta 24/7"].map((t) => (
          <span key={t} className="rounded-full bg-surface-container-lowest px-3.5 py-1.5 text-label-md shadow-soft">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 2. El problema ──
const DOLORES = [
  { icono: MessageCircle, titulo: "“¿La tienes en M?”", texto: "La misma pregunta, todo el día, por mensaje." },
  { icono: NotebookPen, titulo: "Apartados en libreta", texto: "Se olvidan, vencen y nadie avisa a tiempo." },
  { icono: Store, titulo: "Dos tiendas, un solo stock", texto: "No sabes al momento qué hay en la otra sucursal." },
  { icono: Clock, titulo: "Ventas solo cuando contestas", texto: "Si tardas en responder, la clienta se va." },
];

export function Problema() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Titulo etiqueta="Hoy">Vender por Instagram y WhatsApp cansa</Titulo>
      <ul className="grid gap-3 sm:grid-cols-2">
        {DOLORES.map((x, i) => (
          <li key={x.titulo} className="rev flex gap-3 rounded-3xl bg-surface-container-lowest p-4 shadow-soft" style={d(i + 1)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-container text-on-surface-variant">
              <x.icono className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-label-lg">{x.titulo}</span>
              <span className="block text-body-md text-on-surface-variant">{x.texto}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="rev text-body-lg text-on-surface-variant" style={d(6)}>
        Tu ropa vende. Lo que se pierde es <strong className="text-primary-strong">tiempo y apartados</strong>.
      </p>
    </div>
  );
}

// ── 3. La solución ──
const PILARES = [
  { icono: Sparkles, titulo: "Catálogo vivo", texto: "Fotos, tallas, colores y piezas reales de cada sucursal." },
  { icono: BellRing, titulo: "Apartados que se manejan solos", texto: "Anticipo, vencimiento, avisos y cobros, sin libreta." },
  { icono: LayoutDashboard, titulo: "Tu panel", texto: "Ventas, por cobrar e inventario de un vistazo." },
];

export function Solucion() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Titulo etiqueta="La solución">Domna: tu boutique, abierta en su celular</Titulo>
      <ul className="grid gap-3 md:grid-cols-3">
        {PILARES.map((x, i) => (
          <li key={x.titulo} className="rev rounded-3xl bg-surface-container-lowest p-5 shadow-soft" style={d(i + 1)}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-strong text-on-primary shadow-primary-glow">
              <x.icono className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-3 font-marca text-headline-sm">{x.titulo}</p>
            <p className="mt-1 text-body-md text-on-surface-variant">{x.texto}</p>
          </li>
        ))}
      </ul>
      <p className="rev inline-flex w-fit items-center gap-2 rounded-full bg-tinta px-4 py-2 text-label-lg text-on-primary" style={d(5)}>
        <Smartphone className="h-4 w-4" aria-hidden />
        Sin App Store: se instala desde un link
      </p>
    </div>
  );
}

// ── 4. Para tus clientas (teléfono animado) ──
const MINI = [
  { s: "vestido", hex: "#7A1E2E" },
  { s: "blusa", hex: "#E0344B" },
  { s: "pantalon", hex: "#26324D" },
  { s: "falda", hex: "#F2A7B5" },
  { s: "chamarra", hex: "#B5875A" },
  { s: "bolsa", hex: "#1F1B24" },
] as const;

function Telefono() {
  return (
    <div className="rev relative mx-auto w-[176px] shrink-0 md:w-[230px]" style={d(1)} aria-hidden>
      <div className="rounded-[34px] bg-tinta p-2 shadow-float">
        <div className="relative h-[300px] overflow-hidden rounded-[26px] bg-surface md:h-[420px]">
          <div className="relative z-10 flex items-center justify-between bg-surface px-3 pb-2 pt-3">
            <Logo className="text-[15px]" />
            <span className="h-5 w-5 rounded-full bg-primary-soft" />
          </div>
          <div className="scroll-feed grid grid-cols-2 gap-2 px-3">
            {[...MINI, ...MINI].map((m, i) => (
              <div key={i} className="overflow-hidden rounded-xl">
                <PrendaImagen silueta={m.s} hex={m.hex} alt="" />
                <div className="mt-1 h-1.5 w-3/4 rounded-full bg-surface-container-high" />
                <div className="mt-1 h-1.5 w-1/3 rounded-full bg-on-surface/70" />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-3 bottom-3">
            <div className="tap rounded-xl bg-primary-strong py-2.5 text-center text-[12px] font-bold text-on-primary shadow-primary-glow">
              Apartar · {formatMXN(345)}
            </div>
          </div>
          <div className="toast-in absolute inset-x-3 top-12 flex items-center gap-2 rounded-2xl bg-surface-container-lowest p-2.5 shadow-lift">
            <Domi size={34} expresion="enamorada" animar="ninguna" />
            <div>
              <p className="text-[12px] font-bold text-on-surface">¡Apartado listo!</p>
              <p className="text-[10px] text-on-surface-variant">Folio DOM-0021 · 15 días</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Clientas() {
  return (
    <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
      <div className="flex flex-1 flex-col gap-5">
        <Titulo etiqueta="Para tus clientas">Ve, elige y aparta en segundos</Titulo>
        <ul className="flex flex-col gap-3">
          <Punto n={2} icono={Eye} titulo="Tallas y colores disponibles" texto="Stock real por sucursal: nada de “déjame checar”." />
          <Punto n={3} icono={Tags} titulo="Compra o aparta con 50%" texto="Se la guardamos 15 días; sin anticipo, 2 días." />
          <Punto n={4} icono={BellRing} titulo="Avisos antes de que venza" texto="Dentro de la app, sin pagar por mensaje." />
          <li className="rev hidden items-center gap-2 text-body-sm text-on-surface-variant md:flex" style={d(5)}>
            <GoogleLogo className="h-4 w-4" /> Entra con Google en un toque.
          </li>
        </ul>
      </div>
      <Telefono />
    </div>
  );
}

// ── 5. Para ti (panel) ──
function Cifra({ titulo, valor, prefijo = "", destacada, n }: { titulo: string; valor: number; prefijo?: string; destacada?: boolean; n: number }) {
  const v = useContador(valor, 1300, 300 + n * 120);
  return (
    <div
      className={cn("rev rounded-2xl p-3.5 shadow-soft", destacada ? "bg-primary-strong text-on-primary" : "bg-surface-container-lowest")}
      style={d(n)}
    >
      <p className={cn("text-label-md", destacada ? "text-on-primary/85" : "text-on-surface-variant")}>{titulo}</p>
      <p className="tabular mt-0.5 text-[24px] font-bold leading-tight md:text-[28px]">
        {prefijo}
        {v.toLocaleString("es-MX")}
      </p>
    </div>
  );
}

const BARRAS = [38, 55, 42, 70, 48, 82, 100];

export function Duena() {
  return (
    <div className="flex w-full flex-col gap-5">
      <Titulo etiqueta="Para ti">Todo tu negocio en una pantalla</Titulo>
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div className="flex flex-col gap-3" aria-label="Ejemplo del panel">
          <div className="grid grid-cols-2 gap-2.5">
            <Cifra n={1} titulo="Ventas del mes" valor={28450} prefijo="$" destacada />
            <Cifra n={2} titulo="Por cobrar" valor={6200} prefijo="$" />
            <Cifra n={3} titulo="Apartados activos" valor={34} />
            <Cifra n={4} titulo="Vencen pronto" valor={5} />
          </div>
          <div className="rev rounded-2xl bg-surface-container-lowest p-3.5 shadow-soft" style={d(5)}>
            <p className="text-label-md text-on-surface-variant">Ventas de la semana</p>
            <div className="mt-2 flex h-20 items-end gap-2">
              {BARRAS.map((h, i) => (
                <span
                  key={i}
                  className={cn("barra-crece flex-1 rounded-t-md", i === BARRAS.length - 1 ? "bg-primary" : "bg-primary-rubor")}
                  style={{ height: `${h}%`, ...d(i) }}
                />
              ))}
            </div>
          </div>
          <p className="rev text-[11px] text-on-surface-variant" style={d(6)}>
            Cifras de ejemplo.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          <Punto n={3} icono={Package} titulo="Inventario de las dos tiendas" texto="Cada talla y color, en Temixco y La Azteca." />
          <Punto n={4} icono={ArrowLeftRight} titulo="Mueve piezas entre sucursales" texto="Lo apartado no se toca: cero confusiones." />
          <Punto n={5} icono={Users} titulo="Tus clientas y su historial" texto="Quién compra, quién debe y quién es nueva." />
        </ul>
      </div>
    </div>
  );
}

// ── 6. Reglas automáticas (línea de tiempo) ──
const PASOS = [
  { dia: "Día 0", titulo: "Aparta con 50%", texto: "La prenda se reserva para ella.", icono: Tags },
  { dia: "Día 12", titulo: "Aviso automático", texto: "“Tu apartado vence en 3 días”.", icono: BellRing },
  { dia: "Día 15", titulo: "Si no liquida", texto: "La prenda regresa a la tienda y queda un cargo de $30 en su siguiente compra.", icono: RefreshCw },
];

export function Automatico() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Titulo etiqueta="Trabaja sola">Lo que hoy haces de memoria, Domna lo hace sola</Titulo>
      <div className="relative">
        <div className="absolute left-5 right-5 top-5 hidden h-1 rounded-full bg-surface-container-high md:block" aria-hidden>
          <div className="linea-tiempo h-full rounded-full bg-primary" />
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {PASOS.map((p, i) => (
            <li key={p.dia} className="rev relative flex gap-3 md:flex-col" style={d(i * 3 + 1)}>
              <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-strong text-on-primary ring-4 ring-surface">
                <p.icono className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-label-sm uppercase text-primary-strong">{p.dia}</span>
                <span className="block text-label-lg">{p.titulo}</span>
                <span className="block text-body-md text-on-surface-variant">{p.texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rev flex flex-wrap gap-2" style={d(9)}>
        {["Traslado entre sucursales en 2 días", "Ofertas solo de contado", "“De vuelta en stock” automático", "Recién llegados por 7 días"].map((t) => (
          <span key={t} className="rounded-full bg-surface-container-lowest px-3.5 py-2 text-label-md shadow-soft">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 7. Comparativa ──
type Nivel = "si" | "parcial" | "no";
const FILAS: { criterio: string; libreta: Nivel; generica: Nivel; domna: Nivel }[] = [
  { criterio: "Apartados con anticipo y vencimiento", libreta: "parcial", generica: "no", domna: "si" },
  { criterio: "Stock por sucursal al momento", libreta: "no", generica: "parcial", domna: "si" },
  { criterio: "Avisos a clientas sin costo por mensaje", libreta: "no", generica: "parcial", domna: "si" },
  { criterio: "Hecha para boutique en México (MXN, apartados, 2 tiendas)", libreta: "parcial", generica: "parcial", domna: "si" },
  { criterio: "Sin comisión por cada venta", libreta: "si", generica: "parcial", domna: "si" },
];

function Celda({ v }: { v: Nivel }) {
  const Icono = v === "si" ? Check : v === "parcial" ? Minus : X;
  const etiqueta = v === "si" ? "Sí" : v === "parcial" ? "A medias" : "No";
  return (
    <td className="px-1 py-2.5 text-center">
      <span
        className={cn(
          "inline-grid h-8 w-8 place-items-center rounded-full",
          v === "si" ? "bg-success-container text-success" : v === "parcial" ? "bg-warning-container text-warning" : "bg-surface-container text-outline",
        )}
        title={etiqueta}
      >
        <Icono className="h-4 w-4" strokeWidth={3} aria-label={etiqueta} />
      </span>
    </td>
  );
}

export function Comparativa() {
  return (
    <div className="flex w-full flex-col gap-5">
      <Titulo etiqueta="Por qué Domna">Hecha para cómo vende una boutique</Titulo>
      <div className="rev overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft" style={d(1)}>
        <table className="w-full text-body-sm md:text-body-md">
          <thead>
            <tr className="border-b border-outline-variant/60 text-label-md text-on-surface-variant">
              <th className="px-3 py-3 text-left font-semibold">
                <span className="sr-only">Criterio</span>
              </th>
              <th className="w-[19%] px-1 py-3 font-semibold">Libreta + WhatsApp</th>
              <th className="w-[19%] px-1 py-3 font-semibold">Tienda en línea genérica</th>
              <th className="w-[19%] bg-primary-soft px-1 py-3 font-bold text-primary-on-soft">Domna</th>
            </tr>
          </thead>
          <tbody>
            {FILAS.map((f, i) => (
              <tr key={f.criterio} className="rev border-b border-outline-variant/40 last:border-0" style={d(i + 2)}>
                <th scope="row" className="px-3 py-2.5 text-left font-normal text-on-surface">
                  {f.criterio}
                </th>
                <Celda v={f.libreta} />
                <Celda v={f.generica} />
                <td className="bg-primary-soft/50 px-1 py-2.5 text-center">
                  <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-primary-strong text-on-primary">
                    <Check className="h-4 w-4" strokeWidth={3} aria-label="Sí" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="rev text-body-sm text-on-surface-variant" style={d(8)}>
        Las tiendas en línea genéricas suelen necesitar extensiones o pagos extra para apartados y varias sucursales.
      </p>
    </div>
  );
}

// ── 8. Valor real ──
function Grande({ valor, prefijo = "", sufijo, titulo, texto, n }: { valor: number; prefijo?: string; sufijo: string; titulo: string; texto: string; n: number }) {
  const v = useContador(valor, 1600, 350 + n * 200);
  return (
    <li className="rev rounded-3xl bg-surface-container-lowest p-5 shadow-soft" style={d(n)}>
      <p className="tabular font-marca text-[40px] leading-none text-primary-strong md:text-[48px]">
        {prefijo}
        {v.toLocaleString("es-MX")}
        <span className="ml-1 font-sans text-headline-sm text-on-surface-variant">{sufijo}</span>
      </p>
      <p className="mt-2 text-label-lg">{titulo}</p>
      <p className="text-body-md text-on-surface-variant">{texto}</p>
    </li>
  );
}

export function Valor() {
  return (
    <div className="flex w-full flex-col gap-5">
      <Titulo etiqueta="El valor real">Más ventas, menos tiempo perdido</Titulo>
      <ul className="grid gap-3 md:grid-cols-3">
        <Grande n={1} valor={6000} prefijo="$" sufijo="/mes" titulo="Apartados que no se pierden" texto="Si hoy se olvidan 10 apartados de $600 al mes, vuelven a venderse." />
        <Grande n={2} valor={30} sufijo="h/mes" titulo="Menos “¿tienes en M?”" texto="Una hora diaria menos contestando tallas y precios." />
        <Grande n={3} valor={3000} sufijo="clientas" titulo="A un link de comprar" texto="Tus seguidoras de Instagram, con catálogo y apartado directo." />
      </ul>
      <p className="rev text-[11px] text-on-surface-variant" style={d(5)}>
        Ejemplo con supuestos; con la app funcionando lo medimos con tus datos reales.
      </p>
    </div>
  );
}

// ── 9. Control ──
export function Control() {
  return (
    <div className="flex w-full flex-col gap-6 md:flex-row md:items-center md:gap-10">
      <div className="flex flex-1 flex-col gap-5">
        <Titulo etiqueta="Tú tienes el control">Tu tienda, tus reglas</Titulo>
        <ul className="grid gap-3 sm:grid-cols-2">
          <Punto n={2} icono={Lock} titulo="Catálogo público o privado" texto="Que lo vea todo Instagram, o solo tus clientas registradas." />
          <Punto n={3} icono={Eye} titulo="Ocultas una prenda en un toque" texto="Y decides cuáles se apartan y cuáles van de contado." />
          <Punto n={4} icono={ShieldCheck} titulo="Sin contraseñas" texto="Tus clientas entran con Google o su teléfono." />
          <Punto n={5} icono={Smartphone} titulo="En cualquier celular" texto="iPhone o Android, también en la compu." />
        </ul>
      </div>
      <div className="rev hidden md:block" style={d(3)}>
        <Domi size={180} expresion="guino" />
      </div>
    </div>
  );
}

// ── 10. Cómo empezamos ──
const ARRANQUE = [
  { titulo: "Configuramos tu tienda", texto: "Categorías, tallas, colores y tus dos sucursales." },
  { titulo: "Subimos tus prendas", texto: "Con fotos optimizadas para que cargue rápido." },
  { titulo: "Compartes el link", texto: "En tu bio de Instagram y con un QR en cada tienda." },
  { titulo: "Te acompañamos", texto: "Ajustes y dudas mientras arrancas." },
];

export function Empezamos() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Titulo etiqueta="Cómo empezamos">En pocos días, lista para vender</Titulo>
      <ol className="grid gap-3 md:grid-cols-4">
        {ARRANQUE.map((p, i) => (
          <li key={p.titulo} className="rev flex gap-3 rounded-3xl bg-surface-container-lowest p-4 shadow-soft md:flex-col" style={d(i + 1)}>
            <span className="tabular grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tinta font-marca text-headline-sm text-on-primary">
              {i + 1}
            </span>
            <span>
              <span className="block text-label-lg">{p.titulo}</span>
              <span className="block text-body-md text-on-surface-variant">{p.texto}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="rev inline-flex w-fit flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-primary-soft px-4 py-3 text-label-lg text-primary-on-soft" style={d(6)}>
        Implementación única + renta mensual
        <span className="text-body-md font-normal">· Sin comisión por venta</span>
      </p>
    </div>
  );
}

// ── 11. Cierre ──
export function Cierre({ onVerDemo, onRepetir }: { onVerDemo: () => void; onRepetir: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rev" style={d(0)}>
        <Domi size={170} expresion="enamorada" animar="vuela" titulo="Domi feliz" />
      </div>
      <h2 className="rev mt-4 font-marca text-[34px] leading-tight md:text-[48px]" style={d(1)}>
        ¿Le damos vida a Jesly Boutique?
      </h2>
      <p className="rev mt-2 max-w-md text-body-lg text-on-surface-variant" style={d(2)}>
        Tu estilo, apartado para cada clienta. Pruébalo tú misma en la demo.
      </p>
      <div className="rev mt-6 flex flex-wrap justify-center gap-2" style={d(3)}>
        <button
          type="button"
          onClick={onVerDemo}
          className="inline-flex h-12 items-center rounded-xl bg-primary-strong px-6 text-body-lg font-semibold text-on-primary shadow-primary-glow hover:bg-primary-hover"
        >
          Ver la demo
        </button>
        <button
          type="button"
          onClick={onRepetir}
          className="inline-flex h-12 items-center rounded-xl border border-outline-variant bg-surface-container-lowest px-5 text-body-lg font-semibold hover:bg-surface-container-low"
        >
          Ver de nuevo
        </button>
      </div>
    </div>
  );
}
