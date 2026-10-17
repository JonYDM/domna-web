import { describe, expect, it } from "vitest";
import type { ImagenProducto } from "@/types/api";
import { fotoDeColor, urlGrande, urlMiniatura } from "./fotoPrenda";

const BASE = "https://pub-1.r2.dev/productos/p-1/abc123";

describe("urlMiniatura", () => {
  it("cambia la foto guardada (800) por la de 400", () => {
    expect(urlMiniatura(`${BASE}/800.webp`)).toBe(`${BASE}/400.webp`);
  });

  it("conserva lo que venga después de la ruta", () => {
    expect(urlMiniatura(`${BASE}/800.webp?v=3`)).toBe(`${BASE}/400.webp?v=3`);
  });

  it("deja igual una URL que no sigue la convención", () => {
    expect(urlMiniatura("https://images.example.com/vestido.jpg")).toBe("https://images.example.com/vestido.jpg");
  });

  it("no toca un 800.webp que no sea el nombre del archivo", () => {
    expect(urlMiniatura("https://cdn.example.com/800.webp.jpg")).toBe("https://cdn.example.com/800.webp.jpg");
    expect(urlMiniatura("https://cdn.example.com/p800.webp")).toBe("https://cdn.example.com/p800.webp");
  });

  it("sin URL devuelve undefined", () => {
    expect(urlMiniatura(undefined)).toBeUndefined();
  });
});

describe("urlGrande", () => {
  it("cambia la foto guardada (800) por la de 1600", () => {
    expect(urlGrande(`${BASE}/800.webp`)).toBe(`${BASE}/1600.webp`);
  });

  it("deja igual una URL que no sigue la convención", () => {
    expect(urlGrande("https://images.example.com/vestido.jpg")).toBe("https://images.example.com/vestido.jpg");
  });
});

describe("fotoDeColor", () => {
  const fotos: ImagenProducto[] = [
    { url: "rosa-1", colorId: "c-rosa" },
    { url: "negro-1", colorId: "c-negro" },
    { url: "negro-2", colorId: "c-negro" },
  ];

  it("toma la primera foto del color pedido", () => {
    expect(fotoDeColor(fotos, "c-negro")).toBe("negro-1");
  });

  it("si el color no tiene fotos, usa la primera de la prenda", () => {
    expect(fotoDeColor(fotos, "c-verde")).toBe("rosa-1");
  });

  it("sin color usa la primera de la prenda", () => {
    expect(fotoDeColor(fotos, undefined)).toBe("rosa-1");
  });

  it("sin fotos no hay URL", () => {
    expect(fotoDeColor([], "c-rosa")).toBeUndefined();
  });
});
