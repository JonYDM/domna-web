import { describe, expect, it } from "vitest";
import { cambioElColor, ofrecerAplicarAPrendas, textoPrendas } from "./colorPrendas";

const original = { nombre: "Verde", hex: "#00FF00" };
const base = { original, nombre: "Verde", hex: "#117D11", valido: true, prendas: 2 };

describe("ofrecerAplicarAPrendas", () => {
  it("se ofrece cuando cambió el código y hay prendas que lo usan", () => {
    expect(ofrecerAplicarAPrendas(base)).toBe(true);
  });

  it("también si solo cambió el nombre", () => {
    expect(ofrecerAplicarAPrendas({ ...base, hex: "#00FF00", nombre: "Verde bosque" })).toBe(true);
  });

  it("no se ofrece si no cambió nada y las prendas están al día", () => {
    expect(ofrecerAplicarAPrendas({ ...base, hex: "#00FF00", desactualizadas: 0 })).toBe(false);
  });

  it("se ofrece aunque no cambie nada si hay prendas con un tono anterior (ponerlas al día)", () => {
    expect(ofrecerAplicarAPrendas({ ...base, hex: "#00FF00", desactualizadas: 1 })).toBe(true);
  });

  it("pero no si ninguna prenda lo usa, aunque haya desactualizadas", () => {
    expect(ofrecerAplicarAPrendas({ ...base, hex: "#00FF00", prendas: 0, desactualizadas: 3 })).toBe(false);
  });

  it("no cuenta como cambio escribir el mismo código en minúsculas o con espacios", () => {
    expect(ofrecerAplicarAPrendas({ ...base, hex: " #00ff00 ", nombre: " Verde " })).toBe(false);
  });

  it("no se ofrece si ninguna prenda lo usa", () => {
    expect(ofrecerAplicarAPrendas({ ...base, prendas: 0 })).toBe(false);
  });

  it("no se ofrece mientras el formulario no es válido", () => {
    expect(ofrecerAplicarAPrendas({ ...base, valido: false })).toBe(false);
  });

  it("no se ofrece al crear un color nuevo", () => {
    expect(ofrecerAplicarAPrendas({ ...base, original: null })).toBe(false);
  });
});

describe("textoPrendas", () => {
  it("singular y plural", () => {
    expect(textoPrendas(1)).toBe("1 prenda");
    expect(textoPrendas(3)).toBe("3 prendas");
  });
});

describe("cambioElColor", () => {
  it("detecta cambio de nombre o de tono", () => {
    expect(cambioElColor(original, "Verde bosque", "#00FF00")).toBe(true);
    expect(cambioElColor(original, "Verde", "#117D11")).toBe(true);
  });

  it("ignora mayúsculas y espacios", () => {
    expect(cambioElColor(original, " Verde ", " #00ff00 ")).toBe(false);
  });
});
