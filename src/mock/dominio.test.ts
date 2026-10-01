import { describe, expect, it } from "vitest";
import { sumarDias } from "@/lib/reloj";
import type { DbState } from "./db";
import * as dom from "./dominio";
import { crearSeed } from "./seed";

const HOY = new Date("2026-10-01T18:00:00Z");

function nuevaDb(): DbState {
  const db = crearSeed(HOY);
  db.apartados = []; // empezar sin apartados para aislar cada regla
  db.clientas.forEach((c) => (c.penalizacionPendiente = 0));
  return db;
}

/** Primera variante con exactamente `n` piezas en Temixco y 0 en La Azteca (la fuerza si no existe). */
function varianteCon(db: DbState, n: number) {
  const v = db.productos[0].variantes[0];
  v.stock = { temixco: n, azteca: 0 };
  return v;
}

describe("apartados (reglas de dominio)", () => {
  it("reserva stock: el disponible baja al apartar", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 2);
    dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(dom.disponibleTotal(db, v)).toBe(1);
    expect(v.stock.temixco).toBe(2); // el físico no cambia hasta liquidar
  });

  it("no aparta más de lo disponible (409 en la última pieza)", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(() =>
      dom.crearApartado(db, "c-ana", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY),
    ).toThrowError(/stock/);
  });

  it("anticipo del 50% redondeado hacia arriba y vigencia de 15 días; sin anticipo, 2 días", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 3);
    const con = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(dom.pagado(con)).toBe(Math.ceil(db.productos[0].precio / 2));
    expect(con.venceEl).toBe(sumarDias(HOY, 15).toISOString());
    const sin = dom.crearApartado(db, "c-ana", { varianteId: v.id, cantidad: 1, modalidad: "sin_anticipo", entrega: "temixco" }, HOY);
    expect(dom.pagado(sin)).toBe(0);
    expect(sin.venceEl).toBe(sumarDias(HOY, 2).toISOString());
  });

  it("vencer libera el stock y genera la penalización de $30 una sola vez", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "sin_anticipo", entrega: "temixco" }, HOY);
    expect(dom.disponibleTotal(db, v)).toBe(0);
    dom.procesarVencimientos(db, sumarDias(HOY, 3));
    dom.procesarVencimientos(db, sumarDias(HOY, 4));
    expect(a.estado).toBe("vencido");
    expect(dom.disponibleTotal(db, v)).toBe(1);
    expect(db.clientas.find((c) => c.id === "c-maria")!.penalizacionPendiente).toBe(30);
  });

  it("la penalización se cobra en el siguiente apartado", () => {
    const db = nuevaDb();
    db.clientas.find((c) => c.id === "c-maria")!.penalizacionPendiente = 30;
    const v = varianteCon(db, 1);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "sin_anticipo", entrega: "temixco" }, HOY);
    expect(a.penalizacion).toBe(30);
    expect(a.total).toBe(db.productos[0].precio + 30);
    expect(db.clientas.find((c) => c.id === "c-maria")!.penalizacionPendiente).toBe(0);
  });

  it("liquidar descuenta el stock físico y congela el precio", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 2);
    const precioOriginal = db.productos[0].precio;
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    db.productos[0].precio = precioOriginal + 500; // la dueña sube el precio
    dom.abonar(db, { apartadoId: a.id, monto: a.total - dom.pagado(a), metodo: "efectivo" }, HOY);
    expect(a.estado).toBe("liquidado");
    expect(a.lineas[0].precio).toBe(precioOriginal);
    expect(v.stock.temixco).toBe(1);
    expect(dom.disponibleTotal(db, v)).toBe(1);
  });

  it("no acepta abonos mayores al saldo", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(() => dom.abonar(db, { apartadoId: a.id, monto: a.total, metodo: "efectivo" }, HOY)).toThrowError(/Monto/);
  });

  it("si no hay en la sucursal elegida, toma la otra y marca traslado", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1); // solo en Temixco
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "azteca" }, HOY);
    expect(a.requiereTraslado).toBe(true);
    expect(a.lineas[0].sucursalOrigen).toBe("temixco");
    expect(a.estadoEntrega).toBe("en_origen");
  });

  it("límite de 3 apartados activos por clienta", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 5);
    for (let i = 0; i < 3; i++) {
      dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    }
    expect(() =>
      dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY),
    ).toThrowError(/3 apartados/);
  });

  it("cancelar libera el stock sin penalizar", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    dom.cancelar(db, a.id, HOY);
    expect(dom.disponibleTotal(db, v)).toBe(1);
    expect(db.clientas.find((c) => c.id === "c-maria")!.penalizacionPendiente).toBe(0);
  });

describe("compra de contado (venta directa)", () => {
  it("cobra el total, queda pagada y descuenta el stock físico al momento", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 2);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "compra", entrega: "temixco" }, HOY);
    expect(a.estado).toBe("liquidado");
    expect(dom.pagado(a)).toBe(a.total);
    expect(a.abonos[0].concepto).toBe("compra");
    expect(v.stock.temixco).toBe(1);
    expect(dom.disponibleTotal(db, v)).toBe(1);
    expect(a.estadoEntrega).toBe("listo");
  });

  it("no la afecta el reloj (no vence) ni el límite de 3 apartados", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 6);
    for (let i = 0; i < 3; i++) {
      dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    }
    const c = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "compra", entrega: "temixco" }, HOY);
    dom.procesarVencimientos(db, sumarDias(HOY, 30));
    expect(c.estado).toBe("liquidado");
  });

  it("una prenda que no permite apartado solo se puede comprar", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 2);
    db.productos[0].permiteApartado = false;
    expect(() =>
      dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY),
    ).toThrowError(/contado/);
    const c = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "compra", entrega: "temixco" }, HOY);
    expect(c.estado).toBe("liquidado");
  });

  it("la penalización pendiente también se cobra en una compra", () => {
    const db = nuevaDb();
    db.clientas.find((c) => c.id === "c-maria")!.penalizacionPendiente = 30;
    const v = varianteCon(db, 1);
    const c = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "compra", entrega: "temixco" }, HOY);
    expect(c.total).toBe(db.productos[0].precio + 30);
    expect(dom.pagado(c)).toBe(c.total);
  });

  it("sin stock en la sucursal elegida: se compra igual con traslado", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    const c = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "compra", entrega: "azteca" }, HOY);
    expect(c.requiereTraslado).toBe(true);
    expect(c.estadoEntrega).toBe("en_origen");
    expect(v.stock.temixco).toBe(0);
  });
});

describe("novedades: nuevos y de vuelta en stock", () => {
  it("un producto es nuevo durante 7 días desde su alta y luego deja de serlo solo", () => {
    const db = nuevaDb();
    const p = db.productos[0];
    p.creado = HOY.toISOString();
    expect(dom.novedad(db, p, sumarDias(HOY, 6)).nuevo).toBe(true);
    expect(dom.novedad(db, p, sumarDias(HOY, 7)).nuevo).toBe(false);
  });

  it("subir stock de una variante agotada marca el producto como reabastecido", () => {
    const db = nuevaDb();
    const p = db.productos[0];
    p.creado = sumarDias(HOY, -30).toISOString();
    const v = varianteCon(db, 0);
    dom.ajustarStock(db, v.id, "azteca", 3, HOY);
    expect(p.reabastecidoEl).toBe(HOY.toISOString());
    expect(dom.novedad(db, p, sumarDias(HOY, 2)).reabastecido).toBe(true);
    expect(dom.novedad(db, p, sumarDias(HOY, 8)).reabastecido).toBe(false);
  });

  it("subir stock de una variante que NO estaba agotada no cuenta como reabastecido", () => {
    const db = nuevaDb();
    const p = db.productos[0];
    p.reabastecidoEl = undefined;
    const v = varianteCon(db, 2);
    dom.ajustarStock(db, v.id, "temixco", 1, HOY);
    expect(p.reabastecidoEl).toBeUndefined();
  });

  it("si vuelve a agotarse, sale de 'De vuelta en stock'; y un nuevo no se duplica ahí", () => {
    const db = nuevaDb();
    const p = db.productos[0];
    p.creado = sumarDias(HOY, -30).toISOString();
    p.variantes.forEach((v) => (v.stock = { temixco: 0, azteca: 0 }));
    p.reabastecidoEl = HOY.toISOString();
    expect(dom.novedad(db, p, HOY).reabastecido).toBe(false); // sin stock
    p.variantes[0].stock.temixco = 2;
    p.creado = HOY.toISOString();
    expect(dom.novedad(db, p, HOY)).toEqual({ nuevo: true, reabastecido: false });
  });

  it("no deja bajar el stock por debajo de lo apartado", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(() => dom.ajustarStock(db, v.id, "temixco", -1, HOY)).toThrowError(/apartado/);
  });
});

describe("avisos in-app", () => {
  const tipos = (db: DbState, hoy: Date) => dom.avisosDe(db, "c-maria", hoy).map((a) => a.tipo);

  it("el aviso de vencimiento aparece a 3 días, no antes, y es urgente", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 2);
    dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(tipos(db, sumarDias(HOY, 11))).not.toContain("por_vencer"); // faltan 4 días
    const avisos = dom.avisosDe(db, "c-maria", sumarDias(HOY, 12)); // faltan 3
    expect(avisos[0]).toMatchObject({ tipo: "por_vencer", urgente: true, leido: false });
    expect(avisos[0].titulo).toMatch(/en 3 días/);
    expect(dom.avisosDe(db, "c-maria", sumarDias(HOY, 14))[0].titulo).toMatch(/mañana/);
  });

  it("al vencer cambia a aviso de vencido con el cargo", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "sin_anticipo", entrega: "temixco" }, HOY);
    const despues = sumarDias(HOY, 3);
    dom.procesarVencimientos(db, despues);
    const t = tipos(db, despues);
    expect(t).toContain("vencido");
    expect(t).not.toContain("por_vencer");
  });

  it("abono registrado por la tienda y prenda lista generan avisos; el anticipo propio no", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 2);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }, HOY);
    expect(tipos(db, HOY)).toEqual([]);
    dom.abonar(db, { apartadoId: a.id, monto: a.total - dom.pagado(a), metodo: "efectivo" }, HOY);
    expect(tipos(db, HOY).sort()).toEqual(["abono", "lista"]);
  });

  it("marcar como leído persiste por clienta y no afecta a otras", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "sin_anticipo", entrega: "temixco" }, HOY);
    const [aviso] = dom.avisosDe(db, "c-maria", HOY);
    dom.marcarAvisosLeidos(db, "c-maria", [aviso.id]);
    expect(dom.avisosDe(db, "c-maria", HOY)[0].leido).toBe(true);
    expect(db.avisosLeidos["c-ana"]).toBeUndefined();
  });

  it("el traslado avisa que va en camino", () => {
    const db = nuevaDb();
    const v = varianteCon(db, 1);
    const a = dom.crearApartado(db, "c-maria", { varianteId: v.id, cantidad: 1, modalidad: "compra", entrega: "azteca" }, HOY);
    dom.avanzarEntrega(db, a.id, "en_traslado");
    expect(tipos(db, HOY)).toContain("traslado");
  });
});

describe("seed", () => {
  it("es consistente: ningún disponible negativo", () => {
    const db = crearSeed(HOY);
    for (const p of db.productos) {
      for (const v of p.variantes) {
        expect(v.stock.temixco - dom.reservado(db, v.id, "temixco")).toBeGreaterThanOrEqual(0);
        expect(v.stock.azteca - dom.reservado(db, v.id, "azteca")).toBeGreaterThanOrEqual(0);
      }
    }
    expect(db.apartados.length).toBeGreaterThan(10);
  });
});
});
