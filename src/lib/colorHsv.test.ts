import { describe, expect, it } from "vitest";
import { hexAHsv, hsvAHex, normalizarHexTecleado } from "./colorHsv";

describe("hsvAHex", () => {
  it.each([
    [{ h: 0, s: 1, v: 1 }, "#FF0000"],
    [{ h: 120, s: 1, v: 1 }, "#00FF00"],
    [{ h: 240, s: 1, v: 1 }, "#0000FF"],
    [{ h: 60, s: 1, v: 1 }, "#FFFF00"],
    [{ h: 0, s: 0, v: 1 }, "#FFFFFF"],
    [{ h: 0, s: 0, v: 0 }, "#000000"],
    [{ h: 200, s: 0, v: 0.5 }, "#808080"],
  ])("%j → %s", (hsv, hex) => {
    expect(hsvAHex(hsv)).toBe(hex);
  });

  it("360 vale lo mismo que 0 y los negativos dan la vuelta", () => {
    expect(hsvAHex({ h: 360, s: 1, v: 1 })).toBe("#FF0000");
    expect(hsvAHex({ h: -120, s: 1, v: 1 })).toBe("#0000FF");
  });

  it("recorta saturación y brillo fuera de rango", () => {
    expect(hsvAHex({ h: 0, s: 5, v: 9 })).toBe("#FF0000");
    expect(hsvAHex({ h: 0, s: -1, v: -1 })).toBe("#000000");
  });
});

describe("hexAHsv", () => {
  it("lee primarios", () => {
    expect(hexAHsv("#FF0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexAHsv("#0000FF")?.h).toBeCloseTo(240);
  });

  it("los grises no tienen tono ni saturación", () => {
    expect(hexAHsv("#808080")).toMatchObject({ h: 0, s: 0 });
    expect(hexAHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
  });

  it("null si no es un #RRGGBB", () => {
    expect(hexAHsv("")).toBeNull();
    expect(hexAHsv("#12345")).toBeNull();
    expect(hexAHsv("verde")).toBeNull();
    expect(hexAHsv("#GGGGGG")).toBeNull();
  });

  it("ida y vuelta: hex → hsv → hex conserva el color en muchos tonos", () => {
    const muestras = ["#F5F0E1", "#A9B96B", "#1B2A4A", "#D32F2F", "#B9C98F", "#7C8A3B", "#F8C8D8", "#6F4E37", "#2BB5B0", "#C8A2D8", "#010203", "#FEFDFC"];
    for (const hex of muestras) {
      expect(hsvAHex(hexAHsv(hex)!)).toBe(hex);
    }
  });

  it("ida y vuelta exacta en una malla de colores", () => {
    for (let r = 0; r < 256; r += 51) {
      for (let g = 0; g < 256; g += 51) {
        for (let b = 0; b < 256; b += 51) {
          const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
          expect(hsvAHex(hexAHsv(hex)!)).toBe(hex);
        }
      }
    }
  });
});

describe("normalizarHexTecleado", () => {
  it.each([
    ["#a9b96b", "#A9B96B"],
    ["A9B96B", "#A9B96B"],
    ["  a9b96b ", "#A9B96B"],
    ["#fa0", "#FFAA00"],
    ["FA0", "#FFAA00"],
  ])("%s → %s", (entrada, esperado) => {
    expect(normalizarHexTecleado(entrada)).toBe(esperado);
  });

  it.each(["", "#", "#12", "#1234", "#12345", "#1234567", "zzzzzz", "#GG0000"])("rechaza %j", (entrada) => {
    expect(normalizarHexTecleado(entrada)).toBeNull();
  });
});
