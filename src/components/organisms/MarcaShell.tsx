/**
 * Marca de la boutique en el app shell: una esfera rosa difuminada al fondo (detrás del
 * encabezado transparente) y el nombre en blanco encima, con la tipografía del ícono de la app.
 */

/** Ancho aproximado de una letra en mayúsculas bold de 19 px con tracking de 0.14em. */
const PX_POR_LETRA = 16;
/** Alto del encabezado (h-16) y margen lateral del contenido (px-4). */
const ALTO_ENCABEZADO = 64;
const MARGEN_LATERAL = 16;

/**
 * Capa de cristal del encabezado: desenfoque que se desvanece hacia abajo (sin costura contra la
 * esfera ni contra el contenido). Va aparte del contenido para no difuminar el nombre ni los
 * botones; el contenido del encabezado debe ser `relative` para quedar por encima de esta capa.
 */
export function CristalEncabezado() {
  const mascara = "linear-gradient(to bottom, #000 50%, transparent)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.25rem)] backdrop-blur-xl"
      style={{ maskImage: mascara, WebkitMaskImage: mascara }}
    />
  );
}

/** Primera palabra del nombre: es lo que se muestra, igual que el ícono de la PWA ("JESLY"). */
function primeraPalabra(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

/**
 * Esfera al fondo del shell. Va `fixed` y detrás del contenido (el contenedor del shell debe
 * llevar `relative isolate`). Se centra sobre el nombre y crece con su longitud, para que el
 * texto siempre quede sobre el rosa pleno (el núcleo ocupa ~52 % del diámetro).
 */
export function FondoShell({ nombre }: { nombre: string }) {
  const texto = primeraPalabra(nombre).length * PX_POR_LETRA;
  const diametro = Math.max(200, Math.round(texto * 2.2));
  return (
    <div
      aria-hidden
      className="orbe-marca pointer-events-none fixed -z-10 rounded-full"
      style={{
        width: diametro,
        height: diametro,
        top: ALTO_ENCABEZADO / 2 - diametro / 2,
        // El contenido se centra en 72 rem; en pantallas angostas el margen es el px-4 del encabezado.
        left: `calc(max(0px, (100vw - 72rem) / 2) + ${MARGEN_LATERAL + texto / 2 - diametro / 2}px)`,
      }}
    />
  );
}

/**
 * Nombre de la boutique sobre la esfera. En bold de 19 px: el blanco sobre el rosa de marca da
 * 3.6:1, que cumple AA solo para texto grande (≥ 18.66 px en bold); no bajar de ese tamaño.
 * El nombre completo queda disponible para lectores de pantalla.
 */
export function MarcaNombre({ nombre }: { nombre: string }) {
  return (
    <>
      <span aria-hidden className="font-sans text-[19px] font-bold uppercase leading-none tracking-[0.14em] text-white">
        {primeraPalabra(nombre)}
      </span>
      <span className="sr-only">{nombre}</span>
    </>
  );
}
