import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  VERSION_BORRADOR,
  borrarBorrador,
  guardarBorrador,
  guardarFotosBorrador,
  leerBorrador,
  leerFotosBorrador,
  limpiarBorradoresDeSesion,
  purgarFotosHuerfanas,
  tieneContenido,
  validarBorrador,
  type BorradorProducto,
} from "./borradorProducto";
import type { ImagenProcesada } from "@/lib/imagen";

// --- Stubs en memoria (en node no existen sessionStorage ni indexedDB) --------------------------

/** sessionStorage mínimo sobre un Map, con la API que usa el módulo (incluye key()/length). */
function crearSessionStorage(): Storage {
  const mapa = new Map<string, string>();
  return {
    get length() {
      return mapa.size;
    },
    key(i: number) {
      return Array.from(mapa.keys())[i] ?? null;
    },
    getItem(k: string) {
      return mapa.has(k) ? (mapa.get(k) as string) : null;
    },
    setItem(k: string, v: string) {
      mapa.set(k, String(v));
    },
    removeItem(k: string) {
      mapa.delete(k);
    },
    clear() {
      mapa.clear();
    },
  } as Storage;
}

/**
 * IndexedDB mínimo sobre un Map: solo lo que ejercitan idbGuardar/idbLeer/idbBorrar/idbBorrarPrefijo
 * (open + object store con get/put/delete + openCursor que recorre las claves).
 */
function crearIndexedDB(): IDBFactory {
  const datos = new Map<string, unknown>();

  function nuevaReq<T>(ejecutar: () => T) {
    const req: Record<string, unknown> = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      try {
        req.result = ejecutar();
        (req.onsuccess as (() => void) | null)?.();
      } catch {
        (req.onerror as (() => void) | null)?.();
      }
    });
    return req;
  }

  function nuevoStore() {
    return {
      get: (k: string) => nuevaReq(() => datos.get(k)),
      put: (v: unknown, k: string) => nuevaReq(() => void datos.set(k, v)),
      delete: (k: string) => nuevaReq(() => void datos.delete(k)),
      openCursor: () => {
        const claves = Array.from(datos.keys());
        const req: Record<string, unknown> = { onsuccess: null, onerror: null, result: undefined };
        let i = 0;
        const avanzar = () => {
          if (i >= claves.length) {
            req.result = null;
            (req.onsuccess as (() => void) | null)?.();
            return;
          }
          const key = claves[i++];
          req.result = {
            key,
            delete: () => datos.delete(key),
            continue: () => queueMicrotask(avanzar),
          };
          (req.onsuccess as (() => void) | null)?.();
        };
        queueMicrotask(avanzar);
        return req;
      },
    };
  }

  function nuevaTx() {
    const tx: Record<string, unknown> = { oncomplete: null, onabort: null };
    const store = nuevoStore();
    // Al terminar los microtasks de la operación, se completa la transacción.
    queueMicrotask(() => queueMicrotask(() => (tx.oncomplete as (() => void) | null)?.()));
    return { tx, store };
  }

  return {
    open() {
      const req: Record<string, unknown> = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, result: undefined };
      queueMicrotask(() => {
        req.result = {
          createObjectStore: () => nuevoStore(),
          transaction: () => {
            const { tx, store } = nuevaTx();
            (tx as { objectStore: (n: string) => unknown }).objectStore = () => store;
            return tx;
          },
          close: () => {},
        };
        (req.onsuccess as (() => void) | null)?.();
      });
      return req as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

function foto(): ImagenProcesada {
  const blob = new Blob(["x"], { type: "image/webp" });
  return {
    webp: { 400: blob, 800: blob, 1600: blob },
    preview: "data:image/webp;base64,AAAA",
    colorDominante: "#aabbcc",
    fondoDegradado: "linear-gradient(#000,#111)",
    pesoKb: 12,
    transparente: false,
  };
}

const USUARIO = "u1";

const borradorBase: Omit<BorradorProducto, "version" | "guardado"> = {
  paso: 1,
  nombre: "Corset verde",
  descripcion: "",
  categoriaElegida: "cat-1",
  colorIds: ["c1", "c2"],
  tallasElegidas: ["CH", "M"],
  sucursal: "temixco",
  stock: { temixco: { CH: [1, 0], M: [2, 3] }, azteca: {} },
  precio: "295",
  costo: "",
  permiteApartado: true,
};

beforeEach(() => {
  (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = crearSessionStorage();
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = crearIndexedDB();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).sessionStorage;
  delete (globalThis as Record<string, unknown>).indexedDB;
});

// --- validarBorrador ----------------------------------------------------------------------------

function bueno(extra: Partial<BorradorProducto> = {}): BorradorProducto {
  return { ...borradorBase, version: VERSION_BORRADOR, guardado: "2026-10-15T11:00:00Z", ...extra };
}

describe("validarBorrador", () => {
  it("acepta un borrador completo", () => {
    expect(validarBorrador(bueno())?.nombre).toBe("Corset verde");
  });

  it("acepta categoría y tallas en null (valores por defecto)", () => {
    expect(validarBorrador(bueno({ categoriaElegida: null, tallasElegidas: null }))).not.toBeNull();
  });

  it("ya no descarta por edad: un borrador viejo sigue siendo válido (lo acota la sesión)", () => {
    expect(validarBorrador(bueno({ guardado: "2020-01-01T00:00:00Z" }))).not.toBeNull();
  });

  it.each([
    ["no es objeto", "texto"],
    ["nulo", null],
    ["versión distinta", { ...bueno(), version: 99 }],
    ["fecha rota", { ...bueno(), guardado: "ayer" }],
    ["paso fuera de rango", { ...bueno(), paso: 4 }],
    ["paso negativo", { ...bueno(), paso: -1 }],
    ["nombre no es texto", { ...bueno(), nombre: 5 }],
    ["precio no es texto", { ...bueno(), precio: 295 }],
    ["colores con basura", { ...bueno(), colorIds: ["c1", 2] }],
    ["sucursal inválida", { ...bueno(), sucursal: "narnia" }],
    ["stock negativo", { ...bueno(), stock: { temixco: { M: [-1] }, azteca: {} } }],
    ["stock con decimales", { ...bueno(), stock: { temixco: { M: [1.5] }, azteca: {} } }],
    ["stock sin azteca", { ...bueno(), stock: { temixco: {} } }],
    ["permiteApartado no booleano", { ...bueno(), permiteApartado: "si" }],
  ])("descarta: %s", (_n, crudo) => {
    expect(validarBorrador(crudo)).toBeNull();
  });
});

// --- tieneContenido -----------------------------------------------------------------------------

describe("tieneContenido", () => {
  const vacio = { nombre: "", descripcion: "", colorIds: [] as string[], precio: "", costo: "" };

  it("un formulario recién abierto no es borrador", () => {
    expect(tieneContenido(vacio, false)).toBe(false);
    expect(tieneContenido({ ...vacio, nombre: "   " }, false)).toBe(false);
  });

  it.each([
    ["nombre", { nombre: "Blusa" }],
    ["descripción", { descripcion: "Algodón" }],
    ["colores", { colorIds: ["c1"] }],
    ["precio", { precio: "200" }],
    ["costo", { costo: "100" }],
  ])("sí lo es si hay %s", (_n, extra) => {
    expect(tieneContenido({ ...vacio, ...extra }, false)).toBe(true);
  });

  it("sí lo es si solo hay fotos", () => {
    expect(tieneContenido(vacio, true)).toBe(true);
  });
});

// --- Texto en sessionStorage --------------------------------------------------------------------

describe("borrador de texto en sessionStorage", () => {
  it("guarda y vuelve a leer el borrador del mismo usuario", () => {
    guardarBorrador(USUARIO, borradorBase);
    const leido = leerBorrador(USUARIO);
    expect(leido?.nombre).toBe("Corset verde");
    expect(leido?.version).toBe(VERSION_BORRADOR);
    expect(leido?.guardado).toBeTypeOf("string");
  });

  it("no mezcla borradores de usuarios distintos", () => {
    guardarBorrador("ana", { ...borradorBase, nombre: "De Ana" });
    guardarBorrador("beto", { ...borradorBase, nombre: "De Beto" });
    expect(leerBorrador("ana")?.nombre).toBe("De Ana");
    expect(leerBorrador("beto")?.nombre).toBe("De Beto");
    expect(leerBorrador("otro")).toBeNull();
  });

  it("borrarBorrador quita el texto de ese usuario", async () => {
    guardarBorrador(USUARIO, borradorBase);
    await borrarBorrador(USUARIO);
    expect(leerBorrador(USUARIO)).toBeNull();
  });
});

// --- Fotos y huérfanas --------------------------------------------------------------------------

describe("fotos de borrador ligadas a la sesión de texto", () => {
  it("devuelve las fotos cuando existe el borrador de texto en sessionStorage", async () => {
    guardarBorrador(USUARIO, borradorBase);
    await guardarFotosBorrador(USUARIO, [[foto()]]);
    const leidas = await leerFotosBorrador(USUARIO);
    expect(leidas).not.toBeNull();
    expect(leidas?.[0]?.[0]?.webp[800]).toBeInstanceOf(Blob);
  });

  it("descarta y limpia las fotos huérfanas si NO hay borrador de texto", async () => {
    guardarBorrador(USUARIO, borradorBase);
    await guardarFotosBorrador(USUARIO, [[foto()]]);
    // La sesión muere (p. ej. app reabierta): se pierde el texto pero no las fotos.
    sessionStorage.clear();
    const leidas = await leerFotosBorrador(USUARIO);
    expect(leidas).toBeNull();
    // Se borraron: aunque reponga el texto, ya no quedan fotos.
    guardarBorrador(USUARIO, borradorBase);
    expect(await leerFotosBorrador(USUARIO)).toBeNull();
  });
});

// --- limpiarBorradoresDeSesion ------------------------------------------------------------------

describe("limpiarBorradoresDeSesion", () => {
  it("borra solo las claves con el prefijo de borrador y respeta las demás", async () => {
    guardarBorrador("ana", borradorBase);
    guardarBorrador("beto", borradorBase);
    await guardarFotosBorrador("ana", [[foto()]]);
    sessionStorage.setItem("domna.tema", "oscuro");
    sessionStorage.setItem("otra.cosa", "x");

    await limpiarBorradoresDeSesion();

    expect(leerBorrador("ana")).toBeNull();
    expect(leerBorrador("beto")).toBeNull();
    expect(sessionStorage.getItem("domna.tema")).toBe("oscuro");
    expect(sessionStorage.getItem("otra.cosa")).toBe("x");
    // Reponer el texto no revive las fotos: también se limpiaron.
    guardarBorrador("ana", borradorBase);
    expect(await leerFotosBorrador("ana")).toBeNull();
  });

  it("no lanza si falta indexedDB", async () => {
    delete (globalThis as Record<string, unknown>).indexedDB;
    guardarBorrador(USUARIO, borradorBase);
    await expect(limpiarBorradoresDeSesion()).resolves.toBeUndefined();
    expect(leerBorrador(USUARIO)).toBeNull();
  });
});

// --- purgarFotosHuerfanas -----------------------------------------------------------------------

describe("purgarFotosHuerfanas", () => {
  it("respeta las fotos si hay al menos un borrador de texto en la sesión", async () => {
    guardarBorrador(USUARIO, borradorBase);
    await guardarFotosBorrador(USUARIO, [[foto()]]);
    await purgarFotosHuerfanas();
    expect(await leerFotosBorrador(USUARIO)).not.toBeNull();
  });

  it("borra las fotos si NO quedó ningún borrador de texto (app reabierta)", async () => {
    guardarBorrador(USUARIO, borradorBase);
    await guardarFotosBorrador(USUARIO, [[foto()]]);
    sessionStorage.clear();
    await purgarFotosHuerfanas();
    // Reponer el texto no revive las fotos.
    guardarBorrador(USUARIO, borradorBase);
    expect(await leerFotosBorrador(USUARIO)).toBeNull();
  });

  it("no lanza si falta indexedDB", async () => {
    delete (globalThis as Record<string, unknown>).indexedDB;
    await expect(purgarFotosHuerfanas()).resolves.toBeUndefined();
  });
});
