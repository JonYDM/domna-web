import { describe, expect, it } from "vitest";
import { detectarAppInstalada } from "./modoApp";

describe("detectarAppInstalada", () => {
  it("true con display-mode: standalone (Android y escritorio)", () => {
    expect(detectarAppInstalada({ matchMedia: (q) => ({ matches: q === "(display-mode: standalone)" }) })).toBe(true);
  });

  it("true con navigator.standalone (iPhone)", () => {
    expect(detectarAppInstalada({ matchMedia: () => ({ matches: false }), navigator: { standalone: true } })).toBe(true);
  });

  it("false en una pestaña normal del navegador", () => {
    expect(detectarAppInstalada({ matchMedia: () => ({ matches: false }), navigator: { standalone: false } })).toBe(false);
    expect(detectarAppInstalada({ matchMedia: () => ({ matches: false }), navigator: {} })).toBe(false);
  });

  it("false sin entorno (render en servidor / pruebas)", () => {
    expect(detectarAppInstalada(undefined)).toBe(false);
    expect(detectarAppInstalada({})).toBe(false);
  });

  it("no truena si matchMedia falla", () => {
    expect(
      detectarAppInstalada({
        matchMedia: () => {
          throw new Error("no soportado");
        },
        navigator: { standalone: true },
      }),
    ).toBe(true);
  });

  it("solo cuenta standalone === true, no valores truthy", () => {
    expect(detectarAppInstalada({ matchMedia: () => ({ matches: false }), navigator: { standalone: "si" as unknown as boolean } })).toBe(false);
  });
});
