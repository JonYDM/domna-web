import { describe, expect, it } from "vitest";
import { haPasadoArriba } from "./useSuperadoArriba";

describe("haPasadoArriba", () => {
  it("false mientras las acciones están a la vista", () => {
    expect(haPasadoArriba({ isIntersecting: true, top: 300, rootTop: 64 })).toBe(false);
  });

  it("false si todavía no se llega a ellas (están más abajo)", () => {
    expect(haPasadoArriba({ isIntersecting: false, top: 900, rootTop: 64 })).toBe(false);
  });

  it("true cuando ya se pasaron por arriba", () => {
    expect(haPasadoArriba({ isIntersecting: false, top: -120, rootTop: 64 })).toBe(true);
  });

  it("true justo al salir por debajo del encabezado fijo", () => {
    expect(haPasadoArriba({ isIntersecting: false, top: 63, rootTop: 64 })).toBe(true);
  });

  it("false si coincide exactamente con el borde y sigue visible", () => {
    expect(haPasadoArriba({ isIntersecting: true, top: 64, rootTop: 64 })).toBe(false);
  });
});
