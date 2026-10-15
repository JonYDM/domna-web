import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errores";
import {
  CODIGO_SESION_ACTIVA,
  cuerpoLogin,
  datosSesionActiva,
  debeComprobarSesion,
  esConflictoDeSesion,
  INTERVALO_COMPROBACION_MS,
  MENSAJE_SESION_VENCIDA_DEFECTO,
  mensajeSesionVencida,
} from "./sesionUnica";

describe("mensajeSesionVencida", () => {
  it("mapea cada código a su aviso", () => {
    expect(mensajeSesionVencida("sesion_reemplazada")).toBe(
      "Tu sesión se cerró porque entraste desde otro dispositivo.",
    );
    expect(mensajeSesionVencida("sesion_expirada")).toBe("Tu sesión venció. Entra de nuevo.");
    expect(mensajeSesionVencida("sesion_cerrada")).toBe("Cerraste sesión.");
    expect(mensajeSesionVencida("sesion_invalida")).toBe(MENSAJE_SESION_VENCIDA_DEFECTO);
  });

  it("usa el mensaje por defecto para código desconocido o ausente", () => {
    expect(mensajeSesionVencida(undefined)).toBe(MENSAJE_SESION_VENCIDA_DEFECTO);
    expect(mensajeSesionVencida("otro_codigo_raro")).toBe(MENSAJE_SESION_VENCIDA_DEFECTO);
    expect(mensajeSesionVencida("")).toBe(MENSAJE_SESION_VENCIDA_DEFECTO);
  });
});

describe("esConflictoDeSesion", () => {
  it("sí: 409 con codigo sesion_activa", () => {
    const e = new ApiError(409, "Ya hay una sesión abierta.", undefined, CODIGO_SESION_ACTIVA);
    expect(esConflictoDeSesion(e)).toBe(true);
  });

  it("no: 409 sin ese código", () => {
    expect(esConflictoDeSesion(new ApiError(409, "Conflicto cualquiera"))).toBe(false);
    expect(esConflictoDeSesion(new ApiError(409, "x", undefined, "otro"))).toBe(false);
  });

  it("no: otro status aunque traiga el código", () => {
    expect(esConflictoDeSesion(new ApiError(401, "x", undefined, CODIGO_SESION_ACTIVA))).toBe(false);
  });

  it("no: lo que no es ApiError", () => {
    expect(esConflictoDeSesion(new Error("boom"))).toBe(false);
    expect(esConflictoDeSesion(null)).toBe(false);
    expect(esConflictoDeSesion({ status: 409, codigo: CODIGO_SESION_ACTIVA })).toBe(false);
  });
});

describe("datosSesionActiva", () => {
  it("extrae dispositivo/creada/ultimaActividad válidos", () => {
    const datos = { dispositivo: "iPhone de Ana", creada: "2026-01-01T00:00:00Z", ultimaActividad: "2026-01-02T00:00:00Z" };
    const e = new ApiError(409, "x", undefined, CODIGO_SESION_ACTIVA, datos);
    expect(datosSesionActiva(e)).toEqual(datos);
  });

  it("null si faltan campos o tienen mal tipo", () => {
    expect(datosSesionActiva(new ApiError(409, "x", undefined, CODIGO_SESION_ACTIVA, { dispositivo: "x" }))).toBeNull();
    expect(
      datosSesionActiva(new ApiError(409, "x", undefined, CODIGO_SESION_ACTIVA, { dispositivo: 1, creada: "a", ultimaActividad: "b" })),
    ).toBeNull();
  });

  it("null si no hay datos o no es ApiError", () => {
    expect(datosSesionActiva(new ApiError(409, "x"))).toBeNull();
    expect(datosSesionActiva(new Error("boom"))).toBeNull();
    expect(datosSesionActiva(null)).toBeNull();
  });
});

describe("cuerpoLogin", () => {
  it("sin reemplazarSesion por defecto no incluye la bandera", () => {
    expect(cuerpoLogin("7771234567", "123456")).toEqual({ telefono: "7771234567", pin: "123456" });
  });

  it("con false tampoco incluye la bandera", () => {
    const c = cuerpoLogin("777", "000000", false);
    expect(c).toEqual({ telefono: "777", pin: "000000" });
    expect("reemplazarSesion" in c).toBe(false);
  });

  it("con true incluye reemplazarSesion: true", () => {
    expect(cuerpoLogin("777", "000000", true)).toEqual({ telefono: "777", pin: "000000", reemplazarSesion: true });
  });
});

describe("debeComprobarSesion", () => {
  it("primera vez (ultima null) siempre sí", () => {
    expect(debeComprobarSesion(null, 0)).toBe(true);
    expect(debeComprobarSesion(null, 999_999)).toBe(true);
  });

  it("no si no han pasado 30 s", () => {
    expect(debeComprobarSesion(1_000, 1_000 + INTERVALO_COMPROBACION_MS - 1)).toBe(false);
    expect(debeComprobarSesion(1_000, 1_000)).toBe(false);
  });

  it("sí justo al cumplir y pasado el intervalo", () => {
    expect(debeComprobarSesion(1_000, 1_000 + INTERVALO_COMPROBACION_MS)).toBe(true);
    expect(debeComprobarSesion(1_000, 1_000 + INTERVALO_COMPROBACION_MS + 1)).toBe(true);
  });

  it("respeta un intervalo personalizado", () => {
    expect(debeComprobarSesion(0, 10, 20)).toBe(false);
    expect(debeComprobarSesion(0, 20, 20)).toBe(true);
  });
});
