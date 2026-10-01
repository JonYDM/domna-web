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

  it("el seed es consistente: ningún disponible negativo", () => {
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
