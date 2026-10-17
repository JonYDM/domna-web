import { describe, expect, it } from "vitest";
import { urlWhatsApp } from "./whatsapp";

describe("urlWhatsApp", () => {
  it("arma el enlace con el teléfono como se guarda, con espacios", () => {
    expect(urlWhatsApp("777 123 4567")).toBe("https://wa.me/527771234567");
  });

  it("acepta el teléfono con lada de México", () => {
    expect(urlWhatsApp("+52 777 123 4567")).toBe("https://wa.me/527771234567");
    expect(urlWhatsApp("527771234567")).toBe("https://wa.me/527771234567");
  });

  it("agrega el mensaje codificado", () => {
    expect(urlWhatsApp("7771234567", "Hola María, tu saldo es $250 & vence mañana 💕")).toBe(
      "https://wa.me/527771234567?text=Hola%20Mar%C3%ADa%2C%20tu%20saldo%20es%20%24250%20%26%20vence%20ma%C3%B1ana%20%F0%9F%92%95",
    );
  });

  it("sin mensaje o con mensaje vacío no deja un ?text= suelto", () => {
    expect(urlWhatsApp("7771234567", "")).toBe("https://wa.me/527771234567");
  });

  it("no inventa un enlace con un número que no es de 10 dígitos", () => {
    expect(urlWhatsApp("")).toBeNull();
    expect(urlWhatsApp(undefined)).toBeNull();
    expect(urlWhatsApp(null)).toBeNull();
    expect(urlWhatsApp("123")).toBeNull();
    expect(urlWhatsApp("777 123 456")).toBeNull();
    expect(urlWhatsApp("57 777 123 4567")).toBeNull();
  });
});