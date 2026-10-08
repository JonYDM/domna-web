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

  it("alta en mostrador: guarda nombre/apellidos y correo, no permite teléfono repetido", () => {
    const db = crearSeed(HOY);
    const c = cli.crearClienta(db, { nombre: "Rosa", apellidos: "Pérez", telefono: "7779998877", email: "rosa.perez@gmail.com" }, HOY);
    expect(c).toMatchObject({ origen: "mostrador", telefono: "777 999 8877", nombre: "Rosa", apellidos: "Pérez", email: "rosa.perez@gmail.com" });
    expect(() =>
      cli.crearClienta(db, { nombre: "Otra", apellidos: "X", telefono: "777 999 8877", email: "otra@gmail.com" }, HOY),
    ).toThrowError(/teléfono/);
  });

  it("alta en mostrador: exige correo válido y único", () => {
    const db = crearSeed(HOY);
    expect(() =>
      cli.crearClienta(db, { nombre: "Sin", apellidos: "Correo", telefono: "7779990001", email: "no-es-correo" }, HOY),
    ).toThrowError(/[Cc]orreo/);
    expect(() =>
      cli.crearClienta(db, { nombre: "Repe", apellidos: "Mail", telefono: "7779990002", email: "maria.lopez@gmail.com" }, HOY),
    ).toThrowError(/correo/);
  });

  it("login con teléfono + PIN: entra si coincide, falla si no", () => {
    const db = crearSeed(HOY);
    expect(cli.loginConPin(db, "7771234567", "123456", HOY).id).toBe("c-maria");
    expect(() => cli.loginConPin(db, "7771234567", "000000", HOY)).toThrowError(/incorrecto/);
    expect(() => cli.loginConPin(db, "7779876543", "123456", HOY)).toThrowError(/incorrecto/);
    expect(() => cli.loginConPin(db, "7771234567", "12", HOY)).toThrowError(/6 dígitos/);
  });

  it("registro: crea cuenta con PIN y permite iniciar sesión después", () => {
    const db = crearSeed(HOY);
    const c = cli.registrar(
      db,
      { nombre: "Rosa", apellidos: "Pérez", telefono: "7775551212", email: "rosa.p@gmail.com", pin: "246810" },
      HOY,
    );
    expect(c).toMatchObject({ origen: "registro", telefono: "777 555 1212" });
    expect(db.pins[c.id]).toBe("246810");
    expect(cli.loginConPin(db, "7775551212", "246810", HOY).id).toBe(c.id);
  });

  it("registro: no permite teléfono ni correo ya en uso, ni PIN inválido", () => {
    const db = crearSeed(HOY);
    expect(() =>
      cli.registrar(db, { nombre: "Equis", apellidos: "Ye", telefono: "7771234567", email: "nuevo@gmail.com", pin: "111111" }, HOY),
    ).toThrowError(/teléfono/);
    expect(() =>
      cli.registrar(db, { nombre: "Equis", apellidos: "Ye", telefono: "7775550000", email: "maria.lopez@gmail.com", pin: "111111" }, HOY),
    ).toThrowError(/correo/);
    expect(() =>
      cli.registrar(db, { nombre: "Equis", apellidos: "Ye", telefono: "7775550001", email: "ok@gmail.com", pin: "12ab" }, HOY),
    ).toThrowError(/6 dígitos/);
  });

  it("registro reclama una ficha de mostrador sin acceso (conserva su historial)", () => {
    const db = crearSeed(HOY);
    // c-sofia es alta de mostrador y no tiene PIN en el seed.
    expect(db.pins["c-sofia"]).toBeUndefined();
    const total = db.clientas.length;
    const c = cli.registrar(
      db,
      { nombre: "Sofía", apellidos: "Hernández", telefono: "7773456789", email: "sofia.h@gmail.com", pin: "999999" },
      HOY,
    );
    expect(c.id).toBe("c-sofia"); // misma ficha
    expect(db.clientas.length).toBe(total); // no duplica
    expect(cli.loginConPin(db, "7773456789", "999999", HOY).id).toBe("c-sofia");
  });

  it("recuperación por correo: token válido fija un PIN nuevo (un solo uso)", () => {
    const db = crearSeed(HOY);
    const { token } = cli.solicitarRecuperacion(db, "maria.lopez@gmail.com", HOY);
    expect(token).toBeTruthy();
    const c = cli.confirmarRecuperacion(db, token!, "654321", HOY);
    expect(c.id).toBe("c-maria");
    expect(cli.loginConPin(db, "7771234567", "654321", HOY).id).toBe("c-maria");
    // El token ya no sirve una segunda vez.
    expect(() => cli.confirmarRecuperacion(db, token!, "111111", HOY)).toThrowError(/no es válido|venció/);
  });

  it("recuperación: correo inexistente responde en silencio (sin token)", () => {
    const db = crearSeed(HOY);
    expect(cli.solicitarRecuperacion(db, "nadie@gmail.com", HOY).token).toBeNull();
  });

  it("recuperación: token vencido no sirve", () => {
    const db = crearSeed(HOY);
    const { token } = cli.solicitarRecuperacion(db, "maria.lopez@gmail.com", HOY);
    expect(() => cli.confirmarRecuperacion(db, token!, "222222", sumarDias(HOY, 1))).toThrowError(/venció|no es válido/);
  });

  it("el resumen cuenta nuevas, activas y por origen (registro/mostrador)", () => {
    const db = crearSeed(HOY);
    const r = cli.resumenClientas(db, HOY);
    expect(r.total).toBe(db.clientas.length);
    expect(r.porOrigen.registro + r.porOrigen.mostrador).toBe(r.total);
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
