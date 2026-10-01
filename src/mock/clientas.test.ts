import { describe, expect, it } from "vitest";
import { sumarDias } from "@/lib/reloj";
import * as cli from "./clientas";
import * as dom from "./dominio";
import { crearSeed } from "./seed";

const HOY = new Date("2026-10-01T18:00:00Z");

describe("clientas", () => {
  it("normaliza el teléfono y exige 10 dígitos", () => {
    expect(cli.normalizarTelefono("+52 (777) 123-4567")).toBe("777 123 4567");
    expect(() => cli.normalizarTelefono("12345")).toThrowError(/10 dígitos/);
  });

  it("alta en mostrador: no permite teléfono repetido", () => {
    const db = crearSeed(HOY);
    const c = cli.crearClienta(db, { nombre: "Rosa Pérez", telefono: "7779998877" }, HOY);
    expect(c).toMatchObject({ origen: "mostrador", telefono: "777 999 8877" });
    expect(() => cli.crearClienta(db, { nombre: "Otra", telefono: "777 999 8877" }, HOY)).toThrowError(/teléfono/);
  });

  it("Google: la clienta existente entra; una nueva se crea sin teléfono", () => {
    const db = crearSeed(HOY);
    const maria = cli.entrarConGoogle(db, { nombre: "María López", email: "MARIA.LOPEZ@gmail.com" }, HOY);
    expect(maria).toMatchObject({ nueva: false, clienta: { id: "c-maria" } });
    const total = db.clientas.length;
    const nueva = cli.entrarConGoogle(db, { nombre: "Andrea Martínez", email: "andrea.m@gmail.com" }, HOY);
    expect(nueva.nueva).toBe(true);
    expect(nueva.clienta).toMatchObject({ origen: "google", telefono: "" });
    expect(db.clientas.length).toBe(total + 1);
  });

  it("al capturar un teléfono registrado en mostrador, las cuentas se enlazan", () => {
    const db = crearSeed(HOY);
    const { clienta: g } = cli.entrarConGoogle(db, { nombre: "Lupita", email: "lupita@gmail.com" }, HOY);
    const total = db.clientas.length;
    const r = cli.guardarTelefono(db, g.id, "777 111 2233", HOY);
    expect(r.enlazada).toBe(true);
    expect(r.clienta.id).toBe("c-lupita"); // se conserva la ficha de mostrador
    expect(r.clienta.email).toBe("lupita@gmail.com");
    expect(db.clientas.length).toBe(total - 1);
    expect(db.clientas.some((c) => c.id === g.id)).toBe(false);
  });

  it("no enlaza con un teléfono que ya pertenece a otra cuenta con correo", () => {
    const db = crearSeed(HOY);
    const { clienta: g } = cli.entrarConGoogle(db, { nombre: "Intrusa", email: "x@gmail.com" }, HOY);
    expect(() => cli.guardarTelefono(db, g.id, "777 123 4567", HOY)).toThrowError(/otra cuenta/);
  });

  it("entrar con teléfono: solo si existe", () => {
    const db = crearSeed(HOY);
    expect(cli.entrarConTelefono(db, "7773456789", HOY).id).toBe("c-sofia");
    expect(() => cli.entrarConTelefono(db, "7770000000", HOY)).toThrowError(/No encontramos/);
  });

  it("el resumen cuenta nuevas, activas y por origen", () => {
    const db = crearSeed(HOY);
    const r = cli.resumenClientas(db, HOY);
    expect(r.total).toBe(db.clientas.length);
    expect(r.porOrigen.google + r.porOrigen.mostrador + r.porOrigen.telefono).toBe(r.total);
    expect(r.nuevasSemana).toBeGreaterThanOrEqual(8);
    expect(r.conApartadoActivo).toBeGreaterThan(0);
    expect(cli.resumenClientas(db, sumarDias(HOY, 30)).nuevasSemana).toBe(0);
  });

  it("filtros: activas, búsqueda por nombre sin acentos y por teléfono", () => {
    const db = crearSeed(HOY);
    expect(cli.listarClientas(db, "activas", "", HOY).every((c) => c.apartadosActivos > 0)).toBe(true);
    expect(cli.listarClientas(db, "todas", "sofia", HOY)[0].id).toBe("c-sofia");
    expect(cli.listarClientas(db, "todas", "345 67", HOY)[0].id).toBe("c-sofia");
  });

  it("el resumen de una clienta suma lo comprado y lo pendiente", () => {
    const db = crearSeed(HOY);
    const r = cli.resumenDe(db, db.clientas.find((c) => c.id === "c-maria")!);
    const suyos = db.apartados.filter((a) => a.clientaId === "c-maria");
    expect(r.pedidos).toBe(suyos.length);
    expect(r.saldoPendiente).toBe(
      suyos.filter((a) => a.estado === "activo").reduce((n, a) => n + a.total - dom.pagado(a), 0),
    );
  });
});
