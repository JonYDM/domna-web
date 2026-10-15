import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guardarToken, leerToken, limpiarToken } from "./http";
import { logout } from "./auth";

/** localStorage en memoria (el entorno de test es "node", sin DOM). */
function instalarLocalStorage() {
  const mapa = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (mapa.has(k) ? mapa.get(k)! : null),
    setItem: (k: string, v: string) => void mapa.set(k, String(v)),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
    key: (i: number) => Array.from(mapa.keys())[i] ?? null,
    get length() {
      return mapa.size;
    },
  });
}

describe("auth.logout (mejor esfuerzo)", () => {
  beforeEach(() => {
    instalarLocalStorage();
    limpiarToken();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    limpiarToken();
  });

  it("no llama al servidor si no hay token", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await logout();
    expect(f).not.toHaveBeenCalled();
  });

  it("llama POST /api/auth/logout cuando hay token", async () => {
    guardarToken("tok");
    const f = vi.fn().mockResolvedValue({ status: 204, ok: true, text: () => Promise.resolve("") } as unknown as Response);
    vi.stubGlobal("fetch", f);
    await logout();
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toContain("/api/auth/logout");
    expect(init.method).toBe("POST");
  });

  it("no se rompe si el logout falla (rechazo de fetch)", async () => {
    guardarToken("tok");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));
    await expect(logout()).resolves.toBeUndefined();
  });

  it("no se rompe ni bloquea si el logout tarda: el timeout corto lo aborta", async () => {
    vi.useFakeTimers();
    guardarToken("tok");
    // fetch que nunca resuelve, pero respeta el abort del AbortController (como el fetch real).
    const fetchColgado = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );
    vi.stubGlobal("fetch", fetchColgado);

    const p = logout();
    // Avanza más allá del timeout corto (4 s) para que el AbortController dispare.
    await vi.advanceTimersByTimeAsync(4_100);
    await expect(p).resolves.toBeUndefined();
  });

  it("logout no borra el token por sí mismo (eso lo hace cerrarSesion aparte)", async () => {
    guardarToken("tok");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 204, ok: true, text: () => Promise.resolve("") } as unknown as Response));
    await logout();
    expect(leerToken()).toBe("tok");
  });
});
