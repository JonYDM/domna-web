import { describe, expect, it } from "vitest";
import { accionPrincipal, siguienteEntrega } from "./accionPrincipalPedido";

type Caso = Parameters<typeof accionPrincipal>[0];
const pedido = (c: Partial<Caso>): Caso => ({ estado: "activo", estadoEntrega: "en_origen", porConfirmar: 0, ...c });

describe("accionPrincipal", () => {
  it("un apartado con saldo se cobra", () => {
    expect(accionPrincipal(pedido({}))).toEqual({ tipo: "abonar", label: "Registrar abono" });
  });

  it("si la clienta ya declaró un pago, lo primero es confirmarlo", () => {
    expect(accionPrincipal(pedido({ porConfirmar: 250 }))).toEqual({ tipo: "confirmar-pago", label: "Confirmar el pago" });
  });

  it("sin porConfirmar (dato viejo) se trata como cero", () => {
    expect(accionPrincipal(pedido({ porConfirmar: undefined }))?.tipo).toBe("abonar");
  });

  it("una compra pagada en tienda se entrega", () => {
    expect(accionPrincipal(pedido({ estado: "liquidado", estadoEntrega: "listo" }))).toEqual({
      tipo: "entrega",
      label: "Marcar como entregada",
      siguiente: "entregado",
    });
  });

  it("un pedido pagado que viene de otra sucursal empieza por el traslado", () => {
    expect(accionPrincipal(pedido({ estado: "liquidado", estadoEntrega: "en_origen" }))).toMatchObject({
      tipo: "entrega",
      siguiente: "en_traslado",
    });
    expect(accionPrincipal(pedido({ estado: "liquidado", estadoEntrega: "en_traslado" }))).toMatchObject({
      siguiente: "listo",
    });
  });

  it("lo ya entregado, cancelado o vencido no tiene acción", () => {
    expect(accionPrincipal(pedido({ estado: "liquidado", estadoEntrega: "entregado" }))).toBeNull();
    expect(accionPrincipal(pedido({ estado: "cancelado", estadoEntrega: "listo" }))).toBeNull();
    expect(accionPrincipal(pedido({ estado: "vencido", estadoEntrega: "en_origen" }))).toBeNull();
  });
});

describe("siguienteEntrega", () => {
  it("un apartado activo puede viajar a la otra sucursal pero todavía no se entrega", () => {
    expect(siguienteEntrega(pedido({ estadoEntrega: "en_origen" }))?.estado).toBe("en_traslado");
    expect(siguienteEntrega(pedido({ estadoEntrega: "en_traslado" }))?.estado).toBe("listo");
    expect(siguienteEntrega(pedido({ estadoEntrega: "listo" }))).toBeNull();
  });

  it("un pedido cancelado o vencido no se mueve", () => {
    expect(siguienteEntrega(pedido({ estado: "cancelado" }))).toBeNull();
    expect(siguienteEntrega(pedido({ estado: "vencido" }))).toBeNull();
  });
});