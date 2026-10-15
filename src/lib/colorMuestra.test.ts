import { describe, expect, it } from "vitest";
import { aplicarColorDeFoto, ajustarColor, hexDeNombre, nombreDeHex, promedioColor } from "./colorMuestra";
import { luminancia } from "./color";

describe("aplicarColorDeFoto", () => {
  it("conserva el color elegido aunque el nombre estuviera vacío (el caso que fallaba)", () => {
    const r = aplicarColorDeFoto({ nombre: "", hex: "#A7D7C5" }, "#E9E4D4", "Marfil");
    expect(r).toEqual({ nombre: "Marfil", hex: "#E9E4D4" });
  });

  it("no pisa un nombre que ya escribieron", () => {
    const r = aplicarColorDeFoto({ nombre: "Mi blanco roto", hex: "" }, "#E9E4D4", "Marfil");
    expect(r).toEqual({ nombre: "Mi blanco roto", hex: "#E9E4D4" });
  });

  it("un nombre de solo espacios cuenta como vacío", () => {
    expect(aplicarColorDeFoto({ nombre: "   ", hex: "" }, "#112233", "Azul marino").nombre).toBe("Azul marino");
  });

  it("no modifica el formulario original", () => {
    const original = { nombre: "", hex: "#A7D7C5" };
    aplicarColorDeFoto(original, "#E9E4D4", "Marfil");
    expect(original).toEqual({ nombre: "", hex: "#A7D7C5" });
  });
});

const canales = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe("hexDeNombre", () => {
  it("devuelve un tono de referencia para nombres conocidos", () => {
    expect(hexDeNombre("Marfil")).toBe("#F5F0E1");
    expect(hexDeNombre("Verde pistache")).toBe("#B9C98F");
  });

  it("ignora mayúsculas, acentos y espacios de más", () => {
    expect(hexDeNombre("  CAFÉ ")).toBe("#6F4E37");
    expect(hexDeNombre("azul   marino")).toBe("#1B2A4A");
    expect(hexDeNombre("SALMON")).toBe("#F4A38C");
  });

  it("null si no reconoce el nombre", () => {
    expect(hexDeNombre("Verde menta fresca")).toBeNull();
    expect(hexDeNombre("")).toBeNull();
    expect(hexDeNombre("   ")).toBeNull();
  });

  it("el tono sugerido para un nombre vuelve a llamarse igual", () => {
    for (const n of ["Marfil", "Beige", "Vino", "Coral", "Mostaza", "Lila", "Azul cielo", "Verde oliva", "Negro", "Blanco"]) {
      expect(nombreDeHex(hexDeNombre(n)!)).toBe(n);
    }
  });
});

describe("ajustarColor", () => {
  it("con 0 y 0 no cambia nada", () => {
    expect(ajustarColor("#a9b96b", 0, 0)).toBe("#A9B96B");
  });

  it("ida y vuelta sin pérdida visible (±1 por canal) para varios colores", () => {
    for (const hex of ["#A9B96B", "#F5F0E1", "#1B2A4A", "#D32F2F", "#808080", "#FFFFFF", "#000000"]) {
      const igual = ajustarColor(hex, 0.0001, 0);
      canales(hex).forEach((v, i) => expect(Math.abs(v - canales(igual)[i])).toBeLessThanOrEqual(2));
    }
  });

  it("calidez positiva calienta: más rojo que azul que antes", () => {
    const frio = "#E8ECF2"; // blanco azulado, como una tela marfil con luz fría
    const [r0, , b0] = canales(frio);
    const [r1, , b1] = canales(ajustarColor(frio, 30, 0));
    expect(r1 - b1).toBeGreaterThan(r0 - b0);
  });

  it("calidez negativa enfría", () => {
    const [r0, , b0] = canales("#F5F0E1");
    const [r1, , b1] = canales(ajustarColor("#F5F0E1", -30, 0));
    expect(r1 - b1).toBeLessThan(r0 - b0);
  });

  it("un blanco azulado puede llegar a Marfil moviendo la calidez (el control alcanza)", () => {
    const frio = "#E4E9F1";
    expect(nombreDeHex(frio)).not.toBe("Marfil");
    const alcanzados = Array.from({ length: 51 }, (_, c) => nombreDeHex(ajustarColor(frio, c, 0)));
    expect(alcanzados).toContain("Marfil");
  });

  it("claridad positiva aclara y negativa oscurece", () => {
    expect(luminancia(ajustarColor("#808080", 0, 20))).toBeGreaterThan(luminancia("#808080"));
    expect(luminancia(ajustarColor("#808080", 0, -20))).toBeLessThan(luminancia("#808080"));
  });

  it("nunca se sale de #000000–#FFFFFF", () => {
    for (const hex of ["#FFFFFF", "#000000", "#00FF00", "#FF0000"]) {
      for (const [c, l] of [[50, 30], [-50, -30], [50, -30], [-50, 30]] as const) {
        expect(ajustarColor(hex, c, l)).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it("deja igual un código inválido", () => {
    expect(ajustarColor("verde", 10, 10)).toBe("verde");
  });
});

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
