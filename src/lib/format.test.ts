import { describe, expect, it } from "vitest";
import { formatTelefonoInput } from "./format";

describe("formatTelefonoInput", () => {
  it("solo dígitos, máximo 10, con espacios", () => {
    expect(formatTelefonoInput("777")).toBe("777");
    expect(formatTelefonoInput("7771")).toBe("777 1");
    expect(formatTelefonoInput("7771234567")).toBe("777 123 4567");
    expect(formatTelefonoInput("77712345678999")).toBe("777 123 4567");
    expect(formatTelefonoInput("abc777-12x3")).toBe("777 123");
  });

  it("quita la lada +52 si la pegan", () => {
    expect(formatTelefonoInput("+52 777 123 4567")).toBe("777 123 4567");
  });
});
