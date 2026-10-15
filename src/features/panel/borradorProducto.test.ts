import { describe, expect, it } from "vitest";
import { VERSION_BORRADOR, tieneContenido, validarBorrador, type BorradorProducto } from "./borradorProducto";

const AHORA = Date.parse("2026-10-15T12:00:00Z");

function bueno(extra: Partial<BorradorProducto> = {}): BorradorProducto {
  return {
    version: VERSION_BORRADOR,
    guardado: "2026-10-15T11:00:00Z",
    paso: 1,
    nombre: "Corset verde",
    descripcion: "",
    categoriaElegida: "cat-1",
    colorIds: ["c1", "c2"],
    tallasElegidas: ["CH", "M"],
    sucursal: "temixco",
    stock: { temixco: { CH: [1, 0], M: [2, 3] }, azteca: {} },
    precio: "295",
    costo: "",
    permiteApartado: true,
    ...extra,
  };
}

describe("validarBorrador", () => {
  it("acepta un borrador completo", () => {
    expect(validarBorrador(bueno(), AHORA)?.nombre).toBe("Corset verde");
  });

  it("acepta categoría y tallas en null (valores por defecto)", () => {
    expect(validarBorrador(bueno({ categoriaElegida: null, tallasElegidas: null }), AHORA)).not.toBeNull();
  });

  it.each([
    ["no es objeto", "texto"],
    ["nulo", null],
    ["versión distinta", { ...bueno(), version: 99 }],
    ["fecha rota", { ...bueno(), guardado: "ayer" }],
    ["paso fuera de rango", { ...bueno(), paso: 4 }],
    ["paso negativo", { ...bueno(), paso: -1 }],
    ["nombre no es texto", { ...bueno(), nombre: 5 }],
    ["precio no es texto", { ...bueno(), precio: 295 }],
    ["colores con basura", { ...bueno(), colorIds: ["c1", 2] }],
    ["sucursal inválida", { ...bueno(), sucursal: "narnia" }],
    ["stock negativo", { ...bueno(), stock: { temixco: { M: [-1] }, azteca: {} } }],
    ["stock con decimales", { ...bueno(), stock: { temixco: { M: [1.5] }, azteca: {} } }],
    ["stock sin azteca", { ...bueno(), stock: { temixco: {} } }],
    ["permiteApartado no booleano", { ...bueno(), permiteApartado: "si" }],
  ])("descarta: %s", (_n, crudo) => {
    expect(validarBorrador(crudo, AHORA)).toBeNull();
  });

  it("descarta un borrador de hace más de 14 días", () => {
    expect(validarBorrador(bueno({ guardado: "2026-09-20T12:00:00Z" }), AHORA)).toBeNull();
    expect(validarBorrador(bueno({ guardado: "2026-10-02T12:00:01Z" }), AHORA)).not.toBeNull();
  });
});

describe("tieneContenido", () => {
  const vacio = { nombre: "", descripcion: "", colorIds: [] as string[], precio: "", costo: "" };

  it("un formulario recién abierto no es borrador", () => {
    expect(tieneContenido(vacio, false)).toBe(false);
    expect(tieneContenido({ ...vacio, nombre: "   " }, false)).toBe(false);
  });

  it.each([
    ["nombre", { nombre: "Blusa" }],
    ["descripción", { descripcion: "Algodón" }],
    ["colores", { colorIds: ["c1"] }],
    ["precio", { precio: "200" }],
    ["costo", { costo: "100" }],
  ])("sí lo es si hay %s", (_n, extra) => {
    expect(tieneContenido({ ...vacio, ...extra }, false)).toBe(true);
  });

  it("sí lo es si solo hay fotos", () => {
    expect(tieneContenido(vacio, true)).toBe(true);
  });
});
