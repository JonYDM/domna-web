import { describe, expect, it } from "vitest";
import { textoPrendas } from "./colorPrendas";

describe("textoPrendas", () => {
  it("singular y plural", () => {
    expect(textoPrendas(1)).toBe("1 prenda");
    expect(textoPrendas(3)).toBe("3 prendas");
  });

  it("cero va en plural", () => {
    expect(textoPrendas(0)).toBe("0 prendas");
  });
});