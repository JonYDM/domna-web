import { describe, expect, it } from "vitest";
import { alturaTeclado } from "./useTecladoVirtual";

describe("alturaTeclado", () => {
  it("0 cuando lo visible es toda la ventana", () => {
    expect(alturaTeclado(800, 800, 0)).toBe(0);
  });

  it("devuelve lo que tapa el teclado", () => {
    expect(alturaTeclado(800, 500, 0)).toBe(300);
  });

  it("en iPhone la ventana se desplaza: cuenta el desplazamiento de arriba", () => {
    // visible: 450 px empezando 40 px más abajo del borde superior → el teclado tapa 800-450-40
    expect(alturaTeclado(800, 450, 40)).toBe(310);
  });

  it("ignora cambios pequeños (barra de direcciones que se esconde)", () => {
    expect(alturaTeclado(800, 740, 0)).toBe(0);
    expect(alturaTeclado(800, 719, 0)).toBe(81);
  });

  it("nunca devuelve negativos", () => {
    expect(alturaTeclado(800, 900, 0)).toBe(0);
  });
});
