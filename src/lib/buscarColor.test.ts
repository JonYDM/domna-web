import { describe, expect, it } from "vitest";
import { filtrarPorNombre, normalizarBusqueda } from "./buscarColor";

const colores = [
  { id: "azul-claro", nombre: "Azul claro" },
  { id: "azul-marino", nombre: "Azul marino" },
  { id: "beige", nombre: "Beige" },
  { id: "cafe", nombre: "Café" },
  { id: "marfil", nombre: "Marfil" },
  { id: "verde-menta", nombre: "Verde menta" },
];

describe("normalizarBusqueda", () => {
  it("quita acentos, mayúsculas y espacios de más", () => {
    expect(normalizarBusqueda("  CAFÉ   oscuro ")).toBe("cafe oscuro");
  });
});

describe("filtrarPorNombre", () => {
  it("sin búsqueda devuelve todo", () => {
    const r = filtrarPorNombre(colores, "   ");
    expect(r.visibles).toHaveLength(6);
    expect(r.coinciden).toBe(6);
  });

  it("encuentra por parte del nombre, sin importar mayúsculas", () => {
    expect(filtrarPorNombre(colores, "AZU").visibles.map((c) => c.id)).toEqual(["azul-claro", "azul-marino"]);
  });

  it("encuentra con o sin acento", () => {
    expect(filtrarPorNombre(colores, "cafe").visibles.map((c) => c.id)).toEqual(["cafe"]);
    expect(filtrarPorNombre(colores, "café").visibles.map((c) => c.id)).toEqual(["cafe"]);
  });

  it("todas las palabras deben estar, en cualquier orden", () => {
    expect(filtrarPorNombre(colores, "menta verde").visibles.map((c) => c.id)).toEqual(["verde-menta"]);
    expect(filtrarPorNombre(colores, "azul verde").coinciden).toBe(0);
  });

  it("conserva los ya elegidos aunque no coincidan, y no los cuenta como resultado", () => {
    const r = filtrarPorNombre(colores, "beige", new Set(["marfil"]));
    expect(r.visibles.map((c) => c.id)).toEqual(["beige", "marfil"]);
    expect(r.coinciden).toBe(1);
  });

  it("sin coincidencias avisa con coinciden = 0", () => {
    expect(filtrarPorNombre(colores, "turquesa").coinciden).toBe(0);
  });

  it("no modifica la lista original", () => {
    const copia = [...colores];
    filtrarPorNombre(colores, "azul");
    expect(colores).toEqual(copia);
  });
});
