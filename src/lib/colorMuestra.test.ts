import { describe, expect, it } from "vitest";
import { nombreDeHex, promedioColor } from "./colorMuestra";

/** Imagen RGBA de ancho×alto, rellena con un color (y alfa) uniforme. */
function imagen(ancho: number, alto: number, rgba: [number, number, number, number]) {
  const d = new Uint8ClampedArray(ancho * alto * 4);
  for (let i = 0; i < ancho * alto; i++) d.set(rgba, i * 4);
  return d;
}

describe("promedioColor", () => {
  it("devuelve el color de una imagen uniforme", () => {
    const d = imagen(10, 10, [169, 185, 107, 255]);
    expect(promedioColor(d, 10, 10, 5, 5)).toBe("#A9B96B");
  });

  it("promedia los vecinos en lugar de tomar un píxel suelto", () => {
    const d = imagen(10, 10, [100, 100, 100, 255]);
    d.set([200, 200, 200, 255], (5 * 10 + 5) * 4); // un píxel brillante (reflejo) en el centro
    const hex = promedioColor(d, 10, 10, 5, 5, 3)!;
    const r = parseInt(hex.slice(1, 3), 16);
    expect(r).toBeGreaterThan(100); // lo nota
    expect(r).toBeLessThan(110); // pero no se va al reflejo
  });

  it("ignora los píxeles transparentes (prenda recortada)", () => {
    const d = imagen(10, 10, [0, 0, 0, 0]);
    d.set([10, 200, 30, 255], (5 * 10 + 5) * 4);
    expect(promedioColor(d, 10, 10, 5, 5, 3)).toBe("#0AC81E");
  });

  it("devuelve null si todo alrededor es transparente", () => {
    expect(promedioColor(imagen(10, 10, [0, 0, 0, 0]), 10, 10, 5, 5)).toBeNull();
  });

  it("no se sale de la imagen en las orillas", () => {
    const d = imagen(4, 4, [255, 0, 0, 255]);
    expect(promedioColor(d, 4, 4, 0, 0, 3)).toBe("#FF0000");
    expect(promedioColor(d, 4, 4, 3, 3, 3)).toBe("#FF0000");
    expect(promedioColor(d, 4, 4, -5, 99, 3)).toBe("#FF0000");
  });
});

describe("nombreDeHex", () => {
  it.each([
    ["#000000", "Negro"],
    ["#FFFFFF", "Blanco"],
    ["#A9B96B", "Verde pistache"], // el verde claro del corset
    ["#00FF00", "Verde"], // el verde chillante que se veía en el catálogo
    ["#1B2A4A", "Azul marino"],
    ["#F8C8D8", "Rosa pastel"],
    ["#7B1E3A", "Vino"],
    ["#D32F2F", "Rojo"],
  ])("%s → %s", (hex, nombre) => {
    expect(nombreDeHex(hex)).toBe(nombre);
  });

  it("acepta minúsculas", () => {
    expect(nombreDeHex("#a9b96b")).toBe("Verde pistache");
  });

  it("devuelve vacío si el código no es válido", () => {
    expect(nombreDeHex("verde")).toBe("");
    expect(nombreDeHex("#12345")).toBe("");
    expect(nombreDeHex("")).toBe("");
  });
});
