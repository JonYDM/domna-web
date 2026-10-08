import { beforeAll, describe, expect, it, vi } from "vitest";

// localStorage en memoria para el entorno node.
beforeAll(() => {
  const mem = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  });
});

describe("flujo de la demo a través del mock service layer", () => {
  it("apartar → abonar → liquidar, vencer → penalización, pausa de la tienda", async () => {
    const api = await import("./server");
    await api.demoReiniciar();

    // Catálogo y filtros
    const vestidos = await api.listarProductos({ categoria: "vestidos" });
    expect(vestidos.length).toBe(4);
    const tallaM = await api.listarProductos({ talla: "M", color: "negro" });
    expect(tallaM.every((p) => p.colores.some((c) => c.familia === "negro"))).toBe(true);

    // Detalle con disponible por variante
    const det = await api.obtenerProducto(vestidos[0].id);
    const v = det.variantes.find((x) => x.disponible >= 3)!;
    expect(v).toBeDefined();

    // Apartar con anticipo
    const a = await api.crearApartado("c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" });
    expect(a.folio).toMatch(/^DOM-\d{4}$/);
    expect(a.pagado).toBe(Math.ceil(a.total / 2));
    const det2 = await api.obtenerProducto(vestidos[0].id);
    expect(det2.variantes.find((x) => x.id === v.id)!.disponible).toBe(v.disponible - 1);

    // Mis apartados lo incluye; la dueña lo ve en activos
    expect((await api.misApartados("c-maria")).some((x) => x.id === a.id)).toBe(true);
    expect((await api.listarApartados("activo", a.folio)).length).toBe(1);

    // Liquidar
    const liq = await api.registrarAbono({ apartadoId: a.id, monto: a.saldo, metodo: "efectivo" });
    expect(liq.estado).toBe("liquidado");
    expect(liq.saldo).toBe(0);

    // Sin anticipo + avanzar 3 días → vence y penaliza
    const b = await api.crearApartado("c-maria", { varianteId: v.id, cantidad: 1, modalidad: "sin_anticipo", entrega: "temixco" });
    // Cuántos apartados activos de María vencerán en 3 días (el nuevo + los del seed).
    const vencenPronto = (await api.misApartados("c-maria")).filter(
      (x) => x.estado === "activo" && new Date(x.venceEl).getTime() - Date.now() <= 3 * 86_400_000,
    ).length;
    await api.demoAvanzarDias(3);
    expect((await api.obtenerApartado(b.id)).estado).toBe("vencido");
    const pendiente = (await api.obtenerClienta("c-maria")).penalizacionPendiente;
    expect(pendiente).toBe(30 * vencenPronto);
    const cot = await api.cotizarApartado("c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" });
    expect(cot.penalizacion).toBe(pendiente);
    // La clienta ve el aviso de vencido en su app.
    expect((await api.misAvisos("c-maria")).some((a) => a.tipo === "vencido" && a.apartadoId === b.id)).toBe(true);

    // Métricas coherentes
    const m = await api.obtenerMetricas();
    expect(m.apartadosActivos).toBeGreaterThanOrEqual(0);
    expect(m.ventasUltimos7).toHaveLength(7);

    // Kill switch
    await api.demoSuspender(true);
    expect((await api.obtenerConfig()).suspendida).toBe(true);
    await expect(
      api.crearApartado("c-maria", { varianteId: v.id, cantidad: 1, modalidad: "anticipo", entrega: "temixco" }),
    ).rejects.toThrow(/pausa/);
  }, 30_000);

  it("corte del día y ganancia del mes reflejan una venta en físico", async () => {
    const api = await import("./server");
    await api.demoReiniciar();

    // Una variante con stock en Temixco.
    const vestidos = await api.listarProductos({ categoria: "vestidos" });
    const det = await api.obtenerProducto(vestidos[0].id);
    const v = det.variantes.find((x) => x.disponiblePorSucursal.temixco >= 1)!;
    expect(v).toBeDefined();

    const corteAntes = await api.obtenerCorteDia("temixco");

    // Venta en físico (compra de contado) a público general en Temixco.
    const venta = await api.crearApartado("c-publico", {
      lineas: [{ varianteId: v.id, cantidad: 1 }],
      modalidad: "compra",
      entrega: "temixco",
      canal: "fisico",
    });
    expect(venta.canal).toBe("fisico");
    expect(venta.estado).toBe("liquidado");

    const corte = await api.obtenerCorteDia("temixco");
    expect(corte.tickets).toBe(corteAntes.tickets + 1);
    expect(corte.ventasDia).toBe(corteAntes.ventasDia + venta.total);
    expect(corte.piezasDia).toBe(corteAntes.piezasDia + 1);
    // La ganancia del día es positiva (precio > costo en el seed).
    expect(corte.gananciaDia).toBeGreaterThan(corteAntes.gananciaDia);

    // La métrica global incluye gananciaMes.
    const m = await api.obtenerMetricas();
    expect(m.gananciaMes).toBeGreaterThan(0);
    // Filtrar por la otra sucursal no cuenta esta venta de Temixco.
    const soloAzteca = await api.obtenerMetricas({ sucursal: "azteca" });
    expect(soloAzteca.ventasMes).toBeLessThanOrEqual(m.ventasMes);
  }, 30_000);
});
