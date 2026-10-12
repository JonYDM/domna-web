import { describe, expect, it } from "vitest";
import { aplicarPaletaMarca, contraste, derivarPaleta } from "./paletaMarca";

describe("derivarPaleta", () => {
  it("conserva el color de marca rosa de Jesly para el halo", () => {
    const p = derivarPaleta("#FF228C");
    expect(contraste(p.orbe, "#FFFFFF")).toBeGreaterThanOrEqual(3.5);
    expect(p.orbe.startsWith("#FF")).toBe(true); // sigue siendo el rosa de marca
  });

  it.each(["#FF228C", "#2563EB", "#16A34A", "#F59E0B", "#FACC15", "#7C3AED", "#111111"])(
    "garantiza contraste AA del acento y del botón con %s",
    (hex) => {
      const p = derivarPaleta(hex);
      expect(contraste(p.marca, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.marca, "#FAF8F6")).toBeGreaterThanOrEqual(4.2);
      expect(contraste(p.strong, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.onSoft, p.soft)).toBeGreaterThanOrEqual(7);
    },
  );

  it("rechaza colores inválidos", () => {
    expect(() => derivarPaleta("rosa")).toThrow();
  });
});

describe("aplicarPaletaMarca", () => {
  it("escribe las variables CSS como canales RGB", () => {
    const valores = new Map<string, string>();
    const raiz = { style: { setProperty: (k: string, v: string) => void valores.set(k, v) } } as unknown as HTMLElement;
    aplicarPaletaMarca("#2563EB", raiz);
    expect([...valores.keys()].sort()).toEqual(
      ["--marca", "--marca-hover", "--marca-on-soft", "--marca-orbe", "--marca-rubor", "--marca-soft", "--marca-strong"].sort(),
    );
    for (const v of valores.values()) expect(v).toMatch(/^\d+ \d+ \d+$/);
  });
});
