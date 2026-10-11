import type { ImagenProcesada } from "@/lib/imagen";
import { http, apiActiva } from "./http";

/**
 * Subida de fotos de producto a Cloudflare R2 (Fase 2).
 * Flujo seguro: el backend firma URLs de subida (las llaves nunca salen del servidor); el front
 * sube los WebP directo a R2 con PUT y se queda con la URL pública final para guardarla en el producto.
 */

interface UrlFirmada {
  tamano: string;
  urlSubida: string;
  urlPublica: string;
}
interface FirmaSubida {
  subidas: UrlFirmada[];
}

/** ¿Se pueden subir imágenes? (requiere backend real; el mock no sube nada). */
export const puedeSubirImagenes = apiActiva;

/**
 * Sube los 3 tamaños WebP de una imagen procesada a R2 y devuelve la URL pública principal (800 px).
 * Si no hay backend real o algo falla, devuelve null (el producto se crea sin foto).
 */
export async function subirImagenProducto(
  productoId: string,
  imagen: ImagenProcesada,
): Promise<string | null> {
  if (!apiActiva) return null;

  // 1. Pedir las URLs firmadas (una por tamaño).
  const firma = await http.post<FirmaSubida>("/api/productos/imagenes/firmar", {
    productoId,
    tamanos: ["400", "800", "1600"],
    contentType: "image/webp",
  });

  // 2. Subir cada WebP directo a R2 con PUT (sin token: la URL ya va firmada).
  await Promise.all(
    firma.subidas.map(async (s) => {
      const blob = imagen.webp[Number(s.tamano) as 400 | 800 | 1600];
      if (!blob) return;
      const res = await fetch(s.urlSubida, {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: blob,
      });
      if (!res.ok) throw new Error(`No se pudo subir la imagen (${s.tamano}).`);
    }),
  );

  // 3. La URL pública principal: la del tamaño 800 (buen balance para el catálogo).
  const principal = firma.subidas.find((s) => s.tamano === "800") ?? firma.subidas[0];
  return principal?.urlPublica ?? null;
}

/** Una foto a guardar en el producto, ligada a un color por su índice y con su orden. */
export interface FotoSubida {
  url: string;
  colorIndex: number;
  orden: number;
}

/**
 * Sube VARIAS fotos agrupadas por color (modelo tipo Zara) y devuelve las entradas listas para
 * mandar en imagenes[] al crear el producto. `porColor[i]` = fotos del color de índice i.
 * Respeta el máximo por color en el llamador. Secuencial por color para no saturar la red.
 */
export async function subirFotosPorColor(
  productoId: string,
  porColor: ImagenProcesada[][],
): Promise<FotoSubida[]> {
  if (!apiActiva) return [];
  const resultado: FotoSubida[] = [];
  for (let colorIndex = 0; colorIndex < porColor.length; colorIndex++) {
    const fotos = porColor[colorIndex] ?? [];
    for (let orden = 0; orden < fotos.length; orden++) {
      const url = await subirImagenProducto(productoId, fotos[orden]);
      if (url) resultado.push({ url, colorIndex, orden });
    }
  }
  return resultado;
}
