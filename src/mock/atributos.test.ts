import { describe, expect, it } from "vitest";
import { familiaDeHex } from "@/lib/color";
import * as atr from "./atributos";
import { crearSeed } from "./seed";

const HOY = new Date("2026-10-01T18:00:00Z");

describe("categorías", () => {
  it("crea con tallas normalizadas (mayúsculas, sin repetir, Única)", () => {
    const db = crearSeed(HOY);
    const c = atr.crearCategoria(db, { nombre: "  Trajes de baño ", tallas: ["ch", "M", "m", " g ", "unica"] });
    expect(c).toMatchObject({ id: "trajes-de-bano", nombre: "Trajes de baño", tallas: ["CH", "M", "G", "Única"] });
  });

  it("no permite nombres repetidos (sin importar acentos o mayúsculas) ni categorías sin tallas", () => {
    const db = crearSeed(HOY);
    expect(() => atr.crearCategoria(db, { nombre: "VESTIDOS", tallas: ["CH"] })).toThrowError(/Ya existe/);
    expect(() => atr.crearCategoria(db, { nombre: "Calzado", tallas: [" "] })).toThrowError(/al menos una talla/);
  });

  it("no se puede borrar si tiene prendas; vacía sí", () => {
    const db = crearSeed(HOY);
    expect(() => atr.eliminarCategoria(db, "vestidos")).toThrowError(/4 prendas/);
    const c = atr.crearCategoria(db, { nombre: "Lencería", tallas: ["CH", "M"] });
    atr.eliminarCategoria(db, c.id);
    expect(db.categorias.some((x) => x.id === c.id)).toBe(false);
  });

  it("editar tallas no cambia las prendas existentes", () => {
    const db = crearSeed(HOY);
    const antes = db.productos.find((p) => p.categoriaId === "vestidos")!.tallas.slice();
    atr.actualizarCategoria(db, "vestidos", { nombre: "Vestidos", tallas: ["XS", "S"] });
    expect(db.productos.find((p) => p.categoriaId === "vestidos")!.tallas).toEqual(antes);
  });
});

describe("colores", () => {
  it("crea un color y calcula su grupo para el filtro", () => {
    const db = crearSeed(HOY);
    const c = atr.crearColor(db, { nombre: "Verde menta", hex: "#a7d7c5" });
    expect(c).toMatchObject({ id: "verde-menta", hex: "#A7D7C5", familia: "verde" });
    expect(() => atr.crearColor(db, { nombre: "verde MENTA", hex: "#000" })).toThrowError(/Ya existe/);
    expect(() => atr.crearColor(db, { nombre: "Raro", hex: "rojo" })).toThrowError(/inválido/);
  });

  it("agrupa tonos comunes de moda", () => {
    expect(familiaDeHex("#1F1B24")).toBe("negro");
    expect(familiaDeHex("#F6F3EE")).toBe("blanco");
    expect(familiaDeHex("#26324D")).toBe("azul"); // azul marino
    expect(familiaDeHex("#7A1E2E")).toBe("rojo"); // vino
    expect(familiaDeHex("#F2A7B5")).toBe("rosa");
    expect(familiaDeHex("#B5875A")).toBe("cafe"); // camel
    expect(familiaDeHex("#D9C4A5")).toBe("beige"); // arena
    expect(familiaDeHex("#6B7046")).toBe("verde"); // olivo
    expect(familiaDeHex("#A9A3AC")).toBe("gris");
  });

  it("quitar un color del catálogo no afecta a las prendas que lo usan", () => {
    const db = crearSeed(HOY);
    const p = db.productos[0];
    const nombreColor = p.colores[0].nombre;
    const id = db.colores.find((c) => c.nombre === nombreColor)!.id;
    atr.eliminarColor(db, id);
    expect(p.colores[0].nombre).toBe(nombreColor);
  });
});
