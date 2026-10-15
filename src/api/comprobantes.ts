import type { Apartado, DatosBancarios } from "@/types/api";
import { ApiError, errorDeRed } from "@/lib/errores";
import { http } from "./http";
import { aApartado, type ApartadoDto } from "./apartados";

/**
 * Transferencias: datos de la cuenta y comprobantes. El comprobante es PRIVADO: la clienta lo sube
 * directo al almacenamiento con una URL firmada de un solo uso, y solo el personal lo abre, con su PIN,
 * por un enlace que dura 2 minutos. Solo existe con la API real.
 */

export function obtenerDatosBancarios(): Promise<DatosBancarios> {
  return http.get<DatosBancarios>("/api/config/datos-bancarios");
}

export function guardarDatosBancarios(datos: { titular: string; banco: string; clabe: string }): Promise<DatosBancarios> {
  return http.post<DatosBancarios>("/api/config/datos-bancarios", datos);
}

/** Tipos que acepta el servidor. */
export const TIPOS_COMPROBANTE = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Sube el comprobante y lo registra en el pedido. `imagen` ya viene comprimida (ver comprimirComprobante).
 * Pasos: 1) pedir dónde subir, 2) PUT directo al almacenamiento, 3) avisar al servidor para que lo valide.
 * `idempotencyKey` evita registrar dos veces el mismo comprobante si se reintenta tras un corte de red.
 */
export async function subirComprobante(apartadoId: string, imagen: Blob, idempotencyKey?: string): Promise<Apartado> {
  const id = encodeURIComponent(apartadoId);
  const tipo = imagen.type || "image/jpeg";
  const firma = await http.post<{ urlSubida: string; clave: string }>(`/api/apartados/${id}/comprobante/firmar`, { contentType: tipo });

  // Subir el archivo puede tardar con señal lenta: 60 s de margen (más que el default de 20 s).
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch(firma.urlSubida, { method: "PUT", headers: { "Content-Type": tipo }, body: imagen, signal: controlador.signal });
  } catch {
    throw errorDeRed("No se pudo subir el comprobante. Revisa tu conexión e intenta de nuevo.");
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new ApiError(res.status, "No se pudo subir el comprobante. Intenta de nuevo.");

  const dto = await http.post<ApartadoDto>(`/api/apartados/${id}/comprobante`, { clave: firma.clave }, { idempotencyKey });
  return aApartado(dto);
}

/** El personal abre un comprobante: el servidor pide el PIN y devuelve un enlace de 2 minutos. */
export function verComprobante(apartadoId: string, abonoId: string, pin: string): Promise<{ url: string; expiraEnSegundos: number }> {
  return http.post(`/api/apartados/${encodeURIComponent(apartadoId)}/abonos/${encodeURIComponent(abonoId)}/comprobante/ver`, { pin });
}
