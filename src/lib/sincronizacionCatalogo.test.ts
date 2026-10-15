import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { esClaveDelCatalogo, sincronizarCatalogoEntreVentanas } from "./sincronizacionCatalogo";

const esperar = (ms = 60) => new Promise((r) => setTimeout(r, ms));

describe("esClaveDelCatalogo", () => {
  it.each(["productos", "producto", "categorias", "colores", "config"])("%s sí", (k) => {
    expect(esClaveDelCatalogo(k)).toBe(true);
  });
  it.each(["apartados", "metricas", "tienda", "clientas", "corte", "pagos", "", 5, null, undefined])("%s no", (k) => {
    expect(esClaveDelCatalogo(k)).toBe(false);
  });
});

describe("sincronizarCatalogoEntreVentanas", () => {
  const desconectar: Array<() => void> = [];
  afterEach(() => {
    desconectar.splice(0).forEach((f) => f());
  });

  function ventana() {
    const qc = new QueryClient();
    const alInvalidar = vi.fn();
    const original = qc.invalidateQueries.bind(qc);
    qc.invalidateQueries = ((f, o) => {
      alInvalidar(f);
      return original(f, o);
    }) as QueryClient["invalidateQueries"];
    desconectar.push(sincronizarCatalogoEntreVentanas(qc));
    return { qc, alInvalidar };
  }

  it("lo que una ventana invalida del catálogo lo invalida también la otra", async () => {
    const a = ventana();
    const b = ventana();

    await a.qc.invalidateQueries({ queryKey: ["productos"] });
    await esperar();

    expect(b.alInvalidar).toHaveBeenCalledWith({ queryKey: ["productos"] });
  });

  it("no rebota: la ventana que recibe no vuelve a avisar", async () => {
    const a = ventana();
    const b = ventana();
    await a.qc.invalidateQueries({ queryKey: ["colores"] });
    await esperar(120);

    // A hizo 1 llamada propia; B recibió 1. Si hubiera rebote, A tendría más.
    expect(a.alInvalidar).toHaveBeenCalledTimes(1);
    expect(b.alInvalidar).toHaveBeenCalledTimes(1);
  });

  it("no avisa de cosas que no son del catálogo", async () => {
    const a = ventana();
    const b = ventana();
    await a.qc.invalidateQueries({ queryKey: ["apartados"] });
    await a.qc.invalidateQueries({ queryKey: ["metricas", "todas"] });
    await esperar();
    expect(b.alInvalidar).not.toHaveBeenCalled();
  });

  it("también avisa si la clave trae más partes (producto + id)", async () => {
    const a = ventana();
    const b = ventana();
    await a.qc.invalidateQueries({ queryKey: ["producto", "p1"] });
    await esperar();
    expect(b.alInvalidar).toHaveBeenCalledWith({ queryKey: ["producto"] });
  });

  it("invalidar sin filtros no truena", async () => {
    const a = ventana();
    await expect(a.qc.invalidateQueries()).resolves.toBeUndefined();
  });

  it("al desconectar vuelve a su comportamiento normal y deja de avisar", async () => {
    const a = ventana();
    const b = ventana();
    desconectar.splice(0).forEach((f) => f());
    await a.qc.invalidateQueries({ queryKey: ["productos"] });
    await esperar();
    expect(b.alInvalidar).not.toHaveBeenCalled();
    expect(a.alInvalidar).toHaveBeenCalledTimes(1);
  });
});
