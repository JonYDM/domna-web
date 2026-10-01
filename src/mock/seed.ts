import type {
  Categoria,
  Clienta,
  ColorProducto,
  ConfigBoutique,
  FamiliaColor,
  MetodoPago,
  ModalidadApartado,
  Producto,
  Silueta,
  SucursalId,
} from "@/types/api";
import { TALLAS_NUMERICAS, TALLAS_ROPA, TALLA_UNICA } from "@/lib/enums";
import { sumarDias } from "@/lib/reloj";
import { DB_VERSION, type DbState } from "./db";
import { abonar, crearApartado, disponiblePorSucursal } from "./dominio";

/** Datos de la demo: Jesly Boutique (Temixco / La Azteca). Determinístico (misma semilla). */

function rng(semilla: number) {
  let s = semilla;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const C: Record<string, [string, string, FamiliaColor]> = {
  negro: ["Negro", "#1F1B24", "negro"],
  blanco: ["Blanco", "#F6F3EE", "blanco"],
  marfil: ["Marfil", "#EFE7D8", "blanco"],
  champana: ["Champaña", "#E3CFAF", "beige"],
  beige: ["Arena", "#D9C4A5", "beige"],
  camel: ["Camel", "#B5875A", "cafe"],
  chocolate: ["Chocolate", "#5C3B2E", "cafe"],
  gris: ["Gris perla", "#A9A3AC", "gris"],
  vino: ["Vino", "#7A1E2E", "rojo"],
  rojo: ["Rojo Domna", "#E0344B", "rojo"],
  rosa: ["Rosa", "#F2A7B5", "rosa"],
  rosapalo: ["Rosa palo", "#E7C3C0", "rosa"],
  cielo: ["Azul cielo", "#A9C6E8", "azul"],
  mezclilla: ["Mezclilla", "#4A6A92", "azul"],
  mezclillaClara: ["Mezclilla clara", "#8FAACB", "azul"],
  marino: ["Azul marino", "#26324D", "azul"],
  olivo: ["Verde olivo", "#6B7046", "verde"],
  esmeralda: ["Esmeralda", "#2F6B4F", "verde"],
};

interface Def {
  nombre: string;
  descripcion: string;
  categoriaId: string;
  silueta: Silueta;
  precio: number;
  precioAntes?: number;
  nuevo?: boolean;
  colores: (keyof typeof C)[];
  tallas: string[];
}

const DEFS: Def[] = [
  { nombre: "Vestido midi satinado Lucía", descripcion: "Satín con caída suave, escote en V y tirantes ajustables. Ideal para boda o cena.", categoriaId: "vestidos", silueta: "vestido", precio: 689, nuevo: true, colores: ["vino", "negro", "champana"], tallas: TALLAS_ROPA },
  { nombre: "Vestido floral Primavera", descripcion: "Gasa ligera con forro, cintura elástica y largo a la rodilla.", categoriaId: "vestidos", silueta: "vestido", precio: 549, colores: ["rosa", "cielo"], tallas: TALLAS_ROPA },
  { nombre: "Vestido camisero Elena", descripcion: "Algodón con botones al frente y cinturón del mismo tono.", categoriaId: "vestidos", silueta: "vestido", precio: 599, colores: ["blanco", "olivo"], tallas: TALLAS_ROPA },
  { nombre: "Vestido de punto Marina", descripcion: "Tejido de punto acanalado que estiliza. Cómodo todo el día.", categoriaId: "vestidos", silueta: "vestido", precio: 499, precioAntes: 629, colores: ["negro", "camel"], tallas: TALLAS_ROPA },
  { nombre: "Blusa de lino Clara", descripcion: "Lino fresco de manga 3/4. Combina con todo.", categoriaId: "blusas", silueta: "blusa", precio: 389, colores: ["blanco", "rosapalo", "mezclilla"], tallas: TALLAS_ROPA },
  { nombre: "Blusa con moño Coqueta", descripcion: "Moño al cuello, manga globo y tela que no se arruga.", categoriaId: "blusas", silueta: "blusa", precio: 429, nuevo: true, colores: ["rojo", "negro", "marfil"], tallas: TALLAS_ROPA },
  { nombre: "Top halter Noa", descripcion: "Espalda descubierta y tela con elastano. Para salir de noche.", categoriaId: "blusas", silueta: "blusa", precio: 299, colores: ["negro", "blanco", "esmeralda"], tallas: ["CH", "M", "G"] },
  { nombre: "Blusa satinada Vale", descripcion: "Satín de manga larga con puño de botón. Elegante para la oficina.", categoriaId: "blusas", silueta: "blusa", precio: 459, colores: ["champana", "vino"], tallas: TALLAS_ROPA },
  { nombre: "Pantalón palazzo Sofía", descripcion: "Tiro alto y pierna amplia con mucha caída.", categoriaId: "pantalones", silueta: "pantalon", precio: 549, colores: ["negro", "beige", "blanco"], tallas: TALLAS_ROPA },
  { nombre: "Jeans mom fit Dani", descripcion: "Mezclilla rígida de tiro alto, corte recto al tobillo.", categoriaId: "pantalones", silueta: "pantalon", precio: 629, colores: ["mezclilla", "mezclillaClara"], tallas: TALLAS_NUMERICAS },
  { nombre: "Pantalón sastre Regina", descripcion: "Corte recto con pinzas y bolsas laterales.", categoriaId: "pantalones", silueta: "pantalon", precio: 599, colores: ["gris", "negro", "marino"], tallas: TALLAS_ROPA },
  { nombre: "Falda midi plisada Isabel", descripcion: "Plisado permanente con pretina elástica.", categoriaId: "faldas", silueta: "falda", precio: 449, nuevo: true, colores: ["rosa", "negro", "olivo"], tallas: ["CH", "M", "G"] },
  { nombre: "Falda de mezclilla Ari", descripcion: "Mezclilla con abertura al frente, largo midi.", categoriaId: "faldas", silueta: "falda", precio: 399, colores: ["mezclilla", "negro"], tallas: TALLAS_NUMERICAS },
  { nombre: "Minifalda tweed Coco", descripcion: "Tweed con hilos brillantes y forro.", categoriaId: "faldas", silueta: "falda", precio: 489, precioAntes: 559, colores: ["rosapalo", "negro"], tallas: ["CH", "M", "G"] },
  { nombre: "Blazer oversize Mónica", descripcion: "Hombro marcado, forro completo y un botón.", categoriaId: "abrigos", silueta: "chamarra", precio: 899, colores: ["negro", "camel", "marfil"], tallas: TALLAS_ROPA },
  { nombre: "Chamarra de mezclilla Jess", descripcion: "Clásica de mezclilla con botones metálicos.", categoriaId: "abrigos", silueta: "chamarra", precio: 749, colores: ["mezclilla", "negro"], tallas: TALLAS_ROPA },
  { nombre: "Conjunto de lino Brisa", descripcion: "Blusa y pantalón de lino a juego. Fresco y elegante.", categoriaId: "conjuntos", silueta: "conjunto", precio: 799, nuevo: true, colores: ["blanco", "beige", "olivo"], tallas: TALLAS_ROPA },
  { nombre: "Conjunto deportivo Ivy", descripcion: "Sudadera corta y jogger de felpa suave.", categoriaId: "conjuntos", silueta: "conjunto", precio: 689, colores: ["gris", "rosapalo", "chocolate"], tallas: ["CH", "M", "G"] },
  { nombre: "Bolsa de mano Domna", descripcion: "Piel sintética con asa corta y correa larga desmontable.", categoriaId: "accesorios", silueta: "bolsa", precio: 649, colores: ["negro", "rojo", "camel"], tallas: TALLA_UNICA },
  { nombre: "Bolsa tote Lunares", descripcion: "Tote de lona con estampado de lunares. Cabe todo.", categoriaId: "accesorios", silueta: "bolsa", precio: 359, nuevo: true, colores: ["marfil", "negro"], tallas: TALLA_UNICA },
];

export const CATEGORIAS: Categoria[] = [
  { id: "vestidos", nombre: "Vestidos" },
  { id: "blusas", nombre: "Blusas y tops" },
  { id: "pantalones", nombre: "Pantalones" },
  { id: "faldas", nombre: "Faldas" },
  { id: "conjuntos", nombre: "Conjuntos" },
  { id: "abrigos", nombre: "Blazers y chamarras" },
  { id: "accesorios", nombre: "Accesorios" },
];

export const CONFIG_INICIAL: ConfigBoutique = {
  nombre: "Jesly Boutique",
  slug: "jesly",
  anticipoPct: 50,
  vigenciaSinAnticipoDias: 2,
  vigenciaConAnticipoDias: 15,
  penalizacion: 30,
  limiteApartadosActivos: 3,
  diasTraslado: 2,
  suspendida: false,
  diasNovedad: 7,
  catalogoPublico: true,
  sucursales: [
    { id: "temixco", nombre: "Boutique Temixco", direccion: "Av. Emiliano Zapata 120, Temixco, Mor." },
    { id: "azteca", nombre: "Boutique La Azteca", direccion: "Calle Azteca 45, Col. La Azteca, Temixco, Mor." },
  ],
};

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Índices de DEFS marcados como nuevos, en orden de llegada (el primero, hoy). */
const NUEVOS = DEFS.flatMap((d, i) => (d.nuevo ? [i] : []));

/** "De vuelta en stock" de ejemplo: [índice en DEFS, días desde que se reabasteció]. */
const REABASTECIDOS: [number, number][] = [
  [2, 0], // Vestido camisero Elena: hoy
  [8, 1], // Pantalón palazzo Sofía
  [14, 3], // Blazer oversize Mónica
  [10, 5], // Pantalón sastre Regina
];

function crearProductos(hoy: Date): Producto[] {
  const r = rng(20261001);
  return DEFS.map((d, i) => {
    const id = slug(d.nombre);
    const colores: ColorProducto[] = d.colores.map((k) => ({
      id: `${id}-${k}`,
      nombre: C[k][0],
      hex: C[k][1],
      familia: C[k][2],
    }));
    const variantes = colores.flatMap((c) =>
      d.tallas.map((t) => {
        // ~18% agotadas, ~25% con 1–2 piezas, el resto 3–6. Repartidas en 2 sucursales.
        const x = r();
        const total = x < 0.18 ? 0 : x < 0.43 ? 1 + Math.floor(r() * 2) : 3 + Math.floor(r() * 4);
        const tem = Math.round(total * (0.35 + r() * 0.4));
        return {
          id: `${c.id}-${slug(t)}`,
          productoId: id,
          talla: t,
          colorId: c.id,
          sku: `${id.slice(0, 6).toUpperCase()}-${c.nombre.slice(0, 3).toUpperCase()}-${t}`,
          stock: { temixco: tem, azteca: total - tem },
        };
      }),
    );
    return {
      id,
      nombre: d.nombre,
      descripcion: d.descripcion,
      categoriaId: d.categoriaId,
      silueta: d.silueta,
      precio: d.precio,
      precioAntes: d.precioAntes,
      activo: true,
      // Regla de ejemplo de la boutique: lo que está en oferta se vende solo de contado.
      permiteApartado: !d.precioAntes,
      colores,
      tallas: d.tallas,
      variantes,
      imagenes: [],
      // "Nuevo" = creado hace menos de 7 días. Los de la demo: 0, 2, 4 y 6 días (el último
      // deja de ser nuevo al adelantar el reloj 1 día). El resto, hace semanas.
      creado: sumarDias(hoy, -(d.nuevo ? NUEVOS.indexOf(i) * 2 : 15 + i)).toISOString(),
    };
  });
}

/** 40 clientas sin pedidos (registradas por la campaña de Instagram, mostrador o teléfono). */
function clientasDeEjemplo(hoy: Date): Clienta[] {
  const nombres = ["Andrea", "Paola", "Karla", "Mónica", "Ximena", "Regina", "Itzel", "Camila", "Renata", "Brenda", "Diana", "Lucía", "Mariana", "Abril", "Natalia", "Elena", "Jimena", "Rocío", "Alejandra", "Gabriela"];
  const apellidos = ["Ramírez", "Flores", "Morales", "Jiménez", "Vargas", "Reyes", "Ortiz", "Cruz", "Navarro", "Salazar", "Aguilar", "Rojas", "Domínguez", "Ríos"];
  const r = rng(777);
  return Array.from({ length: 40 }, (_, i) => {
    const nombre = `${nombres[i % nombres.length]} ${apellidos[(i * 7) % apellidos.length]}`;
    const x = r();
    const origen = x < 0.62 ? "google" : x < 0.88 ? "mostrador" : "telefono";
    // Ocho de la última semana ("nuevas"); el resto, en los últimos 2 meses.
    const dias = i < 8 ? i % 7 : 8 + Math.floor(r() * 55);
    const tel = `777 ${String(300 + i * 13).padStart(3, "0")} ${String(1000 + Math.floor(r() * 8999)).padStart(4, "0")}`;
    const slugNombre = nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, ".");
    return {
      id: `c-ej-${i}`,
      nombre,
      // Algunas de Google aún no capturan su WhatsApp.
      telefono: origen === "google" && i % 9 === 4 ? "" : tel,
      email: origen === "google" ? `${slugNombre}${i}@gmail.com` : undefined,
      origen,
      creada: sumarDias(hoy, -dias).toISOString(),
      ultimoAcceso: origen === "mostrador" ? undefined : sumarDias(hoy, -Math.min(dias, Math.floor(r() * 10))).toISOString(),
      penalizacionPendiente: 0,
    } satisfies Clienta;
  });
}

export function crearSeed(hoy: Date): DbState {
  const db: DbState = {
    version: DB_VERSION,
    config: structuredClone(CONFIG_INICIAL),
    categorias: CATEGORIAS,
    productos: crearProductos(hoy),
    clientas: [
      { id: "c-maria", nombre: "María López", telefono: "777 123 4567", email: "maria.lopez@gmail.com", origen: "google", creada: sumarDias(hoy, -40).toISOString(), ultimoAcceso: sumarDias(hoy, -1).toISOString(), penalizacionPendiente: 0 },
      { id: "c-ana", nombre: "Ana Ruiz", telefono: "777 234 5678", email: "ana.ruiz@gmail.com", origen: "google", creada: sumarDias(hoy, -35).toISOString(), ultimoAcceso: hoy.toISOString(), penalizacionPendiente: 0 },
      { id: "c-sofia", nombre: "Sofía Hernández", telefono: "777 345 6789", origen: "mostrador", creada: sumarDias(hoy, -52).toISOString(), penalizacionPendiente: 0 },
      { id: "c-dani", nombre: "Daniela Torres", telefono: "777 456 7890", email: "dani.torres@gmail.com", origen: "google", creada: sumarDias(hoy, -30).toISOString(), ultimoAcceso: sumarDias(hoy, -2).toISOString(), penalizacionPendiente: 0 },
      { id: "c-vale", nombre: "Valeria Gómez", telefono: "777 567 8901", origen: "telefono", creada: sumarDias(hoy, -26).toISOString(), ultimoAcceso: sumarDias(hoy, -3).toISOString(), penalizacionPendiente: 0 },
      { id: "c-fer", nombre: "Fernanda Castro", telefono: "777 678 9012", origen: "mostrador", creada: sumarDias(hoy, -45).toISOString(), penalizacionPendiente: 0 },
      // Alta en mostrador SIN correo: si entra con Google y captura este teléfono, se enlaza.
      { id: "c-lupita", nombre: "Guadalupe Mendoza", telefono: "777 111 2233", origen: "mostrador", creada: sumarDias(hoy, -12).toISOString(), penalizacionPendiente: 0 },
      ...clientasDeEjemplo(hoy),
    ],
    apartados: [],
    folioSeq: 0,
    avisosLeidos: {},
  };
  for (const [idx, dias] of REABASTECIDOS) db.productos[idx].reabastecidoEl = sumarDias(hoy, -dias).toISOString();

  /** Crea un apartado "en el pasado" usando las mismas reglas del dominio. */
  function sembrar(
    clientaId: string,
    productoIdx: number,
    diasAtras: number,
    modalidad: ModalidadApartado,
    entrega: SucursalId,
    pagos: { dias: number; monto: number | "saldo"; metodo: MetodoPago }[] = [],
  ) {
    const p = db.productos[productoIdx];
    const v = p.variantes.find((x) => {
      const d = disponiblePorSucursal(db, x);
      return d.temixco + d.azteca > 1;
    });
    if (!v) return;
    const fecha = sumarDias(hoy, -diasAtras);
    const a = crearApartado(db, clientaId, { varianteId: v.id, cantidad: 1, modalidad, entrega, metodoAnticipo: "transferencia" }, fecha);
    for (const pago of pagos) {
      const saldo = a.total - a.abonos.reduce((s, x) => s + x.monto, 0);
      const monto = pago.monto === "saldo" ? saldo : Math.min(pago.monto, saldo);
      if (monto > 0) abonar(db, { apartadoId: a.id, monto, metodo: pago.metodo }, sumarDias(hoy, -pago.dias));
    }
    if (a.estado === "liquidado" && diasAtras > 1) a.estadoEntrega = "entregado";
  }

  // Ventas (liquidados) repartidas en la última semana, varias de hoy.
  sembrar("c-ana", 0, 9, "anticipo", "temixco", [{ dias: 6, monto: "saldo", metodo: "efectivo" }]);
  sembrar("c-sofia", 4, 8, "anticipo", "azteca", [{ dias: 5, monto: "saldo", metodo: "tarjeta" }]);
  sembrar("c-dani", 8, 7, "anticipo", "temixco", [{ dias: 4, monto: "saldo", metodo: "transferencia" }]);
  sembrar("c-vale", 14, 6, "anticipo", "temixco", [{ dias: 3, monto: "saldo", metodo: "efectivo" }]);
  sembrar("c-fer", 5, 5, "anticipo", "azteca", [{ dias: 2, monto: "saldo", metodo: "tarjeta" }]);
  sembrar("c-ana", 16, 4, "anticipo", "temixco", [{ dias: 1, monto: "saldo", metodo: "efectivo" }]);
  sembrar("c-sofia", 9, 3, "anticipo", "azteca", [{ dias: 0, monto: "saldo", metodo: "transferencia" }]);
  sembrar("c-dani", 18, 2, "anticipo", "temixco", [{ dias: 0, monto: "saldo", metodo: "efectivo" }]);
  sembrar("c-vale", 11, 1, "anticipo", "temixco", [{ dias: 0, monto: "saldo", metodo: "tarjeta" }]);

  // Activos: uno por vencer (13 días atrás con anticipo), uno sin anticipo que vence mañana,
  // uno con traslado, y los de María (la clienta de la demo).
  sembrar("c-fer", 1, 13, "anticipo", "temixco", [{ dias: 6, monto: 100, metodo: "efectivo" }]);
  sembrar("c-ana", 6, 1, "sin_anticipo", "azteca");
  sembrar("c-vale", 2, 3, "anticipo", "azteca");
  sembrar("c-sofia", 12, 5, "anticipo", "temixco");
  sembrar("c-maria", 14, 4, "anticipo", "temixco", [{ dias: 1, monto: 150, metodo: "transferencia" }]);
  // María: un apartado que vence en 2 días (genera el aviso urgente de la demo).
  sembrar("c-maria", 15, 13, "anticipo", "azteca", [{ dias: 5, monto: 100, metodo: "efectivo" }]);

  // Compras de contado: una de María lista para recoger y una con traslado pendiente.
  sembrar("c-maria", 5, 1, "compra", "azteca");
  sembrar("c-sofia", 17, 0, "compra", "azteca");
  sembrar("c-fer", 3, 0, "compra", "temixco");

  // Historial cerrado: un vencido (ya penalizado y cobrado) y un cancelado.
  sembrar("c-dani", 10, 20, "sin_anticipo", "temixco");
  const vencido = db.apartados[0];
  vencido.estado = "vencido";
  vencido.cerradoEl = vencido.venceEl;
  vencido.penalizado = true;
  sembrar("c-fer", 7, 11, "sin_anticipo", "azteca");
  const cancelado = db.apartados[0];
  cancelado.estado = "cancelado";
  cancelado.cerradoEl = sumarDias(hoy, -10).toISOString();

  return db;
}
