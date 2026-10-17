import { describe, expect, it } from "vitest";
import type { Apartado, PaginaApartados } from "@/types/api";
import { siguientePagina, textoAvance, unirPaginas } from "./paginasPedidos";

const pedido = (id: string) => ({ id }) as Apartado;
const pagina = (n: number, ids: string[], total: number, hayMas: boolean): PaginaApartados => ({
  items: ids.map(pedido),
  total,
  pagina: n,
  tamano: 20,
  hayMas,
});

describe("siguientePagina", () => {
  it("pide la siguiente mientras haya más", () => {
    expect(siguientePagina(pagina(1, ["a"], 40, true))).toBe(2);
    expect(siguientePagina(pagina(4, ["a"], 90, true))).toBe(5);
  });

  it("se detiene en la última", () => {
    expect(siguientePagina(pagina(3, ["a"], 41, false))).toBeUndefined();
  });
});

describe("unirPaginas", () => {
  it("junta las páginas en orden", () => {
    const r = unirPaginas([pagina(1, ["a", "b"], 4, true), pagina(2, ["c", "d"], 4, false)]);
    expect(r.pedidos.map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
    expect(r.total).toBe(4);
  });

  it("quita el pedido que reaparece cuando entró uno nuevo entre dos páginas", () => {
    // Al pedir la 2.ª página ya había un pedido nuevo: "b" (último de la 1.ª) vuelve a salir.
    const r = unirPaginas([pagina(1, ["a", "b"], 4, true), pagina(2, ["b", "c"], 5, false)]);
    expect(r.pedidos.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("usa el total de la última página, que es el más reciente", () => {
    const r = unirPaginas([pagina(1, ["a"], 40, true), pagina(2, ["b"], 41, true)]);
    expect(r.total).toBe(41);
  });

  it("sin páginas no hay pedidos", () => {
    expect(unirPaginas(undefined)).toEqual({ pedidos: [], total: 0 });
    expect(unirPaginas([])).toEqual({ pedidos: [], total: 0 });
  });
});

describe("textoAvance", () => {
  it("dice cuántos se ven de cuántos hay", () => {
    expect(textoAvance(20, 57)).toBe("Mostrando 20 de 57");
  });

  it("no dice nada cuando ya se ve todo", () => {
    expect(textoAvance(5, 5)).toBeNull();
    expect(textoAvance(0, 0)).toBeNull();
  });
});