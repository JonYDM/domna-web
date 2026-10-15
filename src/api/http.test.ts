import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errores";
import { guardarToken, http, limpiarToken, registrarSesionVencida } from "./http";

/** localStorage en memoria (el entorno de test es "node", sin DOM). */
function instalarLocalStorage() {
  const mapa = new Map<string, string>();
  const stub = {
    getItem: (k: string) => (mapa.has(k) ? mapa.get(k)! : null),
    setItem: (k: string, v: string) => void mapa.set(k, String(v)),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
    key: (i: number) => Array.from(mapa.keys())[i] ?? null,
    get length() {
      return mapa.size;
    },
  };
  vi.stubGlobal("localStorage", stub);
}

/** Respuesta simulada mínima para el cliente http (text() + status + ok). */
function respuesta(status: number, cuerpo?: unknown): Response {
  const texto = cuerpo === undefined ? "" : JSON.stringify(cuerpo);
  return {
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(texto),
  } as unknown as Response;
}

/** Ejecuta una promesa que debe fallar y devuelve el ApiError lanzado (falla el test si no lanza). */
async function atrapar(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (e) {
    return e as ApiError;
  }
  throw new Error("Se esperaba que la petición lanzara un error");
}

describe("http: parseo de codigo/datos", () => {
  beforeEach(() => {
    instalarLocalStorage();
    limpiarToken();
    registrarSesionVencida(null);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    limpiarToken();
    registrarSesionVencida(null);
  });

  it("llena codigo y datos del ApiError desde el cuerpo del error (409)", async () => {
    const datos = { dispositivo: "iPhone", creada: "2026-01-01T00:00:00Z", ultimaActividad: "2026-01-02T00:00:00Z" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respuesta(409, { mensaje: "Ya hay una sesión abierta.", codigo: "sesion_activa", datos })),
    );

    const e = await atrapar(http.post("/api/auth/login", { telefono: "777", pin: "000000" }, { conAuth: false }));
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(409);
    expect(e.codigo).toBe("sesion_activa");
    expect(e.datos).toEqual(datos);
    expect(e.message).toBe("Ya hay una sesión abierta.");
  });

  it("no rompe si el cuerpo de error no es JSON (usa mensaje por defecto)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 500, ok: false, text: () => Promise.resolve("<html>500</html>") } as unknown as Response),
    );
    const e = await atrapar(http.get("/api/x"));
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(500);
    expect(e.codigo).toBeUndefined();
    expect(e.message).toBe("Algo salió mal. Intenta de nuevo.");
  });

  it("devuelve el JSON del cuerpo en respuestas OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(200, { dispositivo: "web", expira: "2026-01-01T00:00:00Z" })));
    const r = await http.get<{ dispositivo: string }>("/api/auth/sesion");
    expect(r.dispositivo).toBe("web");
  });
});

describe("http: 401 central con codigo", () => {
  beforeEach(() => {
    instalarLocalStorage();
    limpiarToken();
    registrarSesionVencida(null);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    limpiarToken();
    registrarSesionVencida(null);
  });

  it("en ruta autenticada pasa el codigo al manejador y lanza 401 con ese codigo", async () => {
    guardarToken("tok");
    const manejador = vi.fn();
    registrarSesionVencida(manejador);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respuesta(401, { mensaje: "Entraste en otro lado.", codigo: "sesion_reemplazada" })),
    );

    const e = await atrapar(http.get("/api/auth/sesion"));
    expect(manejador).toHaveBeenCalledWith("sesion_reemplazada");
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(401);
    expect(e.codigo).toBe("sesion_reemplazada");
  });

  it("NO dispara el manejador en rutas de auth (login): el 401 es credencial", async () => {
    const manejador = vi.fn();
    registrarSesionVencida(manejador);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(401, { mensaje: "PIN incorrecto." })));

    const e = await atrapar(http.post("/api/auth/login", { telefono: "7", pin: "0" }, { conAuth: false }));
    expect(manejador).not.toHaveBeenCalled();
    expect(e.status).toBe(401);
  });

  it("NO dispara el manejador si conAuth es false aunque sea otra ruta", async () => {
    const manejador = vi.fn();
    registrarSesionVencida(manejador);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(401, { mensaje: "no auth" })));
    await http.get("/api/catalogo", { conAuth: false }).catch(() => {});
    expect(manejador).not.toHaveBeenCalled();
  });
});

describe("http: cabecera X-Modo-App", () => {
  beforeEach(() => {
    instalarLocalStorage();
    limpiarToken();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Simula la app corriendo instalada (standalone) o en una pestaña normal. */
  function simularEntorno(instalada: boolean) {
    vi.stubGlobal("window", {
      matchMedia: (q: string) => ({ matches: instalada && q === "(display-mode: standalone)" }),
      navigator: {},
    });
  }

  function cabecerasEnviadas(fetchMock: ReturnType<typeof vi.fn>): Record<string, string> {
    return (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
  }

  it("la manda al entrar cuando corre como app instalada", async () => {
    simularEntorno(true);
    const f = vi.fn().mockResolvedValue(respuesta(200, { ok: true }));
    vi.stubGlobal("fetch", f);

    await http.post("/api/auth/login", { telefono: "777", pin: "000000" }, { conAuth: false });

    expect(cabecerasEnviadas(f)["X-Modo-App"]).toBe("instalada");
  });

  it("también al registrarse y al confirmar la recuperación del PIN", async () => {
    simularEntorno(true);
    for (const ruta of ["/api/auth/registrar", "/api/auth/recuperar/confirmar"]) {
      const f = vi.fn().mockResolvedValue(respuesta(200, {}));
      vi.stubGlobal("fetch", f);
      await http.post(ruta, {}, { conAuth: false });
      expect(cabecerasEnviadas(f)["X-Modo-App"]).toBe("instalada");
    }
  });

  it("no la manda desde una pestaña normal del navegador", async () => {
    simularEntorno(false);
    const f = vi.fn().mockResolvedValue(respuesta(200, {}));
    vi.stubGlobal("fetch", f);

    await http.post("/api/auth/login", {}, { conAuth: false });

    expect(cabecerasEnviadas(f)["X-Modo-App"]).toBeUndefined();
  });

  it("no la manda en rutas que no son de entrada (evita una consulta previa de más)", async () => {
    simularEntorno(true);
    for (const ruta of ["/api/productos", "/api/config", "/api/apartados/por-confirmar", "/api/auth/logout"]) {
      const f = vi.fn().mockResolvedValue(respuesta(200, {}));
      vi.stubGlobal("fetch", f);
      await http.get(ruta, { conAuth: false });
      expect(cabecerasEnviadas(f)["X-Modo-App"], ruta).toBeUndefined();
    }
  });
});
