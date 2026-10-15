import { describe, expect, it } from "vitest";
import { bordesDeScroll } from "./carrusel";

describe("bordesDeScroll", () => {
  it("al inicio solo hay contenido a la derecha", () => {
    expect(bordesDeScroll(0, 300, 900)).toEqual({ izquierda: false, derecha: true });
  });

  it("a la mitad hay de ambos lados", () => {
    expect(bordesDeScroll(250, 300, 900)).toEqual({ izquierda: true, derecha: true });
  });

  it("al final solo hay contenido a la izquierda", () => {
    expect(bordesDeScroll(600, 300, 900)).toEqual({ izquierda: true, derecha: false });
  });

  it("si todo cabe, no hay nada que desplazar", () => {
    expect(bordesDeScroll(0, 300, 300)).toEqual({ izquierda: false, derecha: false });
    expect(bordesDeScroll(0, 300, 250)).toEqual({ izquierda: false, derecha: false });
  });

  it("tolera decimales al terminar el desplazamiento", () => {
    expect(bordesDeScroll(599.4, 300, 900)).toEqual({ izquierda: true, derecha: false });
    expect(bordesDeScroll(0.6, 300, 900)).toEqual({ izquierda: false, derecha: true });
  });
});
