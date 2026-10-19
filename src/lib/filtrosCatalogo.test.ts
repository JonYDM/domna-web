import { describe, expect, it } from "vitest";
import type { FamiliaColor, ProductoResumen } from "@/types/api";
import { aplicarFiltros, leerFiltros, normalizarTexto } from "./filtrosCatalogo";

function prenda(id: string, extra: Omit<Partial<ProductoResumen>, "colores"> & { colores?: { nombre: string; familia: FamiliaColor }[] } = {}): ProductoResumen {
  const { colores = [{ nombre: "Rosa", familia: "rosa" }], ...resto } = extra;
  return {
    id,
    nombre: `Prenda ${id}`,
    categoriaId: "vestidos",
    silueta: "vestido",
    precio: 300,
    activo: true,
    permiteApartado: true,
    colores: colores.map((c, i) => ({ id: `${id}-c${i}`, hex: "#000000", ...c })),
    tallas: ["M"],
    imagenes: [],
    disponibleTotal: 3,
    stockFisicoTotal: 3,
    nuevo: false,
    reabastecido: false,
    ...resto,
  };
}

const catalogo = [
  prenda("corset", { nombre: "Corset", categoriaId: "tops", precio: 295, colores: [{ nombre: "Verde", familia: "verde" }], tallas: ["CH", "M"], nuevo: true }),
  prenda("blusa", { nombre: "Blusa tirantes", categoriaId: "tops", precio: 180, colores: [{ nombre: "Azul claro", familia: "azul" }], tallas: ["M", "G"], nuevo: true }),
  prenda("vestido", { nombre: "Vestido Estraple", precio: 275, colores: [{ nombre: "Marfil", familia: "blanco" }, { nombre: "Negro", familia: "negro" }], tallas: ["CH"], reabastecido: true }),
  prenda("pinza", { nombre: "Pinzas para el cabello", categoriaId: "accesorios", precio: 20, colores: [{ nombre: "Blanco", familia: "blanco" }], tallas: ["Única"] }),
];
const ids = (l: ProductoResumen[]) => l.map((p) => p.id);

describe("aplicarFiltros: color", () => {
  it("deja las prendas que tienen un color de esa familia", () => {
    expect(ids(aplicarFiltros(catalogo, { color: "verde" }))).toEqual(["corset"]);
    expect(ids(aplicarFiltros(catalogo, { color: "azul" }))).toEqual(["blusa"]);
  });

  it("una prenda con varios colores sale por cualquiera de ellos", () => {
    expect(ids(aplicarFiltros(catalogo, { color: "negro" }))).toEqual(["vestido"]);
    expect(ids(aplicarFiltros(catalogo, { color: "blanco" }))).toEqual(["vestido", "pinza"]);
  });

  it("una familia sin prendas deja la lista vacía", () => {
    expect(aplicarFiltros(catalogo, { color: "rojo" })).toEqual([]);
  });
});

describe("aplicarFiltros: sección", () => {
  it("recién llegados solo trae lo nuevo", () => {
    expect(ids(aplicarFiltros(catalogo, { seccion: "nuevos" }))).toEqual(["corset", "blusa"]);
  });

  it("de vuelta en stock solo trae lo reabastecido", () => {
    expect(ids(aplicarFiltros(catalogo, { seccion: "reabastecidos" }))).toEqual(["vestido"]);
  });
});

describe("aplicarFiltros: categoría, talla, precio y orden", () => {
  it("categoría", () => {
    expect(ids(aplicarFiltros(catalogo, { categoria: "tops" }))).toEqual(["corset", "blusa"]);
  });

  it("talla", () => {
    expect(ids(aplicarFiltros(catalogo, { talla: "M" }))).toEqual(["corset", "blusa"]);
    expect(ids(aplicarFiltros(catalogo, { talla: "Única" }))).toEqual(["pinza"]);
  });

  it("precio máximo incluye el precio exacto", () => {
    expect(ids(aplicarFiltros(catalogo, { precioMax: 180 }))).toEqual(["blusa", "pinza"]);
  });

  it("orden por precio, sin tocar la lista original", () => {
    const original = ids(catalogo);
    expect(ids(aplicarFiltros(catalogo, { orden: "precio-asc" }))).toEqual(["pinza", "blusa", "vestido", "corset"]);
    expect(ids(aplicarFiltros(catalogo, { orden: "precio-desc" }))).toEqual(["corset", "vestido", "blusa", "pinza"]);
    expect(ids(catalogo)).toEqual(original);
  });

  it("orden 'nuevos' o ninguno conserva el orden del servidor", () => {
    expect(ids(aplicarFiltros(catalogo, { orden: "nuevos" }))).toEqual(ids(catalogo));
    expect(ids(aplicarFiltros(catalogo, {}))).toEqual(ids(catalogo));
  });
});

describe("aplicarFiltros: texto", () => {
  it("no distingue mayúsculas ni acentos", () => {
    expect(ids(aplicarFiltros(catalogo, { texto: "BLÚSA" }))).toEqual(["blusa"]);
    expect(ids(aplicarFiltros(catalogo, { texto: "pinzas" }))).toEqual(["pinza"]);
  });

  it("todas las palabras deben aparecer, en cualquier orden", () => {
    expect(ids(aplicarFiltros(catalogo, { texto: "estraple vestido" }))).toEqual(["vestido"]);
    expect(ids(aplicarFiltros(catalogo, { texto: "vestido blusa" }))).toEqual([]);
  });

  it("también busca por el nombre del color", () => {
    expect(ids(aplicarFiltros(catalogo, { texto: "verde" }))).toEqual(["corset"]);
    expect(ids(aplicarFiltros(catalogo, { texto: "marfil" }))).toEqual(["vestido"]);
  });

  it("texto vacío o solo espacios no filtra", () => {
    expect(aplicarFiltros(catalogo, { texto: "   " })).toHaveLength(4);
  });
});

describe("aplicarFiltros: combinados", () => {
  it("se aplican todos a la vez", () => {
    expect(ids(aplicarFiltros(catalogo, { categoria: "tops", color: "azul", talla: "G", precioMax: 200, seccion: "nuevos" }))).toEqual(["blusa"]);
    expect(aplicarFiltros(catalogo, { categoria: "tops", color: "verde", seccion: "reabastecidos" })).toEqual([]);
  });
});

describe("normalizarTexto", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(normalizarTexto("  Café  ")).toBe("cafe");
  });
});

describe("leerFiltros", () => {
  it("lee los filtros válidos de la URL", () => {
    const f = leerFiltros(new URLSearchParams("q=vestido&categoria=tops&talla=M&color=verde&precioMax=300&orden=precio-asc&seccion=nuevos"));
    expect(f).toEqual({ texto: "vestido", categoria: "tops", talla: "M", color: "verde", precioMax: 300, orden: "precio-asc", seccion: "nuevos" });
  });

  it("descarta un color, orden o sección que no existen", () => {
    const f = leerFiltros(new URLSearchParams("color=fucsia&orden=barato&seccion=ofertas"));
    expect(f.color).toBeUndefined();
    expect(f.orden).toBeUndefined();
    expect(f.seccion).toBeUndefined();
  });

  it("descarta un precio que no es número positivo", () => {
    for (const malo of ["abc", "0", "-5", ""]) {
      expect(leerFiltros(new URLSearchParams(`precioMax=${malo}`)).precioMax).toBeUndefined();
    }
  });

  it("sin parámetros no hay filtros", () => {
    expect(leerFiltros(new URLSearchParams(""))).toEqual({
      texto: undefined, categoria: undefined, talla: undefined, color: undefined, precioMax: undefined, orden: undefined, seccion: undefined,
    });
  });
});