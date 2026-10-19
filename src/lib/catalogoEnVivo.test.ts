import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conectarCatalogoEnVivo, refrescarPorCambio, type FuenteEventos } from "./catalogoEnVivo";
import { sincronizarCatalogoEntreVentanas } from "./sincronizacionCatalogo";

/** Un canal de eventos de mentira que el propio test controla. */
class FuenteFalsa implements FuenteEventos {
  readyState = 0;
  onerror: ((e: unknown) => void) | null = null;
  cerrada = false;
  private escuchas = new Map<string, (e: { data: string }) => void>();

  constructor(readonly url: string) {}

  addEventListener(tipo: string, escucha: (e: { data: string }) => void) {
    this.escuchas.set(tipo, escucha);
  }

  close() {
    this.cerrada = true;
    this.readyState = 2;
  }

  /** El servidor manda una versión. */
  enviar(version: number) {
    this.escuchas.get("version")?.({ data: String(version) });
  }

  /** Se cayó la conexión: `conectando` = el navegador reintenta solo; si no, quedó cerrada para siempre. */
  fallar(conectando: boolean) {
    this.readyState = conectando ? 0 : 2;
    this.onerror?.({});
  }
}

function montar(opciones: { visibleAlInicio?: boolean } = {}) {
  const fuentes: FuenteFalsa[] = [];
  let visible = opciones.visibleAlInicio ?? true;
  let alVisibilidad: () => void = () => {};
  const alCambiar = vi.fn();
  const quitarVisibilidad = vi.fn();
  const detener = conectarCatalogoEnVivo({
    url: "https://api.test/api/catalogo/eventos",
    alCambiar,
    crearFuente: (url) => {
      const f = new FuenteFalsa(url);
      fuentes.push(f);
      return f;
    },
    estaVisible: () => visible,
    alCambiarVisibilidad: (fn) => {
      alVisibilidad = fn;
      return quitarVisibilidad;
    },
    esperaAgrupar: 400,
    esperaReintento: (n) => 30_000 * (n + 1),
  });
  return {
    fuentes,
    alCambiar,
    detener,
    quitarVisibilidad,
    ocultar() {
      visible = false;
      alVisibilidad();
    },
    mostrar() {
      visible = true;
      alVisibilidad();
    },
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("conectarCatalogoEnVivo", () => {
  it("abre el canal al empezar", () => {
    const m = montar();
    expect(m.fuentes).toHaveLength(1);
    expect(m.fuentes[0].url).toBe("https://api.test/api/catalogo/eventos");
  });

  it("la primera versión solo marca el punto de partida: no refresca", () => {
    const m = montar();
    m.fuentes[0].enviar(7);
    vi.advanceTimersByTime(5_000);
    expect(m.alCambiar).not.toHaveBeenCalled();
  });

  it("una versión nueva refresca, después de una espera corta", () => {
    const m = montar();
    m.fuentes[0].enviar(7);
    m.fuentes[0].enviar(8);
    expect(m.alCambiar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(m.alCambiar).toHaveBeenCalledTimes(1);
  });

  it("varios avisos seguidos se juntan en un solo refresco", () => {
    const m = montar();
    m.fuentes[0].enviar(1);
    for (const v of [2, 3, 4, 5]) {
      m.fuentes[0].enviar(v);
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(1_000);
    expect(m.alCambiar).toHaveBeenCalledTimes(1);
  });

  it("la misma versión otra vez no refresca", () => {
    const m = montar();
    m.fuentes[0].enviar(3);
    m.fuentes[0].enviar(3);
    vi.advanceTimersByTime(2_000);
    expect(m.alCambiar).not.toHaveBeenCalled();
  });

  it("si el servidor se reinició (la versión baja) también refresca", () => {
    const m = montar();
    m.fuentes[0].enviar(40);
    m.fuentes[0].enviar(0);
    vi.advanceTimersByTime(400);
    expect(m.alCambiar).toHaveBeenCalledTimes(1);
  });

  it("ignora un dato que no es número", () => {
    const m = montar();
    m.fuentes[0].enviar(1);
    m.fuentes[0].enviar(Number.NaN);
    vi.advanceTimersByTime(2_000);
    expect(m.alCambiar).not.toHaveBeenCalled();
  });

  it("al esconder la pantalla cierra el canal, y al volver lo reabre", () => {
    const m = montar();
    m.ocultar();
    expect(m.fuentes[0].cerrada).toBe(true);
    m.mostrar();
    expect(m.fuentes).toHaveLength(2);
    expect(m.fuentes[1].cerrada).toBe(false);
  });

  it("si algo cambió mientras la pantalla estaba escondida, al volver refresca", () => {
    const m = montar();
    m.fuentes[0].enviar(5);
    m.ocultar();
    m.mostrar();
    m.fuentes[1].enviar(9); // la versión que trae el canal nuevo ya es otra
    vi.advanceTimersByTime(400);
    expect(m.alCambiar).toHaveBeenCalledTimes(1);
  });

  it("si al volver todo sigue igual, no refresca", () => {
    const m = montar();
    m.fuentes[0].enviar(5);
    m.ocultar();
    m.mostrar();
    m.fuentes[1].enviar(5);
    vi.advanceTimersByTime(2_000);
    expect(m.alCambiar).not.toHaveBeenCalled();
  });

  it("no abre nada si empieza con la pantalla escondida; abre al mostrarse", () => {
    const m = montar({ visibleAlInicio: false });
    expect(m.fuentes).toHaveLength(0);
    m.mostrar();
    expect(m.fuentes).toHaveLength(1);
  });

  it("un tropiezo mientras el navegador reconecta solo no abre otro canal", () => {
    const m = montar();
    m.fuentes[0].fallar(true);
    vi.advanceTimersByTime(120_000);
    expect(m.fuentes).toHaveLength(1);
  });

  it("si el servidor rechaza el canal (quedó cerrado), lo reintenta más tarde y cada vez espera más", () => {
    const m = montar();
    m.fuentes[0].fallar(false);
    expect(m.fuentes[0].cerrada).toBe(true);
    vi.advanceTimersByTime(29_999);
    expect(m.fuentes).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(m.fuentes).toHaveLength(2);

    m.fuentes[1].fallar(false);
    vi.advanceTimersByTime(30_000);
    expect(m.fuentes).toHaveLength(2); // la segunda espera es de 60 s
    vi.advanceTimersByTime(30_000);
    expect(m.fuentes).toHaveLength(3);
  });

  it("al conectar bien se olvida de los fallos anteriores", () => {
    const m = montar();
    m.fuentes[0].fallar(false);
    vi.advanceTimersByTime(30_000);
    m.fuentes[1].enviar(1); // conectó
    m.fuentes[1].fallar(false);
    vi.advanceTimersByTime(30_000); // vuelve a esperar lo del primer fallo
    expect(m.fuentes).toHaveLength(3);
  });

  it("no reintenta mientras la pantalla está escondida", () => {
    const m = montar();
    m.fuentes[0].fallar(false);
    m.ocultar();
    vi.advanceTimersByTime(300_000);
    expect(m.fuentes).toHaveLength(1);
  });

  it("al detener cierra el canal, quita lo que escuchaba y cancela lo pendiente", () => {
    const m = montar();
    m.fuentes[0].enviar(1);
    m.fuentes[0].enviar(2); // refresco pendiente
    m.detener();
    expect(m.fuentes[0].cerrada).toBe(true);
    expect(m.quitarVisibilidad).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5_000);
    expect(m.alCambiar).not.toHaveBeenCalled();
  });

  it("después de detenido no vuelve a abrir nada", () => {
    const m = montar();
    m.fuentes[0].fallar(false);
    m.detener();
    vi.advanceTimersByTime(300_000);
    expect(m.fuentes).toHaveLength(1);
  });
});

describe("refrescarPorCambio", () => {
  // Aquí se espera de verdad a que el canal entre ventanas entregue (o no) un mensaje.
  beforeEach(() => vi.useRealTimers());

  it("vuelve a pedir catálogo, pedidos, pagos y métricas", () => {
    const qc = new QueryClient();
    const espia = vi.spyOn(qc, "invalidateQueries");
    refrescarPorCambio(qc);
    const claves = espia.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey[0]);
    for (const esperada of ["productos", "producto", "categorias", "colores", "config", "apartados", "apartado", "pagos", "tienda", "metricas"]) {
      expect(claves).toContain(esperada);
    }
  });

  it("no se lo repite a las demás ventanas: a todas les llega el aviso del servidor", async () => {
    const qc = new QueryClient();
    const detener = sincronizarCatalogoEntreVentanas(qc);
    const oyente = new BroadcastChannel("domna-catalogo");
    const recibidos: unknown[] = [];
    oyente.onmessage = (e) => recibidos.push(e.data);

    refrescarPorCambio(qc);
    await new Promise((r) => setTimeout(r, 30));
    expect(recibidos).toHaveLength(0);

    // Contraste: una edición hecha en esta ventana sí se difunde.
    void qc.invalidateQueries({ queryKey: ["productos"] });
    await vi.waitFor(() => expect(recibidos.length).toBeGreaterThan(0));

    oyente.close();
    detener();
  });
});
