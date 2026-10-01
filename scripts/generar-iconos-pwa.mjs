// Genera los íconos de la PWA con la ilustración oficial de Domi (public/domi-512.webp).
// Android arma la pantalla de inicio (splash) con el ícono de 512 px + background_color del manifest.
// Uso: node scripts/generar-iconos-pwa.mjs
import sharp from "sharp";

const FONDO = "#FFE8EC"; // rosa claro de marca: el caparazón rojo contrasta
const FUENTE = "public/domi-512.webp";

/**
 * Domi centrada sobre fondo sólido.
 * @param tam lado del ícono en px
 * @param escala ancho de Domi respecto al lado (maskable: ≤ 0.62 para quedar en la zona segura del 80%)
 */
async function icono(ruta, tam, escala) {
  const ancho = Math.round(tam * escala);
  const domi = await sharp(FUENTE).resize({ width: ancho }).png().toBuffer();
  const { height } = await sharp(domi).metadata();
  await sharp({ create: { width: tam, height: tam, channels: 4, background: FONDO } })
    .composite([{ input: domi, left: Math.round((tam - ancho) / 2), top: Math.round((tam - height) / 2 + tam * 0.02) }])
    .png({ compressionLevel: 9 })
    .toFile(ruta);
  console.log("✓", ruta);
}

await icono("public/pwa-192x192.png", 192, 0.8);
await icono("public/pwa-512x512.png", 512, 0.8);
await icono("public/pwa-512x512-maskable.png", 512, 0.6);
await icono("public/apple-touch-icon.png", 180, 0.78); // iOS no admite transparencia: fondo sólido
